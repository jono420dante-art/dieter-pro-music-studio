-- =============================================================================
-- DIETER PRO - PostgreSQL Database Schema
-- Run: psql -U dieter -d dieter_pro_db -f db/schema.sql
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'studio');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'paused', 'trialing');
CREATE TYPE track_status AS ENUM ('queued', 'processing', 'completed', 'failed');
CREATE TYPE track_visibility AS ENUM ('private', 'public', 'unlisted');
CREATE TYPE job_status AS ENUM ('waiting', 'active', 'completed', 'failed', 'delayed');

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  username      TEXT UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  -- Auth
  password_hash TEXT,                          -- null if OAuth only
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verify_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  -- Subscription
  plan          subscription_plan NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  -- Quotas
  monthly_generations INT NOT NULL DEFAULT 0,
  monthly_limit      INT NOT NULL DEFAULT 5,   -- free tier: 5/mo
  quota_reset_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  -- Timestamps
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ                    -- soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id);
CREATE INDEX idx_users_plan ON users(plan);

-- =============================================================================
-- OAUTH ACCOUNTS
-- =============================================================================

CREATE TABLE oauth_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,                 -- 'google', 'github', 'spotify'
  provider_id   TEXT NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id       TEXT,
  plan                  subscription_plan NOT NULL,
  status                subscription_status NOT NULL DEFAULT 'active',
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at           TIMESTAMPTZ,
  trial_end             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- =============================================================================
-- TRACKS
-- =============================================================================

CREATE TABLE tracks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Metadata
  title           TEXT NOT NULL DEFAULT 'Untitled Track',
  description     TEXT,
  prompt          TEXT NOT NULL,               -- original AI prompt
  genre           TEXT,
  mood            TEXT,
  bpm             INT,
  key             TEXT,                        -- 'C Major', 'A Minor'
  duration_ms     INT,                         -- milliseconds
  -- AI Generation
  ai_provider     TEXT NOT NULL DEFAULT 'suno',-- 'suno', 'udio', 'local'
  ai_model        TEXT,
  ai_job_id       TEXT,                        -- external AI job ID
  generation_params JSONB,                     -- full params used
  -- Files
  audio_url       TEXT,                        -- S3 URL (private)
  public_url      TEXT,                        -- CDN URL (if public)
  waveform_data   JSONB,                       -- peak data for visualizer
  cover_art_url   TEXT,
  file_size_bytes BIGINT,
  format          TEXT DEFAULT 'mp3',
  -- Status
  status          track_status NOT NULL DEFAULT 'queued',
  visibility      track_visibility NOT NULL DEFAULT 'private',
  error_message   TEXT,
  -- Stats
  play_count      INT NOT NULL DEFAULT 0,
  like_count      INT NOT NULL DEFAULT 0,
  download_count  INT NOT NULL DEFAULT 0,
  -- DSP Processing
  dsp_processed   BOOLEAN NOT NULL DEFAULT FALSE,
  dsp_params      JSONB,                       -- applied DSP settings
  -- Timestamps
  generated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tracks_user ON tracks(user_id);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_visibility ON tracks(visibility);
CREATE INDEX idx_tracks_created ON tracks(created_at DESC);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_title_trgm ON tracks USING gin(title gin_trgm_ops);

-- =============================================================================
-- PLAYLISTS
-- =============================================================================

CREATE TABLE playlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  cover_url   TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  track_count INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE playlist_tracks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position    INT NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id, position);

-- =============================================================================
-- LIKES
-- =============================================================================

CREATE TABLE likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id   UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, track_id)
);

-- =============================================================================
-- DSP JOB QUEUE
-- =============================================================================

CREATE TABLE dsp_jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      job_status NOT NULL DEFAULT 'waiting',
  params      JSONB NOT NULL DEFAULT '{}',     -- DSP params: eq, reverb, etc.
  result      JSONB,
  error       TEXT,
  attempts    INT NOT NULL DEFAULT 0,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dsp_jobs_status ON dsp_jobs(status);
CREATE INDEX idx_dsp_jobs_track ON dsp_jobs(track_id);

-- =============================================================================
-- TAGS
-- =============================================================================

CREATE TABLE tags (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE track_tags (
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (track_id, tag_id)
);

-- =============================================================================
-- API KEYS (for external integrations)
-- =============================================================================

CREATE TABLE api_keys (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  key_hash   TEXT NOT NULL UNIQUE,             -- bcrypt hash
  key_prefix TEXT NOT NULL,                    -- first 8 chars for display
  last_used  TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOG
-- =============================================================================

CREATE TABLE audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  action     TEXT NOT NULL,
  resource   TEXT,
  resource_id TEXT,
  metadata   JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================================================
-- TRIGGER: auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

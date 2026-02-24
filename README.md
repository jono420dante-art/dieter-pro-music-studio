# DIETER PRO - AI Music Studio

> Full-stack AI-powered music generation platform built with Next.js 15, Node.js, PostgreSQL, Redis, Python DSP workers, Docker and Nginx.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Services](#services)
- [Quick Start (Local Dev)](#quick-start-local-dev)
- [Environment Variables](#environment-variables)
- [Docker Compose](#docker-compose)
- [Deployment (VPS + Nginx)](#deployment-vps--nginx)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)

---

## Architecture Overview

```
[Browser]
    |
[Nginx :80/:443]  <-- SSL termination, reverse proxy
    |
    |-- /       --> [Next.js App :3000]  (App Router, React 18, Server Actions)
    |-- /api/   --> [Node.js API :4000]  (Fastify, Auth, Jobs, DB)
                         |
               +---------+---------+
               |                   |
         [PostgreSQL]           [Redis]
          (app data)      (sessions, queues, pub/sub)
               |
         [BullMQ Jobs]
               |
    +----------+----------+
    |                     |
[AI Worker :5000]   [Audio DSP :6000]
(OpenAI/Anthropic)  (Python, PyTorch)
               |
         [S3 / R2 Object Storage]
          (stems, mixes, artwork)
```

---

## Project Structure

```
dieter-pro-music-studio/
├── apps/
│   ├── web/                   # Next.js 15 Frontend
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── studio/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── library/page.tsx
│   │   │   ├── explore/page.tsx
│   │   │   └── api/
│   │   │       └── auth/[...nextauth]/route.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── studio/
│   │   │   │   ├── MusicGenerator.tsx
│   │   │   │   ├── GenreGrid.tsx
│   │   │   │   ├── MoodGrid.tsx
│   │   │   │   ├── WaveformPlayer.tsx
│   │   │   │   └── TrackCard.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   └── providers/
│   │   │       └── SessionProvider.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── api/                   # Node.js API (Fastify)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── tracks.ts
│   │   │   │   ├── generate.ts
│   │   │   │   ├── library.ts
│   │   │   │   └── billing.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── rateLimit.ts
│   │   │   ├── db/
│   │   │   │   ├── client.ts
│   │   │   │   ├── migrations/
│   │   │   │   └── schema.sql
│   │   │   ├── queue/
│   │   │   │   └── bullmq.ts
│   │   │   ├── redis/
│   │   │   │   └── client.ts
│   │   │   └── storage/
│   │   │       └── s3.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── ai-worker/             # AI Orchestration Worker
│   │   ├── src/
│   │   │   ├── worker.ts
│   │   │   ├── jobs/
│   │   │   │   ├── generateTrack.ts
│   │   │   │   ├── generateLyrics.ts
│   │   │   │   └── generateArtwork.ts
│   │   │   └── providers/
│   │   │       ├── openai.ts
│   │   │       └── anthropic.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── audio-dsp/             # Python Audio DSP Microservice
│       ├── main.py
│       ├── routes/
│       │   ├── stems.py
│       │   ├── upmix.py
│       │   └── effects.py
│       ├── models/
│       │   └── demucs_handler.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── infra/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── sites/
│   │       └── dieter.conf
│   └── docker/
│       └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── pnpm-workspace.yaml
├── package.json
└── .env.example
```

---

## Services

| Service | Tech | Port | Description |
|---------|------|------|-------------|
| web | Next.js 15 | 3000 | Studio UI, marketing, auth pages |
| api | Node.js/Fastify | 4000 | REST API, auth, job dispatch |
| db | PostgreSQL 16 | 5432 | Primary app database |
| cache | Redis 7 | 6379 | Sessions, rate limiting, queues |
| ai-worker | Node.js | 5000 | LLM orchestration, prompt jobs |
| audio-dsp | Python/FastAPI | 6000 | Stem splitting, FX, upmixing |
| proxy | Nginx | 80/443 | SSL, routing, load balancing |

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Python 3.11+ (for audio-dsp)

```bash
# 1. Clone the repo
git clone https://github.com/jono420dante-art/dieter-pro-music-studio.git
cd dieter-pro-music-studio

# 2. Install all dependencies
pnpm install

# 3. Copy env files and fill in your secrets
cp .env.example .env

# 4. Start all services with Docker Compose
docker compose up -d

# 5. Run DB migrations
pnpm --filter api db:migrate

# 6. Open the app
open http://localhost:3000
```

---

## Environment Variables

Create a `.env` file at the root. Never commit this file.

```env
# =====================
# DATABASE
# =====================
DATABASE_URL=postgresql://dieter:secret@db:5432/dieter

# =====================
# REDIS
# =====================
REDIS_URL=redis://cache:6379

# =====================
# AUTH (NextAuth.js)
# =====================
NEXTAUTH_SECRET=your-super-secret-32-char-string
NEXTAUTH_URL=https://yourdomain.com

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# =====================
# AI PROVIDERS
# =====================
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# =====================
# OBJECT STORAGE (S3/R2)
# =====================
S3_BUCKET=dieter-media
S3_REGION=auto
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# =====================
# STRIPE BILLING
# =====================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# =====================
# INTERNAL SERVICE URLS
# =====================
API_URL=http://api:4000
AI_WORKER_URL=http://ai-worker:5000
AUDIO_DSP_URL=http://audio-dsp:6000

# =====================
# APP
# =====================
NODE_ENV=production
PORT=4000
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Docker Compose

See `infra/docker/docker-compose.yml` for the full configuration.

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Rebuild a single service
docker compose up -d --build web
```

---

## Deployment (VPS + Nginx)

```bash
# On your Hetzner/Contabo VPS (Ubuntu 22.04)

# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# 3. Clone repo
git clone https://github.com/jono420dante-art/dieter-pro-music-studio.git /opt/dieter
cd /opt/dieter

# 4. Set env vars
cp .env.example .env && nano .env

# 5. Start services
docker compose -f infra/docker/docker-compose.yml up -d

# 6. Configure Nginx
sudo cp infra/nginx/sites/dieter.conf /etc/nginx/sites-available/dieter.conf
sudo ln -s /etc/nginx/sites-available/dieter.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

---

## CI/CD with GitHub Actions

Push to `main` triggers:
1. Build Docker images for all services
2. Push images to GHCR
3. SSH into VPS, pull new images, restart containers

See `.github/workflows/deploy.yml` for full workflow.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/refresh | Refresh access token |
| DELETE | /api/auth/logout | Invalidate session |

### Tracks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tracks | List user tracks |
| GET | /api/tracks/:id | Get single track |
| DELETE | /api/tracks/:id | Delete track |
| GET | /api/tracks/:id/download | Download track file |

### Generate
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/generate/track | Queue new AI track generation |
| POST | /api/generate/lyrics | Generate lyrics with AI |
| POST | /api/generate/artwork | Generate cover art |
| GET | /api/generate/status/:jobId | Poll job status |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/billing/plans | List subscription plans |
| POST | /api/billing/checkout | Create Stripe checkout |
| POST | /api/billing/webhook | Stripe webhook handler |
| GET | /api/billing/credits | Get user credit balance |

---

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| / | Home | Landing/marketing page |
| /studio | MusicGenerator | Main AI music studio |
| /studio/[id] | TrackDetail | Track playback + download |
| /library | Library | User's saved tracks |
| /explore | Explore | Browse all public tracks |
| /login | Login | Auth page |
| /register | Register | Sign up page |

---

## License

MIT License - Copyright 2026 DIETER PRO

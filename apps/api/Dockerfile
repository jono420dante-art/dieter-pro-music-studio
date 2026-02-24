# =============================================================================
# DIETER PRO - Fastify API Dockerfile
# Multi-stage build for minimal production image
# =============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN npm install -g pnpm@9.4.0

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --filter @dieter-pro/api

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN npm install -g pnpm@9.4.0
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

WORKDIR /app/apps/api
RUN pnpm build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Copy only production build artifacts
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./dist
COPY --from=deps --chown=apiuser:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

# Environment defaults
ENV NODE_ENV production
ENV PORT 4000
ENV HOST 0.0.0.0

USER apiuser

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

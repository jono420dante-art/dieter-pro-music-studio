// apps/api/src/server.ts
// DIETER PRO - Node.js API Server (Fastify)
// Main entry point: registers plugins, routes, and starts server

import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import { authRoutes } from './routes/auth'
import { trackRoutes } from './routes/tracks'
import { generateRoutes } from './routes/generate'
import { libraryRoutes } from './routes/library'
import { billingRoutes } from './routes/billing'
import { redisClient } from './redis/client'
import { db } from './db/client'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: { colorize: true }
    } : undefined
  }
})

// ============================================================
// PLUGINS
// ============================================================

// CORS - allow Next.js frontend
await app.register(cors, {
  origin: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
  credentials: true
})

// JWT Authentication
await app.register(jwt, {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
})

// Rate Limiting
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  redis: redisClient,
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Try again in a minute.'
  })
})

// File uploads (for stem splitter)
await app.register(multipart, {
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
})

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  service: 'dieter-api',
  version: '1.0.0'
}))

// ============================================================
// ROUTES
// ============================================================
await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(trackRoutes, { prefix: '/api/tracks' })
await app.register(generateRoutes, { prefix: '/api/generate' })
await app.register(libraryRoutes, { prefix: '/api/library' })
await app.register(billingRoutes, { prefix: '/api/billing' })

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
const shutdown = async () => {
  app.log.info('Shutting down...')
  await app.close()
  await db.end()
  await redisClient.quit()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// ============================================================
// START
// ============================================================
const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 4000
    const HOST = process.env.HOST || '0.0.0.0'
    
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`DIETER API running on http://${HOST}:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

// apps/ai-worker/src/worker.ts
// DIETER PRO - AI Worker Service
// Listens to BullMQ queues and processes AI generation jobs
// Handles: track generation, lyrics, artwork via OpenAI/Anthropic

import { Worker, Queue, QueueEvents } from 'bullmq'
import Redis from 'ioredis'
import { generateTrackJob } from './jobs/generateTrack'
import { generateLyricsJob } from './jobs/generateLyrics'
import { generateArtworkJob } from './jobs/generateArtwork'

// ============================================================
// REDIS CONNECTION
// ============================================================
const connection = new Redis(process.env.REDIS_URL || 'redis://cache:6379', {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false
})

// ============================================================
// QUEUES
// ============================================================
export const generateQueue = new Queue('generate', { connection })
export const lyricsQueue = new Queue('lyrics', { connection })
export const artworkQueue = new Queue('artwork', { connection })

// ============================================================
// WORKERS
// ============================================================

// Track Generation Worker
const trackWorker = new Worker(
  'generate',
  async (job) => {
    console.log(`[AI Worker] Processing track job: ${job.id}`)
    console.log(`[AI Worker] Data:`, job.data)

    // Update progress
    await job.updateProgress(10)

    const result = await generateTrackJob(job.data)
    
    await job.updateProgress(100)
    return result
  },
  {
    connection,
    concurrency: 3, // Process 3 jobs at a time
    limiter: {
      max: 10,
      duration: 60000 // 10 jobs per minute (respect OpenAI limits)
    }
  }
)

// Lyrics Generation Worker
const lyricsWorker = new Worker(
  'lyrics',
  async (job) => {
    console.log(`[AI Worker] Processing lyrics job: ${job.id}`)
    await job.updateProgress(10)
    const result = await generateLyricsJob(job.data)
    await job.updateProgress(100)
    return result
  },
  { connection, concurrency: 5 }
)

// Artwork Generation Worker
const artworkWorker = new Worker(
  'artwork',
  async (job) => {
    console.log(`[AI Worker] Processing artwork job: ${job.id}`)
    await job.updateProgress(10)
    const result = await generateArtworkJob(job.data)
    await job.updateProgress(100)
    return result
  },
  { connection, concurrency: 2 }
)

// ============================================================
// EVENT LISTENERS
// ============================================================

const handleWorkerEvents = (worker: Worker, name: string) => {
  worker.on('completed', (job) => {
    console.log(`[${name}] Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[${name}] Job ${job?.id} failed:`, err.message)
  })

  worker.on('progress', (job, progress) => {
    console.log(`[${name}] Job ${job.id} progress: ${progress}%`)
  })

  worker.on('error', (err) => {
    console.error(`[${name}] Worker error:`, err)
  })
}

handleWorkerEvents(trackWorker, 'Track Worker')
handleWorkerEvents(lyricsWorker, 'Lyrics Worker')
handleWorkerEvents(artworkWorker, 'Artwork Worker')

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
const shutdown = async () => {
  console.log('[AI Worker] Shutting down gracefully...')
  await trackWorker.close()
  await lyricsWorker.close()
  await artworkWorker.close()
  await connection.quit()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log('[AI Worker] Started - listening for jobs...')

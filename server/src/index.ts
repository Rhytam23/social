import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import { checkDatabaseConnection } from './db/client'
import { errorHandler } from './middleware/errorHandler'
import contactRoutes from './routes/contact'
import { runMigrations } from './db/migrate'

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express()

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xFrameOptions: { action: 'deny' },
  noSniff: true,
}))

// CORS — allow frontend origin only
if (config.env === 'production') {
  const origin = config.cors.origin
  if (!origin || origin === '*' || !origin.startsWith('https://')) {
    console.error(
      '[FATAL] CORS_ORIGIN must be a specific https:// origin in production ' +
      '(e.g. https://clint-version.vercel.app). Current value is unsafe. Refusing to start.'
    )
    process.exit(1)
  }
}

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
})
app.use('/api', limiter)

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  const dbOk = await checkDatabaseConnection()
  res.status(200).json({
    status: 'ok',
    db: dbOk ? 'connected' : 'disconnected',
    env: config.env,
    timestamp: new Date().toISOString(),
  })
})

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/contact', contactRoutes)

// ─── 404 Catch-all ────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────

async function start() {
  const dbOk = await checkDatabaseConnection()
  if (dbOk) {
    console.log('[Server] Database connection established.')
    try {
      console.log('[Server] Running database migrations check...')
      await runMigrations()
      console.log('[Server] Migrations verified successfully.')
    } catch (migErr) {
      console.warn('[Server] Database migration warning:', migErr)
    }
  } else {
    console.log('[Server] Operating in standalone API mode (Database disconnected).')
  }

  app.listen(config.port, () => {
    console.log(`[Server] Running on http://localhost:${config.port}`)
    console.log(`[Server] Environment: ${config.env}`)
    console.log(`[Server] CORS origin: ${config.cors.origin}`)
  })
}

if (process.env.NODE_ENV !== 'test' && process.env.NO_AUTO_START !== 'true') {
  start().catch((err) => {
    console.error('[Server] Fatal startup error:', err)
    process.exit(1)
  })
}

export default app

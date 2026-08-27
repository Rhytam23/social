import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import { checkDatabaseConnection } from './db/client'
import { errorHandler } from './middleware/errorHandler'

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes     from './routes/auth'
import userRoutes     from './routes/users'
import productRoutes  from './routes/products'
import categoryRoutes from './routes/categories'
import brandRoutes    from './routes/brands'
import searchRoutes   from './routes/search'
import cartRoutes     from './routes/cart'
import wishlistRoutes from './routes/wishlist'
import orderRoutes    from './routes/orders'
import reviewRoutes   from './routes/reviews'
import adminRoutes    from './routes/admin/index'

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express()

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS — allow frontend origin
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

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts.' } },
})

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  const dbOk = await checkDatabaseConnection()
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    env: config.env,
    timestamp: new Date().toISOString(),
  })
})

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth',       authLimiter, authRoutes)
app.use('/api/users',      userRoutes)
app.use('/api/products',   productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/brands',     brandRoutes)
app.use('/api/search',     searchRoutes)
app.use('/api/cart',       cartRoutes)
app.use('/api/wishlist',   wishlistRoutes)
app.use('/api/orders',     orderRoutes)
app.use('/api',            reviewRoutes)
app.use('/api/admin',      adminRoutes)

// ─── 404 Catch-all ────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────

async function start() {
  const dbOk = await checkDatabaseConnection()
  if (!dbOk) {
    console.error('[Server] Cannot connect to database. Check DATABASE_URL and ensure PostgreSQL is running.')
    console.error('[Server] Start anyway in degraded mode? Set ALLOW_DB_FAIL=true to override.')
    if (process.env['ALLOW_DB_FAIL'] !== 'true') {
      process.exit(1)
    }
  } else {
    console.log('[Server] Database connection established.')
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

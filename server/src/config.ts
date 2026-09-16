import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

function optional_env(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

const port = parseInt(optional_env('PORT', '3001'), 10)

export const config = {
  env: (process.env['NODE_ENV'] ?? 'development') as 'development' | 'production' | 'test',
  port,

  apiBaseUrl: optional_env('API_BASE_URL', `http://localhost:${port}`).replace(/\/$/, ''),

  security: {
    rateLimitWindowMs: parseInt(optional_env('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    rateLimitMax: parseInt(optional_env('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },

  cors: {
    origin: optional_env('CORS_ORIGIN', 'http://localhost:5173'),
  },

  frontendUrl: optional_env('FRONTEND_URL', 'http://localhost:5173'),
} as const

export type Config = typeof config

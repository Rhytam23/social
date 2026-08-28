import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

function require_env(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function optional_env(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

const port = parseInt(optional_env('PORT', '3001'), 10)

export const config = {
  env: (process.env['NODE_ENV'] ?? 'development') as 'development' | 'production' | 'test',
  port,

  // Public base URL of this API server — used to build OAuth redirect URIs.
  apiBaseUrl: optional_env('API_BASE_URL', `http://localhost:${port}`).replace(/\/$/, ''),

  db: {
    connectionString: process.env['DATABASE_URL'],
    host: optional_env('DB_HOST', 'localhost'),
    port: parseInt(optional_env('DB_PORT', '5432'), 10),
    database: optional_env('DB_NAME', 'premiumpc'),
    user: optional_env('DB_USER', 'postgres'),
    password: optional_env('DB_PASSWORD', ''),
    ssl: optional_env('DB_SSL', 'false') === 'true',
  },

  jwt: {
    secret: require_env('JWT_SECRET'),
    expiresIn: optional_env('JWT_EXPIRES_IN', '7d'),
  },

  security: {
    bcryptRounds: parseInt(optional_env('BCRYPT_ROUNDS', '12'), 10),
    rateLimitWindowMs: parseInt(optional_env('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    rateLimitMax: parseInt(optional_env('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },

  cors: {
    origin: optional_env('CORS_ORIGIN', 'http://localhost:5173'),
  },

  frontendUrl: optional_env('FRONTEND_URL', 'http://localhost:5173'),

  oauth: {
    google: {
      clientId: process.env['GOOGLE_CLIENT_ID'] || '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
    },
    github: {
      clientId: process.env['GITHUB_CLIENT_ID'] || '',
      clientSecret: process.env['GITHUB_CLIENT_SECRET'] || '',
    },
  },

  pagination: {
    defaultPageSize: parseInt(optional_env('DEFAULT_PAGE_SIZE', '24'), 10),
    maxPageSize: parseInt(optional_env('MAX_PAGE_SIZE', '100'), 10),
  },

  business: {
    taxRate: parseFloat(optional_env('TAX_RATE', '0.085')),
    shippingStandard: parseFloat(optional_env('SHIPPING_RATE_STANDARD', '0')),
    shippingExpress: parseFloat(optional_env('SHIPPING_RATE_EXPRESS', '19.99')),
    freeShippingThreshold: parseFloat(optional_env('FREE_SHIPPING_THRESHOLD', '500')),
  },
} as const

export type Config = typeof config

import { Pool, type PoolClient } from 'pg'
import { config } from '../config'

// ─── Connection Pool ──────────────────────────────────────────────────────────

const pool = new Pool(
  config.db.connectionString
    ? {
        connectionString: config.db.connectionString,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 15_000,
      }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 15_000,
      }
)

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err)
})

// ─── Query Helpers ─────────────────────────────────────────────────────────────

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now()
  const res = await pool.query<T>(text, params)
  const duration = Date.now() - start

  if (config.env === 'development' && duration > 200) {
    console.warn(`[DB] Slow query (${duration}ms): ${text.slice(0, 80)}...`)
  }

  return res.rows
}

export async function queryOne<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

export async function queryCount(text: string, params?: unknown[]): Promise<number> {
  const rows = await query<{ count: string }>(text, params)
  return parseInt(rows[0]?.count ?? '0', 10)
}

// ─── Transaction Helper ───────────────────────────────────────────────────────

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}

export { pool }

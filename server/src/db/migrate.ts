import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { config } from '../config'

export async function runMigrations() {
  const connectionString = process.env['DATABASE_URL_DIRECT'] || config.db.connectionString
  if (!connectionString) {
    console.log('[Migrate] No database connection string provided. Skipping migrations.')
    return
  }

  const pool = new Pool({
    connectionString,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 20_000,
  })

  const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations')

  let client
  try {
    client = await pool.connect()
  } catch (connErr) {
    await pool.end()
    throw connErr
  }

  try {
    // Acquire PostgreSQL advisory lock (84729103) to prevent concurrent migration runs
    await client.query('SELECT pg_advisory_lock(84729103)')

    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // Get applied migrations
    const { rows: applied } = await client.query<{ version: string }>(
      'SELECT version FROM schema_migrations ORDER BY version'
    )
    const appliedVersions = new Set(applied.map((r) => r.version))

    // Read and sort migration files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    let ran = 0
    for (const file of files) {
      const version = file.replace('.sql', '').split('_')[0]
      if (appliedVersions.has(version)) {
        console.log(`  [skip] ${file} — already applied`)
        continue
      }

      console.log(`  [run]  ${file}`)
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING', [version])
        await client.query('COMMIT')
        ran++
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }

    if (ran === 0) {
      console.log('  Database is up to date.')
    } else {
      console.log(`  Applied ${ran} migration(s).`)
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(84729103)')
    } catch {
      // Ignore unlock error if client disconnected
    }
    client.release()
    await pool.end()
  }
}

if (require.main === module) {
  console.log('Running database migrations...')
  runMigrations()
    .then(() => console.log('Migrations complete.'))
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}

import fs from 'fs'
import path from 'path'
import { pool } from './client'

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations')

async function runMigrations() {
  const client = await pool.connect()
  try {
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
    client.release()
    await pool.end()
  }
}

console.log('Running database migrations...')
runMigrations()
  .then(() => console.log('Migrations complete.'))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })

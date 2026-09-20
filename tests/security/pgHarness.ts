import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * A real Postgres (PGlite, WebAssembly) with just enough of Supabase around it
 * (roles, auth.uid(), storage tables) to run the project's own migrations and
 * exercise its row level security exactly as an API client would.
 */

const BOOTSTRAP = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;

  CREATE SCHEMA auth;
  CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    phone TEXT,
    raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_app_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb
  );
  CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
    $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS
    $$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;

  CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS
    $$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

  CREATE SCHEMA storage;
  CREATE TABLE storage.buckets (
    id TEXT PRIMARY KEY, name TEXT, public BOOLEAN DEFAULT false,
    file_size_limit BIGINT, allowed_mime_types TEXT[]
  );
  CREATE TABLE storage.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT, name TEXT, owner UUID
  );
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS
    $$ SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;

  -- Just enough of Realtime Authorization to exercise the broadcast policies.
  CREATE SCHEMA realtime;
  CREATE TABLE realtime.messages (id BIGSERIAL PRIMARY KEY, topic TEXT, extension TEXT, payload JSONB);
  ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
  CREATE FUNCTION realtime.topic() RETURNS TEXT LANGUAGE sql STABLE AS $$ SELECT current_setting('realtime.topic', true) $$;
  GRANT USAGE ON SCHEMA realtime TO anon, authenticated, service_role;
  GRANT ALL ON realtime.messages TO anon, authenticated, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA realtime TO anon, authenticated, service_role;

  CREATE PUBLICATION supabase_realtime;

  -- Supabase grants these to the API roles by default; row level security is what narrows them.
  GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth, storage TO anon, authenticated, service_role;
`;

const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');

/** `upTo` stops before that migration number, to inspect the schema as it was before a fix. */
export async function createDatabase(upTo?: string): Promise<PGlite> {
  const db = new PGlite({ extensions: { uuid_ossp, pgcrypto } });
  await db.exec(BOOTSTRAP);
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{3}_.*\.sql$/.test(f) && (!upTo || f.slice(0, 3) < upTo)).sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    } catch (err) {
      throw new Error(`migration ${file} failed: ${(err as Error).message}`);
    }
  }
  return db;
}

export const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** Runs statements as a signed-in API user (role authenticated, auth.uid() = id). RLS applies. */
export async function asUser<T>(db: PGlite, userId: string, fn: (q: Query) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`SET LOCAL ROLE authenticated`);
    await tx.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    return fn((sql, params) => tx.query(sql, params));
  });
}

/** Runs as the anonymous (not signed in) role. */
export async function asAnon<T>(db: PGlite, fn: (q: Query) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`SET LOCAL ROLE anon`);
    return fn((sql, params) => tx.query(sql, params));
  });
}

export type Query = (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

/** Runs as the trusted server (service role / SQL editor): used only to seed and to inspect. */
export async function seed(db: PGlite, sql: string, params?: unknown[]) {
  return db.query<Record<string, unknown>>(sql, params);
}

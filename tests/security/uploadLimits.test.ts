import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 021: attachments can only be stored through the server's signed addresses, and the daily upload
 * quota is computed from what is actually stored. Real migrations on a real Postgres (PGlite).
 */

const ROOT = uid(1);
const A = uid(2);
const B = uid(3);
const RANDOM = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

async function conversation(db: PGlite, owner: string, other: string): Promise<string> {
  return asUser(db, owner, async (q) => {
    const conv = await q(`INSERT INTO public.conversations (type, created_by) VALUES ('private', $1) RETURNING id`, [owner]);
    const id = conv.rows[0].id as string;
    await q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [id, owner, other]);
    return id;
  });
}

async function seedUsers(db: PGlite) {
  for (const [id, name] of [[ROOT, 'root'], [A, 'alice'], [B, 'bob']] as const) {
    await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
  }
}

const insertObject = (db: PGlite, user: string, conv: string) =>
  asUser(db, user, (q) => q(`INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('encrypted_attachments', $1, $2)`, [`${conv}/${user}_${RANDOM(9)}`, user]));

describe('migration 021: signed uploads only', () => {
  let db: PGlite;
  let conv: string;

  beforeAll(async () => {
    db = await createDatabase();
    await seedUsers(db);
    conv = await conversation(db, A, B);
  }, 120000);

  it('a member can no longer upload straight to the attachments bucket', async () => {
    await expect(insertObject(db, A, conv)).rejects.toThrow();
  });

  it('proof the fix matters: before 021 the same direct upload worked', async () => {
    const before = await createDatabase('021');
    await seedUsers(before);
    const c = await conversation(before, A, B);
    await expect(insertObject(before, A, c)).resolves.toBeDefined();
  }, 120000);

  it('members can still read (download) attachments of their conversation', async () => {
    await seed(db, `INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('encrypted_attachments', $1, $2, '{"size": 1000}')`, [`${conv}/${A}_${RANDOM(1)}`, A]);
    const rows = (await asUser(db, B, (q) => q(`SELECT name FROM storage.objects WHERE bucket_id = 'encrypted_attachments'`))).rows;
    expect(rows).toHaveLength(1);
  });

  it('the bucket takes one opaque file up to 100 MB, and profile photos are small images', async () => {
    const buckets = (await seed(db, `SELECT id, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id IN ('encrypted_attachments', 'avatars') ORDER BY id`)).rows;
    expect(buckets).toEqual([
      { id: 'avatars', file_size_limit: 2097152, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
      { id: 'encrypted_attachments', file_size_limit: 104857600, allowed_mime_types: ['application/octet-stream'] },
    ]);
  });
});

describe('uploaded_bytes_last_day', () => {
  let db: PGlite;
  let conv: string;

  beforeAll(async () => {
    db = await createDatabase();
    await seedUsers(db);
    conv = await conversation(db, A, B);
    const put = (owner: string, n: number, size: number, ageHours: number, bucket = 'encrypted_attachments') =>
      seed(db, `INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_at) VALUES ($1, $2, $3, $4, NOW() - ($5 || ' hours')::interval)`, [bucket, `${conv}/${owner}_${RANDOM(n)}`, owner, JSON.stringify({ size }), String(ageHours)]);
    await put(A, 1, 1000, 1);
    await put(A, 2, 2000, 5);
    await put(A, 3, 5000, 30); // older than a day: not counted
    await put(B, 4, 7000, 1); // someone else
    await put(A, 5, 9000, 1, 'avatars'); // another bucket
  }, 120000);

  const asServer = <T>(fn: (q: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>) => Promise<T>) =>
    db.transaction(async (tx) => {
      await tx.exec('SET LOCAL ROLE service_role');
      return fn((sql, params) => tx.query(sql, params));
    });

  it('adds up only this person, in the last 24 hours, in the attachments bucket', async () => {
    expect(Number((await asServer((q) => q(`SELECT public.uploaded_bytes_last_day($1) AS n`, [A]))).rows[0].n)).toBe(3000);
    expect(Number((await asServer((q) => q(`SELECT public.uploaded_bytes_last_day($1) AS n`, [B]))).rows[0].n)).toBe(7000);
    expect(Number((await asServer((q) => q(`SELECT public.uploaded_bytes_last_day($1) AS n`, [uid(99)]))).rows[0].n)).toBe(0);
  });

  it('is callable by the server only', async () => {
    await expect(asUser(db, A, (q) => q(`SELECT public.uploaded_bytes_last_day($1)`, [A]))).rejects.toThrow();
    await expect(asAnon(db, (q) => q(`SELECT public.uploaded_bytes_last_day($1)`, [A]))).rejects.toThrow();
  });
});

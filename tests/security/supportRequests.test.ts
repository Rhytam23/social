import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 022: support requests, on a real Postgres running the project's migrations.
 * Identities: ADMIN (first account, bootstrapped as platform admin), P and Q (ordinary users), the server.
 */

const ADMIN = uid(1);
const P = uid(2);
const Q = uid(3);

async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean }> {
  try {
    await fn();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

const asServer = <T>(db: PGlite, fn: (q: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>) => Promise<T>) =>
  db.transaction(async (tx) => {
    await tx.exec('SET LOCAL ROLE service_role');
    return fn((sql, params) => tx.query(sql, params));
  });

const submit = (db: PGlite, email = 'pat@example.com', over: { topic?: string; message?: string; user?: string | null } = {}) =>
  asServer(db, (q) =>
    q(`SELECT public.submit_support_request($1, 'Pat', $2, $3, $4, 'From: /contact')`, [over.user ?? null, email, over.topic ?? 'question', over.message ?? 'How do I link my phone?'])
  );

describe('migration 022: support requests', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ADMIN, 'root'], [P, 'pat'], [Q, 'quinn']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    await submit(db, 'first@example.com', { user: P });
  }, 120000);

  it('only platform admins can read requests', async () => {
    expect((await asUser(db, ADMIN, (q) => q(`SELECT id FROM public.support_requests`))).rows).toHaveLength(1);
    expect((await asUser(db, P, (q) => q(`SELECT id FROM public.support_requests`))).rows).toHaveLength(0);
    const anon = await attempt(() => asAnon(db, (q) => q(`SELECT id FROM public.support_requests`)));
    expect(anon.ok).toBe(false);
  });

  it('nobody, not even an admin, can write directly', async () => {
    for (const who of [ADMIN, P]) {
      expect((await attempt(() => asUser(db, who, (q) => q(`INSERT INTO public.support_requests (email, topic, message) VALUES ('x@example.com', 'question', 'a message long enough')`)))).ok).toBe(false);
      expect((await attempt(() => asUser(db, who, (q) => q(`UPDATE public.support_requests SET status = 'resolved'`)))).ok).toBe(false);
      expect((await attempt(() => asUser(db, who, (q) => q(`DELETE FROM public.support_requests`)))).ok).toBe(false);
    }
  });

  it('submitting is for the server only', async () => {
    expect((await attempt(() => asUser(db, P, (q) => q(`SELECT public.submit_support_request(NULL, 'x', 'p@example.com', 'question', 'a message long enough', NULL)`)))).ok).toBe(false);
    expect((await attempt(() => asAnon(db, (q) => q(`SELECT public.submit_support_request(NULL, 'x', 'p@example.com', 'question', 'a message long enough', NULL)`)))).ok).toBe(false);
  });

  it('refuses an unknown topic and a too-short message, and cuts an over-long one to the limit', async () => {
    await expect(submit(db, 'a@example.com', { topic: 'spam' })).rejects.toThrow();
    await expect(submit(db, 'b@example.com', { message: 'short' })).rejects.toThrow();
    await submit(db, 'c@example.com', { message: 'x'.repeat(2500) });
    const stored = (await seed(db, `SELECT length(message) AS n FROM public.support_requests WHERE email = 'c@example.com'`)).rows[0].n;
    expect(stored).toBe(2000);
  });

  it('one email address can send at most 5 requests a day', async () => {
    for (let i = 0; i < 5; i++) await submit(db, 'busy@example.com');
    await expect(submit(db, 'BUSY@example.com')).rejects.toThrow(/too_many_requests/);
    await expect(submit(db, 'other@example.com')).resolves.toBeDefined();
  });

  it('deletes requests older than 90 days when a new one arrives', async () => {
    await seed(db, `INSERT INTO public.support_requests (email, topic, message, created_at) VALUES ('old@example.com', 'question', 'an old request message', NOW() - INTERVAL '91 days')`);
    await submit(db, 'fresh@example.com');
    const rows = (await seed(db, `SELECT count(*)::int AS n FROM public.support_requests WHERE email = 'old@example.com'`)).rows;
    expect(rows[0].n).toBe(0);
  });

  it('an admin can resolve and reopen a request, which is written to the audit log; others cannot', async () => {
    const id = (await seed(db, `SELECT id FROM public.support_requests WHERE email = 'first@example.com'`)).rows[0].id as string;
    expect((await attempt(() => asUser(db, P, (q) => q(`SELECT public.admin_set_support_status($1, 'resolved')`, [id])))).ok).toBe(false);
    await asUser(db, ADMIN, (q) => q(`SELECT public.admin_set_support_status($1, 'resolved')`, [id]));
    expect((await seed(db, `SELECT status FROM public.support_requests WHERE id = $1`, [id])).rows[0].status).toBe('resolved');
    await asUser(db, ADMIN, (q) => q(`SELECT public.admin_set_support_status($1, 'open')`, [id]));
    const audit = (await seed(db, `SELECT action FROM public.admin_audit_log WHERE target_id = $1 ORDER BY created_at`, [id])).rows.map((r) => r.action);
    expect(audit).toEqual(['resolve_support', 'reopen_support']);
    expect((await attempt(() => asUser(db, ADMIN, (q) => q(`SELECT public.admin_set_support_status($1, 'weird')`, [id])))).ok).toBe(false);
  });
});

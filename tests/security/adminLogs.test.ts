import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 019: the admin error log and audit log, exercised on a real Postgres (PGlite) running
 * the project's migrations. Identities: ADMIN (first account, bootstrapped as platform admin),
 * P and Q (ordinary users), and the server (service_role).
 */

const ADMIN = uid(1);
const P = uid(2);
const Q = uid(3);

async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Runs as the trusted server (service_role, which bypasses RLS but only has the privileges it was granted). */
async function asServer<T>(db: PGlite, fn: (q: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec('SET LOCAL ROLE service_role');
    return fn((sql, params) => tx.query(sql, params));
  });
}

const logError = (db: PGlite, fingerprint: string, over: Partial<{ message: string; userId: string | null; source: string; level: string }> = {}) =>
  asServer(db, (q) =>
    q(`SELECT public.log_error($1, $2, 'api.messages.send', $3, 'stack line', $4, $5, '/api/messages', 'agent', 'abc123')`, [
      over.source ?? 'server',
      over.level ?? 'error',
      over.message ?? 'Could not send the message',
      fingerprint,
      over.userId ?? null,
    ])
  );

const rowsAs = async (db: PGlite, user: string, table: string) => (await asUser(db, user, (q) => q(`SELECT * FROM public.${table}`))).rows;

describe('migration 019: admin error log and audit log', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ADMIN, 'root'], [P, 'pat'], [Q, 'quinn']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    await logError(db, 'fp-seed-0001', { userId: P });
    await seed(db, `SELECT public.log_admin_action($1, 'promote_admin', 'user', $2, 'test')`, [ADMIN, P]);
  }, 120000);

  describe('who can read', () => {
    it('anonymous users cannot read either table', async () => {
      for (const table of ['error_logs', 'admin_audit_log']) {
        const r = await attempt(() => asAnon(db, (q) => q(`SELECT * FROM public.${table}`)));
        if (r.ok) {
          const rows = (await asAnon(db, (q) => q(`SELECT * FROM public.${table}`))).rows;
          expect(rows).toHaveLength(0);
        } else {
          expect(r.error).toMatch(/permission denied/i);
        }
      }
    });

    it('an ordinary user sees no rows although rows exist', async () => {
      expect(await rowsAs(db, P, 'error_logs')).toHaveLength(0);
      expect(await rowsAs(db, P, 'admin_audit_log')).toHaveLength(0);
    });

    it('an admin sees the error and who hit it, and the audit entry', async () => {
      const errs = await rowsAs(db, ADMIN, 'error_logs');
      expect(errs).toHaveLength(1);
      expect(errs[0].user_id).toBe(P);
      expect(errs[0].source).toBe('server');
      expect((await rowsAs(db, ADMIN, 'admin_audit_log')).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('who can write', () => {
    it('nobody can insert, update or delete rows directly, not even an admin', async () => {
      for (const user of [P, ADMIN]) {
        const ins = await attempt(() =>
          asUser(db, user, (q) => q(`INSERT INTO public.error_logs (fingerprint, source, area, message) VALUES ('fp-direct-01', 'client', 'x', 'y')`))
        );
        expect(ins.ok).toBe(false);
        const upd = await attempt(() => asUser(db, user, (q) => q(`UPDATE public.error_logs SET status = 'resolved'`)));
        expect(upd.ok).toBe(false);
        const del = await attempt(() => asUser(db, user, (q) => q(`DELETE FROM public.error_logs`)));
        expect(del.ok).toBe(false);
      }
    });

    it('the audit log cannot be edited or deleted through the API, even by an admin', async () => {
      const upd = await attempt(() => asUser(db, ADMIN, (q) => q(`UPDATE public.admin_audit_log SET action = 'x'`)));
      expect(upd.ok).toBe(false);
      const del = await attempt(() => asUser(db, ADMIN, (q) => q(`DELETE FROM public.admin_audit_log`)));
      expect(del.ok).toBe(false);
      const ins = await attempt(() => asUser(db, ADMIN, (q) => q(`INSERT INTO public.admin_audit_log (action) VALUES ('forged')`)));
      expect(ins.ok).toBe(false);
    });

    it('signed-in users cannot call the ingest functions', async () => {
      const a = await attempt(() => asUser(db, P, (q) => q(`SELECT public.log_error('client', 'error', 'x', 'y', null, 'fp-forged-01', null, null, null, null)`)));
      expect(a.ok).toBe(false);
      expect(a.error).toMatch(/permission denied/i);
      const b = await attempt(() => asUser(db, ADMIN, (q) => q(`SELECT public.log_admin_action(null, 'forged', null, null, null)`)));
      expect(b.ok).toBe(false);
      const c = await attempt(() => asAnon(db, (q) => q(`SELECT public.log_error('client', 'error', 'x', 'y', null, 'fp-forged-02', null, null, null, null)`)));
      expect(c.ok).toBe(false);
    });

    it('the server can log', async () => {
      expect((await attempt(() => logError(db, 'fp-server-0001'))).ok).toBe(true);
    });

    it('rejects an invalid source or level', async () => {
      expect((await attempt(() => logError(db, 'fp-bad-0001', { source: 'hacker' }))).ok).toBe(false);
      expect((await attempt(() => logError(db, 'fp-bad-0002', { level: 'fatal' }))).ok).toBe(false);
    });

    it('truncates over-long text instead of storing it', async () => {
      await logError(db, 'fp-long-0001', { message: 'x'.repeat(5000) });
      const r = await seed(db, `SELECT char_length(message) AS n FROM public.error_logs WHERE fingerprint = 'fp-long-0001'`);
      expect(r.rows[0].n).toBe(500);
    });
  });

  describe('deduplication and reopening', () => {
    it('the same error again is one row with a higher counter', async () => {
      await logError(db, 'fp-dup-00001');
      await logError(db, 'fp-dup-00001');
      await logError(db, 'fp-dup-00001');
      const r = await seed(db, `SELECT occurrences FROM public.error_logs WHERE fingerprint = 'fp-dup-00001'`);
      expect(r.rows).toHaveLength(1);
      expect(r.rows[0].occurrences).toBe(3);
    });

    it('a resolved error that happens again is open again', async () => {
      await logError(db, 'fp-reopen-001');
      const id = (await seed(db, `SELECT id FROM public.error_logs WHERE fingerprint = 'fp-reopen-001'`)).rows[0].id as string;
      await asUser(db, ADMIN, (q) => q(`SELECT public.admin_set_error_status($1, 'resolved')`, [id]));
      expect((await seed(db, `SELECT status FROM public.error_logs WHERE id = $1`, [id])).rows[0].status).toBe('resolved');
      await logError(db, 'fp-reopen-001');
      const after = (await seed(db, `SELECT status, resolved_by FROM public.error_logs WHERE id = $1`, [id])).rows[0];
      expect(after.status).toBe('open');
      expect(after.resolved_by).toBeNull();
    });
  });

  describe('admin actions are checked and audited', () => {
    it('an ordinary user cannot resolve or clear', async () => {
      const id = (await seed(db, `SELECT id FROM public.error_logs LIMIT 1`)).rows[0].id as string;
      const a = await attempt(() => asUser(db, P, (q) => q(`SELECT public.admin_set_error_status($1, 'resolved')`, [id])));
      expect(a.ok).toBe(false);
      expect(a.error).toMatch(/forbidden/);
      const b = await attempt(() => asUser(db, P, (q) => q(`SELECT public.admin_clear_errors(false)`)));
      expect(b.ok).toBe(false);
      expect(b.error).toMatch(/forbidden/);
    });

    it('resolving writes an audit row naming the admin', async () => {
      await logError(db, 'fp-audit-0001');
      const id = (await seed(db, `SELECT id FROM public.error_logs WHERE fingerprint = 'fp-audit-0001'`)).rows[0].id as string;
      await asUser(db, ADMIN, (q) => q(`SELECT public.admin_set_error_status($1, 'resolved')`, [id]));
      const audit = await seed(db, `SELECT actor_id, action FROM public.admin_audit_log WHERE target_id = $1`, [id]);
      expect(audit.rows).toHaveLength(1);
      expect(audit.rows[0]).toMatchObject({ actor_id: ADMIN, action: 'resolve_error' });
    });

    it('rejects an invalid status', async () => {
      const id = (await seed(db, `SELECT id FROM public.error_logs LIMIT 1`)).rows[0].id as string;
      const r = await attempt(() => asUser(db, ADMIN, (q) => q(`SELECT public.admin_set_error_status($1, 'deleted')`, [id])));
      expect(r.ok).toBe(false);
    });

    it('clearing resolved keeps open errors, and is audited with the count', async () => {
      const openBefore = Number((await seed(db, `SELECT count(*)::int AS n FROM public.error_logs WHERE status = 'open'`)).rows[0].n);
      const removed = (await asUser(db, ADMIN, (q) => q(`SELECT public.admin_clear_errors(true) AS n`))).rows[0].n as number;
      expect(removed).toBeGreaterThanOrEqual(1);
      expect(Number((await seed(db, `SELECT count(*)::int AS n FROM public.error_logs WHERE status = 'open'`)).rows[0].n)).toBe(openBefore);
      expect(Number((await seed(db, `SELECT count(*)::int AS n FROM public.error_logs WHERE status = 'resolved'`)).rows[0].n)).toBe(0);
      const audit = await seed(db, `SELECT detail FROM public.admin_audit_log WHERE action = 'clear_errors' ORDER BY created_at DESC LIMIT 1`);
      expect(String(audit.rows[0].detail)).toContain(`${removed} removed`);
    });
  });

  describe('retention', () => {
    it('errors not seen for 30 days are deleted when the next one is logged', async () => {
      await logError(db, 'fp-old-000001');
      await seed(db, `UPDATE public.error_logs SET last_seen_at = NOW() - INTERVAL '40 days' WHERE fingerprint = 'fp-old-000001'`);
      await logError(db, 'fp-new-000001');
      const r = await seed(db, `SELECT count(*)::int AS n FROM public.error_logs WHERE fingerprint = 'fp-old-000001'`);
      expect(r.rows[0].n).toBe(0);
    });

    it('the table never holds more than 5,000 rows, and keeps the newest', async () => {
      await seed(db, `DELETE FROM public.error_logs`);
      await seed(
        db,
        `INSERT INTO public.error_logs (fingerprint, source, area, message, last_seen_at)
         SELECT 'fp-bulk-' || g, 'server', 'bulk', 'bulk', NOW() - (g || ' seconds')::interval FROM generate_series(1, 5010) g`
      );
      await logError(db, 'fp-cap-newest');
      const n = Number((await seed(db, `SELECT count(*)::int AS n FROM public.error_logs`)).rows[0].n);
      expect(n).toBeLessThanOrEqual(5000);
      expect((await seed(db, `SELECT count(*)::int AS n FROM public.error_logs WHERE fingerprint = 'fp-cap-newest'`)).rows[0].n).toBe(1);
    }, 120000);
  });
});

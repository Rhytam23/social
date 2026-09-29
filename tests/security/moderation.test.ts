import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 024: reports, warnings, temporary bans, blocks. Real migrations on a real Postgres.
 * ROOT is the platform admin. T is the person being reported. R1.. are reporters (accounts a few days old).
 * Thresholds: 3 different reporters = warning, 10 = 7-day ban, 20 = permanent block.
 */

const ROOT = uid(1);
const T = uid(2);
const reporter = (i: number) => uid(100 + i);

async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const asServer = <T>(db: PGlite, fn: (q: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>) => Promise<T>) =>
  db.transaction(async (tx) => {
    await tx.exec('SET LOCAL ROLE service_role');
    return fn((sql, params) => tx.query(sql, params));
  });

async function makeUser(db: PGlite, id: string, name: string, ageDays = 3) {
  await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
  await seed(db, `UPDATE public.profiles SET created_at = NOW() - ($2 || ' days')::interval WHERE id = $1`, [id, String(ageDays)]);
}

/** Puts two people in a conversation together (as the trusted server, to keep the setup fast). */
async function shareChat(db: PGlite, a: string, b: string): Promise<string> {
  const conv = (await seed(db, `INSERT INTO public.conversations (type, created_by) VALUES ('private', $1) RETURNING id`, [a])).rows[0].id as string;
  await seed(db, `INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [conv, a, b]);
  return conv;
}

const report = (db: PGlite, from: string, about: string, conv: string, reason = 'abusive messages') =>
  asUser(db, from, (q) => q(`INSERT INTO public.reports (reporter_id, reported_user_id, conversation_id, reason) VALUES ($1, $2, $3, $4)`, [from, about, conv, reason]));

describe('migration 024: reports, warnings and bans', () => {
  let db: PGlite;
  const convs = new Map<number, string>();

  const target = async (): Promise<{ warned: boolean; until: string | null; authUntil: string | null }> => {
    const m = (await seed(db, `SELECT warned_at, banned_until FROM public.user_moderation WHERE user_id = $1`, [T])).rows[0] as { warned_at: string | null; banned_until: string | null } | undefined;
    const a = (await seed(db, `SELECT banned_until FROM auth.users WHERE id = $1`, [T])).rows[0] as { banned_until: string | null };
    return { warned: !!m?.warned_at, until: m?.banned_until ? new Date(m.banned_until).toISOString() : null, authUntil: a.banned_until ? new Date(a.banned_until).toISOString() : null };
  };

  beforeAll(async () => {
    db = await createDatabase();
    await makeUser(db, ROOT, 'root');
    await makeUser(db, T, 'target');
    for (let i = 1; i <= 25; i++) {
      await makeUser(db, reporter(i), `rep${i}`);
      convs.set(i, await shareChat(db, reporter(i), T));
    }
    await makeUser(db, uid(300), 'fresh', 0); // an account created just now
    convs.set(300, await shareChat(db, uid(300), T));
    await makeUser(db, uid(301), 'stranger');
  }, 180000);

  describe('who may report whom', () => {
    it('someone you share no conversation with cannot be reported', async () => {
      const conv = convs.get(1)!;
      const r = await attempt(() => report(db, uid(301), T, conv));
      expect(r.ok).toBe(false);
    });

    it('you cannot report yourself, report as someone else, or use a conversation you are not in', async () => {
      expect((await attempt(() => report(db, reporter(1), reporter(1), convs.get(1)!))).ok).toBe(false);
      expect((await attempt(() => asUser(db, reporter(1), (q) => q(`INSERT INTO public.reports (reporter_id, reported_user_id, reason) VALUES ($1, $2, 'x')`, [reporter(2), T])))).ok).toBe(false);
      expect((await attempt(() => report(db, reporter(1), T, convs.get(2)!))).ok).toBe(false);
    });

    it('a report about a message needs a person (reported_user_id is required)', async () => {
      expect((await attempt(() => asUser(db, reporter(1), (q) => q(`INSERT INTO public.reports (reporter_id, reason) VALUES ($1, 'x')`, [reporter(1)])))).ok).toBe(false);
    });
  });

  describe('warning at 3 different people', () => {
    it('one person reporting again and again counts once', async () => {
      for (let i = 0; i < 4; i++) await report(db, reporter(1), T, convs.get(1)!);
      expect((await target()).warned).toBe(false);
    });

    it('a brand-new account does not count', async () => {
      await report(db, uid(300), T, convs.get(300)!);
      await report(db, reporter(2), T, convs.get(2)!);
      expect((await target()).warned).toBe(false); // reporters 1 and 2 only
    });

    it('the third different reporter triggers a warning the person can see once, without names', async () => {
      await report(db, reporter(3), T, convs.get(3)!);
      expect((await target()).warned).toBe(true);
      expect((await asUser(db, T, (q) => q(`SELECT public.get_my_warning() AS w`))).rows[0].w).toBe(true);
      await asUser(db, T, (q) => q(`SELECT public.acknowledge_warning()`));
      expect((await asUser(db, T, (q) => q(`SELECT public.get_my_warning() AS w`))).rows[0].w).toBe(false);
      // Nothing about who reported can be read by the reported person.
      expect((await asUser(db, T, (q) => q(`SELECT * FROM public.reports`))).rows).toHaveLength(0);
      expect((await attempt(() => asUser(db, T, (q) => q(`SELECT * FROM public.user_moderation`)))).ok).toBe(false);
      expect((await target()).until).toBeNull();
    });

    it('an admin dismissing a report takes it out of the count', async () => {
      const ids = (await seed(db, `SELECT id FROM public.reports WHERE reporter_id = $1`, [reporter(3)])).rows.map((r) => r.id as string);
      await asUser(db, ROOT, (q) => q(`UPDATE public.reports SET status = 'dismissed' WHERE id = ANY($1::uuid[])`, [ids]));
      expect((await seed(db, `SELECT public.eligible_reporter_count($1) AS n`, [T])).rows[0].n).toBe(2);
      await seed(db, `UPDATE public.reports SET status = 'open' WHERE id = ANY($1::uuid[])`, [ids]);
      expect((await seed(db, `SELECT public.eligible_reporter_count($1) AS n`, [T])).rows[0].n).toBe(3);
    });
  });

  describe('temporary ban at 10 different people', () => {
    beforeAll(async () => {
      await asServer(db, (q) => q(`SELECT public.record_user_ip($1, '203.0.113.7')`, [T]));
      await asServer(db, (q) => q(`SELECT public.record_user_ip($1, '2001:db8::1')`, [T]));
      await seed(db, `INSERT INTO auth.sessions (user_id) VALUES ($1), ($1)`, [T]);
    });

    it('nine different people do not ban', async () => {
      for (let i = 4; i <= 9; i++) await report(db, reporter(i), T, convs.get(i)!);
      expect((await target()).until).toBeNull();
    });

    it('the tenth bans for 7 days: no sign-in, sessions ended, email and addresses blocked for the same time', async () => {
      await report(db, reporter(10), T, convs.get(10)!);
      const t = await target();
      expect(t.until).not.toBeNull();
      const days = (new Date(t.until as string).getTime() - Date.now()) / 86400000;
      expect(days).toBeGreaterThan(6.9);
      expect(days).toBeLessThan(7.1);
      expect(t.authUntil).toBe(t.until); // Supabase Auth refuses sign-in and refresh for this account
      expect((await seed(db, `SELECT count(*)::int AS n FROM auth.sessions WHERE user_id = $1`, [T])).rows[0].n).toBe(0);

      const blocks = (await seed(db, `SELECT kind, value, expires_at FROM public.blocked_identities ORDER BY kind, value`)).rows;
      expect(blocks.map((b) => `${b.kind}:${b.value}`)).toEqual(['email:target@example.com', 'ip:2001:db8::1', 'ip:203.0.113.7']);
      expect(blocks.every((b) => b.expires_at !== null)).toBe(true);
    });

    it('a later report while banned does not restart the ban', async () => {
      const before = (await target()).until;
      await report(db, reporter(11), T, convs.get(11)!);
      expect((await target()).until).toBe(before);
    });
  });

  describe('the sign-up hook', () => {
    const hook = (email: string, ip?: string) =>
      seed(db, `SELECT public.hook_before_user_created($1::jsonb) AS r`, [JSON.stringify({ user: { email }, metadata: ip ? { ip_address: ip } : {} })]).then((r) => r.rows[0].r as Record<string, unknown>);

    it('refuses a blocked email (any letter case) and a blocked address', async () => {
      expect(await hook('Target@Example.com')).toMatchObject({ error: { http_code: 403 } });
      expect(await hook('someone-new@example.com', '203.0.113.7')).toMatchObject({ error: { http_code: 403 } });
      expect(await hook('someone-new@example.com', '2001:db8::1')).toMatchObject({ error: { http_code: 403 } });
    });

    it('lets everyone else in, including when the address is unknown', async () => {
      expect(await hook('someone-new@example.com', '198.51.100.9')).toEqual({});
      expect(await hook('someone-new@example.com')).toEqual({});
    });

    it('ignores a block that has run out', async () => {
      await seed(db, `UPDATE public.blocked_identities SET expires_at = NOW() - INTERVAL '1 minute' WHERE value = '203.0.113.7'`);
      expect(await hook('someone-new@example.com', '203.0.113.7')).toEqual({});
      await seed(db, `UPDATE public.blocked_identities SET expires_at = NOW() + INTERVAL '3 days' WHERE value = '203.0.113.7'`);
    });

    it('can only be called by the auth service', async () => {
      expect((await attempt(() => asUser(db, T, (q) => q(`SELECT public.hook_before_user_created('{}'::jsonb)`)))).ok).toBe(false);
      expect((await attempt(() => asAnon(db, (q) => q(`SELECT public.hook_before_user_created('{}'::jsonb)`)))).ok).toBe(false);
    });
  });

  describe('permanent block at 20 different people', () => {
    it('the twentieth blocks for good', async () => {
      for (let i = 12; i <= 20; i++) await report(db, reporter(i), T, convs.get(i)!);
      const t = await target();
      expect(new Date(t.until as string).getUTCFullYear()).toBe(9999);
      const email = (await seed(db, `SELECT expires_at FROM public.blocked_identities WHERE kind = 'email' AND value = 'target@example.com'`)).rows[0];
      expect(email.expires_at).toBeNull();
    });
  });

  describe('admin actions', () => {
    it('are refused for everyone who is not a platform admin', async () => {
      for (const sql of [`SELECT public.admin_moderation_overview()`, `SELECT public.admin_blocked_identities()`, `SELECT public.admin_ban_user('${T}', 1, 'x')`, `SELECT public.admin_unban_user('${T}')`, `SELECT public.admin_unblock_identity('${uid(500)}')`]) {
        expect((await attempt(() => asUser(db, reporter(1), (q) => q(sql)))).ok, sql).toBe(false);
      }
    });

    it('the overview lists the reported person with the number of different reporters', async () => {
      const rows = (await asUser(db, ROOT, (q) => q(`SELECT user_id, distinct_reporters, warned, banned_until FROM public.admin_moderation_overview()`))).rows;
      const mine = rows.find((r) => r.user_id === T)!;
      expect(mine.distinct_reporters).toBe(20);
      expect(mine.warned).toBe(true);
      expect(rows[0].user_id).toBe(T); // most reported first
    });

    it('an admin can undo a ban: sign-in works again and the blocks are removed', async () => {
      await asUser(db, ROOT, (q) => q(`SELECT public.admin_unban_user($1)`, [T]));
      const t = await target();
      expect(t.until).toBeNull();
      expect(t.authUntil).toBeNull();
      expect((await seed(db, `SELECT count(*)::int AS n FROM public.blocked_identities`)).rows[0].n).toBe(0);
    });

    it('an admin can ban for a number of days or for good, and unblock a single address', async () => {
      await asServer(db, (q) => q(`SELECT public.record_user_ip($1, '198.51.100.20')`, [T]));
      await asUser(db, ROOT, (q) => q(`SELECT public.admin_ban_user($1, 3, 'harassment')`, [T]));
      expect(new Date((await target()).until as string).getTime() - Date.now()).toBeLessThan(3.1 * 86400000);
      const list = (await asUser(db, ROOT, (q) => q(`SELECT id, kind, value, accounts_seen FROM public.admin_blocked_identities()`))).rows;
      const ip = list.find((b) => b.kind === 'ip')!;
      expect(ip.accounts_seen).toBe(1);
      await asUser(db, ROOT, (q) => q(`SELECT public.admin_unblock_identity($1)`, [ip.id]));
      // The email and the other two addresses stay blocked; only the one an admin lifted is gone.
      const left = (await asUser(db, ROOT, (q) => q(`SELECT kind, value FROM public.admin_blocked_identities()`))).rows;
      expect(left.map((r) => r.kind).sort()).toEqual(['email', 'ip', 'ip']);
      expect(left.map((r) => r.value)).not.toContain(ip.value);
      await asUser(db, ROOT, (q) => q(`SELECT public.admin_ban_user($1, 0, 'for good')`, [T]));
      expect(new Date((await target()).until as string).getUTCFullYear()).toBe(9999);
    });

    it('platform admins and the caller themselves cannot be banned', async () => {
      expect((await attempt(() => asUser(db, ROOT, (q) => q(`SELECT public.admin_ban_user($1, 1, 'x')`, [ROOT])))).ok).toBe(false);
      await seed(db, `UPDATE public.profiles SET is_admin = true WHERE id = $1`, [uid(301)]);
      expect((await attempt(() => asUser(db, ROOT, (q) => q(`SELECT public.admin_ban_user($1, 1, 'x')`, [uid(301)])))).ok).toBe(false);
    });

    it('every action is in the activity log', async () => {
      const actions = (await seed(db, `SELECT DISTINCT action FROM public.admin_audit_log WHERE action IN ('auto_warn','auto_temp_ban','auto_block','ban_user','unban_user','unblock_identity') ORDER BY action`)).rows.map((r) => r.action);
      expect(actions).toEqual(['auto_block', 'auto_temp_ban', 'auto_warn', 'ban_user', 'unban_user', 'unblock_identity']);
    });
  });

  describe('platform admins are never banned automatically', () => {
    it('20 reports about an admin change nothing', async () => {
      for (let i = 1; i <= 20; i++) {
        const conv = await shareChat(db, reporter(i), ROOT);
        await report(db, reporter(i), ROOT, conv);
      }
      const m = (await seed(db, `SELECT * FROM public.user_moderation WHERE user_id = $1`, [ROOT])).rows;
      expect(m).toHaveLength(0);
      expect((await seed(db, `SELECT banned_until FROM auth.users WHERE id = $1`, [ROOT])).rows[0].banned_until).toBeNull();
    });
  });

  describe('privacy of the data', () => {
    it('signed-in and anonymous callers cannot read or write the moderation tables directly', async () => {
      for (const table of ['user_ips', 'blocked_identities', 'user_moderation']) {
        expect((await attempt(() => asUser(db, ROOT, (q) => q(`SELECT * FROM public.${table}`)))).ok, `${table} (admin)`).toBe(false);
        expect((await attempt(() => asUser(db, reporter(1), (q) => q(`SELECT * FROM public.${table}`)))).ok, table).toBe(false);
        expect((await attempt(() => asAnon(db, (q) => q(`SELECT * FROM public.${table}`)))).ok, `${table} (anon)`).toBe(false);
        expect((await attempt(() => asUser(db, reporter(1), (q) => q(`DELETE FROM public.${table}`)))).ok, `${table} delete`).toBe(false);
      }
    });

    it('recording an address is for the server only, keeps at most 20 per person and ignores junk', async () => {
      expect((await attempt(() => asUser(db, T, (q) => q(`SELECT public.record_user_ip($1, '1.2.3.4')`, [T])))).ok).toBe(false);
      const fresh = uid(400);
      await makeUser(db, fresh, 'ipuser');
      for (let i = 1; i <= 25; i++) await asServer(db, (q) => q(`SELECT public.record_user_ip($1, $2)`, [fresh, `192.0.2.${i}`]));
      await asServer(db, (q) => q(`SELECT public.record_user_ip($1, 'not an ip; drop table')`, [fresh]));
      expect((await seed(db, `SELECT count(*)::int AS n FROM public.user_ips WHERE user_id = $1`, [fresh])).rows[0].n).toBe(20);
    });
  });
});

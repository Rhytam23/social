import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 025: two kinds of admin. Platform admin (profiles.is_admin) is made only from Supabase; group
 * admin (a role inside one group or community) can promote members and create channels, and nothing else.
 * Real migrations on a real Postgres. Identities: ROOT (first account, platform admin), OWNER (owns the
 * group and the community), GA (a group and community admin), M (a plain member), N (a newcomer).
 */

const ROOT = uid(1);
const OWNER = uid(2);
const GA = uid(3);
const M = uid(4);
const N = uid(5);
const OUTSIDER = uid(6);

async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Runs as the API's service role (what a leaked service-role key could do). */
const asServiceRole = <T>(db: PGlite, fn: (q: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>) => Promise<T>) =>
  db.transaction(async (tx) => {
    await tx.exec('SET LOCAL ROLE service_role');
    return fn((sql, params) => tx.query(sql, params));
  });

const isAdminOf = async (db: PGlite, id: string) => (await seed(db, `SELECT is_admin FROM public.profiles WHERE id = $1`, [id])).rows[0].is_admin;

describe('migration 025: platform admin is made only from Supabase', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [OWNER, 'olive'], [GA, 'gabe'], [M, 'mona'], [N, 'nia'], [OUTSIDER, 'otto']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
  }, 120000);

  it('the first account is the platform admin and nobody else is (bootstrap still works)', async () => {
    expect(await isAdminOf(db, ROOT)).toBe(true);
    expect(await isAdminOf(db, OWNER)).toBe(false);
  });

  it('an ordinary user cannot make themselves or anyone else a platform admin', async () => {
    await asUser(db, M, (q) => q(`UPDATE public.profiles SET is_admin = true WHERE id = $1`, [M]));
    expect(await isAdminOf(db, M)).toBe(false);
    await asUser(db, M, (q) => q(`UPDATE public.profiles SET is_admin = true WHERE id = $1`, [N]));
    expect(await isAdminOf(db, N)).toBe(false);
  });

  it('a platform admin cannot promote through the API either', async () => {
    await asUser(db, ROOT, (q) => q(`UPDATE public.profiles SET is_admin = true WHERE id = $1`, [M]));
    expect(await isAdminOf(db, M)).toBe(false);
  });

  it('even the service role (a leaked server key) cannot change is_admin', async () => {
    const r = await attempt(() => asServiceRole(db, (q) => q(`UPDATE public.profiles SET is_admin = true WHERE id = $1`, [M])));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Supabase dashboard/);
    expect(await isAdminOf(db, M)).toBe(false);
    // Nor can it demote the real admin.
    expect((await attempt(() => asServiceRole(db, (q) => q(`UPDATE public.profiles SET is_admin = false WHERE id = $1`, [ROOT])))).ok).toBe(false);
    expect(await isAdminOf(db, ROOT)).toBe(true);
  });

  it('an insert through the API can never create an admin', async () => {
    const id = uid(90);
    await seed(db, `INSERT INTO auth.users (id, email) VALUES ($1, 'x@example.com')`, [id]);
    await seed(db, `DELETE FROM public.profiles WHERE id = $1`, [id]);
    await asServiceRole(db, (q) => q(`INSERT INTO public.profiles (id, username, display_name, is_admin) VALUES ($1, 'sneaky', 'Sneaky', true)`, [id]));
    expect(await isAdminOf(db, id)).toBe(false);
  });

  it('a change made in the Supabase dashboard (no API role) works and is written to the activity log', async () => {
    await seed(db, `UPDATE public.profiles SET is_admin = true WHERE id = $1`, [N]);
    expect(await isAdminOf(db, N)).toBe(true);
    await seed(db, `UPDATE public.profiles SET is_admin = false WHERE id = $1`, [N]);
    const log = (await seed(db, `SELECT action, target_id, detail FROM public.admin_audit_log WHERE action = 'is_admin_changed_in_supabase' AND target_id = $1 ORDER BY created_at`, [N])).rows;
    expect(log.map((r) => r.detail)).toEqual(['granted platform admin', 'revoked platform admin']);
  });
});

describe('a group admin has no platform powers', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [OWNER, 'olive'], [GA, 'gabe'], [M, 'mona']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    // gabe is an admin of a group.
    const conv = (await asUser(db, OWNER, (q) => q(`INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'team', $1) RETURNING id`, [OWNER]))).rows[0].id as string;
    await asUser(db, OWNER, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner'), ($1, $3, 'member'), ($1, $4, 'member')`, [conv, OWNER, GA, M]));
    await asUser(db, OWNER, (q) => q(`UPDATE public.conversation_members SET role = 'admin' WHERE conversation_id = $1 AND user_id = $2`, [conv, GA]));
    await seed(db, `SELECT public.log_error('server', 'error', 'x', 'boom', NULL, 'fp-roles-0001', NULL, NULL, NULL, NULL)`);
    await seed(db, `SELECT public.submit_support_request(NULL, 'p', 'p@example.com', 'question', 'a message long enough', NULL)`);
  }, 120000);

  it('cannot read the admin tables', async () => {
    for (const table of ['error_logs', 'admin_audit_log', 'support_requests']) {
      expect((await asUser(db, GA, (q) => q(`SELECT * FROM public.${table}`))).rows, table).toHaveLength(0);
    }
  });

  it('cannot use the admin actions', async () => {
    expect((await attempt(() => asUser(db, GA, (q) => q(`SELECT public.admin_clear_errors(false)`)))).ok).toBe(false);
    expect((await attempt(() => asUser(db, GA, (q) => q(`SELECT public.admin_set_error_status($1, 'resolved')`, [uid(200)])))).ok).toBe(false);
    expect((await attempt(() => asUser(db, GA, (q) => q(`SELECT public.admin_set_support_status($1, 'resolved')`, [uid(200)])))).ok).toBe(false);
  });

  it('cannot become a platform admin', async () => {
    await asUser(db, GA, (q) => q(`UPDATE public.profiles SET is_admin = true WHERE id = $1`, [GA]));
    expect(await isAdminOf(db, GA)).toBe(false);
  });
});

describe('group roles', () => {
  let db: PGlite;
  let group: string;

  const setRole = (actor: string, target: string, role: string) =>
    attempt(() => asUser(db, actor, (q) => q(`UPDATE public.conversation_members SET role = $3 WHERE conversation_id = $1 AND user_id = $2`, [group, target, role])));
  const roleOf = async (target: string) => (await seed(db, `SELECT role FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2`, [group, target])).rows[0].role;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [OWNER, 'olive'], [GA, 'gabe'], [M, 'mona'], [N, 'nia']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    group = (await asUser(db, OWNER, (q) => q(`INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'team', $1) RETURNING id`, [OWNER]))).rows[0].id as string;
    await asUser(db, OWNER, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner'), ($1, $3, 'member'), ($1, $4, 'member'), ($1, $5, 'member')`, [group, OWNER, GA, M, N]));
    await asUser(db, OWNER, (q) => q(`UPDATE public.conversation_members SET role = 'admin' WHERE conversation_id = $1 AND user_id = $2`, [group, GA]));
  }, 120000);

  it('an admin can make a member an admin', async () => {
    expect((await setRole(GA, M, 'admin')).ok).toBe(true);
    expect(await roleOf(M)).toBe('admin');
  });

  it('an admin cannot demote another admin, make an owner, or promote themselves', async () => {
    expect((await setRole(GA, M, 'member')).ok).toBe(false);
    expect((await setRole(GA, N, 'owner')).ok).toBe(false);
    expect((await setRole(GA, OWNER, 'member')).ok).toBe(false);
    expect(await roleOf(M)).toBe('admin');
    expect(await roleOf(OWNER)).toBe('owner');
  });

  it('a plain member changes nothing, including their own role', async () => {
    expect((await setRole(N, N, 'admin')).ok).toBe(false);
    await setRole(N, GA, 'member'); // row level security hides other people's rows from a plain member: nothing changes
    expect(await roleOf(N)).toBe('member');
    expect(await roleOf(GA)).toBe('admin');
  });

  it('the owner can still demote an admin', async () => {
    expect((await setRole(OWNER, M, 'member')).ok).toBe(true);
    expect(await roleOf(M)).toBe('member');
  });
});

describe('communities: promoting and the 10-channel limit', () => {
  let db: PGlite;
  let community: string;

  const roleIn = async (target: string) => (await seed(db, `SELECT role FROM public.community_members WHERE community_id = $1 AND user_id = $2`, [community, target])).rows[0].role;
  const setRole = (actor: string, target: string, role: string) => attempt(() => asUser(db, actor, (q) => q(`SELECT public.set_community_role($1, $2, $3)`, [community, target, role])));
  const channel = (actor: string, name: string) => attempt(() => asUser(db, actor, (q) => q(`SELECT public.create_channel($1, $2, false, '{}'::uuid[])`, [community, name])));

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [OWNER, 'olive'], [GA, 'gabe'], [M, 'mona'], [N, 'nia']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    const created = await asUser(db, OWNER, (q) => q(`SELECT * FROM public.create_community('Studio', 'x')`));
    community = created.rows[0].out_community_id as string;
    await seed(db, `INSERT INTO public.community_members (community_id, user_id, role) VALUES ($1, $2, 'admin'), ($1, $3, 'member'), ($1, $4, 'member')`, [community, GA, M, N]);
  }, 120000);

  it('an admin can make a member an admin', async () => {
    expect((await setRole(GA, M, 'admin')).ok).toBe(true);
    expect(await roleIn(M)).toBe('admin');
  });

  it('an admin cannot demote, make an owner, or change their own role; a member cannot promote', async () => {
    expect((await setRole(GA, M, 'member')).ok).toBe(false);
    expect((await setRole(GA, N, 'owner')).ok).toBe(false);
    expect((await setRole(GA, GA, 'owner')).ok).toBe(false);
    expect((await setRole(N, N, 'admin')).ok).toBe(false);
    expect((await setRole(N, GA, 'member')).ok).toBe(false);
    expect(await roleIn(M)).toBe('admin');
    expect(await roleIn(GA)).toBe('admin');
  });

  it('the owner can demote an admin', async () => {
    expect((await setRole(OWNER, M, 'member')).ok).toBe(true);
    expect(await roleIn(M)).toBe('member');
  });

  it('only community admins create channels, and a community holds at most 10', async () => {
    expect((await channel(N, 'sneaky')).ok).toBe(false);
    // "general" already exists: 9 more make 10.
    for (let i = 1; i <= 9; i++) expect((await channel(GA, `room-${i}`)).ok, `room-${i}`).toBe(true);
    const tenth = await channel(GA, 'one-too-many');
    expect(tenth.ok).toBe(false);
    expect(tenth.error).toMatch(/at most 10 channels/);
    const count = (await seed(db, `SELECT count(*)::int AS n FROM public.conversations WHERE community_id = $1`, [community])).rows[0].n;
    expect(count).toBe(10);
  });
});

describe('official-looking names belong to platform admins', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, 'root@example.com', $2)`, [ROOT, JSON.stringify({ display_name: 'The Admin', username: 'root' })]);
    await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, 'olive@example.com', $2)`, [OWNER, JSON.stringify({ display_name: 'Olive', username: 'olive' })]);
  }, 120000);

  it('the platform admin may use any name (the first account was allowed "The Admin")', async () => {
    expect((await seed(db, `SELECT display_name FROM public.profiles WHERE id = $1`, [ROOT])).rows[0].display_name).toBe('The Admin');
  });

  it('an ordinary user cannot rename themselves to look official', async () => {
    for (const name of ['Nook Admin', 'Support Staff', 'Official Nook', 'Alice ✓', 'Moderator', 'nook-team', 'Bob 🛡️', 'Verified']) {
      const r = await attempt(() => asUser(db, OWNER, (q) => q(`UPDATE public.profiles SET display_name = $2 WHERE id = $1`, [OWNER, name])));
      expect(r.ok, name).toBe(false);
    }
    expect((await attempt(() => asUser(db, OWNER, (q) => q(`UPDATE public.profiles SET username = 'support' WHERE id = $1`, [OWNER])))).ok).toBe(false);
    expect((await seed(db, `SELECT display_name FROM public.profiles WHERE id = $1`, [OWNER])).rows[0].display_name).toBe('Olive');
  });

  it('ordinary names are fine, including ones that only contain part of a word', async () => {
    for (const name of ['Olive Green', 'Nora', 'Mad Max']) {
      const r = await attempt(() => asUser(db, OWNER, (q) => q(`UPDATE public.profiles SET display_name = $2 WHERE id = $1`, [OWNER, name])));
      expect(r.ok, name).toBe(true);
    }
  });

  it('sign-up does not fail for an official-looking name: it gets a neutral one', async () => {
    const id = uid(50);
    await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, 'imp@example.com', $2)`, [id, JSON.stringify({ display_name: 'Nook Admin ✓', username: 'admin' })]);
    const row = (await seed(db, `SELECT display_name, username FROM public.profiles WHERE id = $1`, [id])).rows[0];
    expect(String(row.display_name)).toMatch(/^User /);
    expect(String(row.username)).toMatch(/^user_/);
  });
});

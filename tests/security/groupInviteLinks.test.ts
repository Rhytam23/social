import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 029: group invite links. Real Postgres (PGlite) running the project's migrations, with the API role.
 *
 * ROOT  platform admin (first account)
 * OWNER owns the group
 * ADM   a group admin
 * MEM   a plain member
 * NEW   opens links
 * NEW2  opens links
 * BLOCK was blocked by OWNER
 */

const ROOT = uid(1);
const OWNER = uid(2);
const ADM = uid(3);
const MEM = uid(4);
const NEW = uid(5);
const NEW2 = uid(6);
const BLOCK = uid(7);

async function attempt<T>(fn: () => Promise<T>): Promise<{ ok: boolean; value?: T; error?: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

describe('migration 029: group invite links', () => {
  let db: PGlite;
  let group: string;

  const create = (as: string, conv: string, hours?: number, max?: number) =>
    attempt(() =>
      asUser(db, as, async (q) => (await q(`SELECT public.create_group_invite_link($1, $2, $3) AS c`, [conv, hours ?? 720, max ?? 100])).rows[0].c as string)
    );
  const join = (as: string, code: string) =>
    attempt(() => asUser(db, as, async (q) => (await q(`SELECT public.join_group_by_link($1) AS g`, [code])).rows[0].g as string));
  const memberRow = async (conv: string, user: string) =>
    (await seed(db, `SELECT role, left_at FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2`, [conv, user])).rows[0] as
      | { role: string; left_at: string | null }
      | undefined;
  const isMember = async (conv: string, user: string) => {
    const row = await memberRow(conv, user);
    return !!row && row.left_at === null;
  };
  const newGroup = async (owner: string): Promise<string> =>
    asUser(db, owner, async (q) => {
      const conv = await q(`INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'team', $1) RETURNING id`, [owner]);
      const id = conv.rows[0].id as string;
      await q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner')`, [id, owner]);
      return id;
    });

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [OWNER, 'olive'], [ADM, 'abe'], [MEM, 'mo'], [NEW, 'nia'], [NEW2, 'ned'], [BLOCK, 'bea']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    group = await newGroup(OWNER);
    await seed(db, `INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'admin'), ($1, $3, 'member')`, [group, ADM, MEM]);
  }, 120000);

  it('the owner and an admin can create a link; a plain member and an outsider cannot', async () => {
    expect((await create(OWNER, group)).ok).toBe(true);
    expect((await create(ADM, group)).ok).toBe(true);
    const asMember = await create(MEM, group);
    expect(asMember.ok).toBe(false);
    expect(asMember.error).toMatch(/Only group admins/);
    expect((await create(NEW, group)).ok).toBe(false);
  });

  it('opening a link joins the group as a plain member', async () => {
    const code = (await create(OWNER, group)).value!;
    expect(code).toMatch(/^[0-9A-F]{20}$/);
    expect((await join(NEW, code)).value).toBe(group);
    expect(await isMember(group, NEW)).toBe(true);
    expect((await memberRow(group, NEW))!.role).toBe('member');
  });

  it('the code is never stored in plain text', async () => {
    const code = (await create(OWNER, group)).value!;
    const rows = (await seed(db, `SELECT code_hash FROM public.group_invite_links`)).rows as Array<{ code_hash: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.code_hash.toUpperCase() === code)).toBe(false);
    expect(rows.every((r) => /^[0-9a-f]{64}$/.test(r.code_hash))).toBe(true);
  });

  it('opening a link twice is harmless and uses only one place', async () => {
    const code = (await create(OWNER, group, 720, 5)).value!;
    expect((await join(NEW2, code)).value).toBe(group);
    expect((await join(NEW2, code)).value).toBe(group);
    const used = (await seed(db, `SELECT uses FROM public.group_invite_links WHERE code_hash = encode(sha256(convert_to($1, 'utf8')), 'hex')`, [code])).rows[0] as { uses: number };
    expect(used.uses).toBe(1);
  });

  it('someone who left or was removed cannot use a link to get back in', async () => {
    const g = await newGroup(OWNER);
    const code = (await create(OWNER, g)).value!;
    await join(NEW, code);
    await seed(db, `UPDATE public.conversation_members SET left_at = NOW() WHERE conversation_id = $1 AND user_id = $2`, [g, NEW]);
    const back = await join(NEW, code);
    expect(back.ok).toBe(false);
    expect(back.error).toMatch(/Ask a group admin/);
    expect(await isMember(g, NEW)).toBe(false);
  });

  it('a wrong, revoked, expired or used-up link all fail with the same message', async () => {
    const g = await newGroup(OWNER);
    const wrong = await join(NEW, 'ABCDEF0123456789ABCD');
    expect(wrong.ok).toBe(false);
    expect(wrong.error).toMatch(/invalid or has expired/);

    const revoked = (await create(OWNER, g)).value!;
    const stopped = await attempt(() => asUser(db, OWNER, async (q) => (await q(`SELECT public.revoke_group_invite_links($1) AS n`, [g])).rows[0].n as number));
    expect(stopped.value).toBeGreaterThanOrEqual(1);
    const afterRevoke = await join(NEW, revoked);
    expect(afterRevoke.ok).toBe(false);
    expect(afterRevoke.error).toBe(wrong.error);

    const expired = (await create(OWNER, g)).value!;
    await seed(db, `UPDATE public.group_invite_links SET expires_at = NOW() - INTERVAL '1 minute' WHERE code_hash = encode(sha256(convert_to($1, 'utf8')), 'hex')`, [expired]);
    expect((await join(NEW, expired)).error).toBe(wrong.error);

    const single = (await create(OWNER, g, 720, 1)).value!;
    expect((await join(NEW, single)).ok).toBe(true);
    const second = await join(NEW2, single);
    expect(second.error).toBe(wrong.error);
    expect(await isMember(g, NEW2)).toBe(false);
  });

  it('only admins can revoke, and revoking one group does not touch another', async () => {
    const g1 = await newGroup(OWNER);
    const g2 = await newGroup(OWNER);
    const c1 = (await create(OWNER, g1)).value!;
    const c2 = (await create(OWNER, g2)).value!;
    const byMember = await attempt(() => asUser(db, MEM, (q) => q(`SELECT public.revoke_group_invite_links($1)`, [group])));
    expect(byMember.ok).toBe(false);
    await asUser(db, OWNER, (q) => q(`SELECT public.revoke_group_invite_links($1)`, [g1]));
    expect((await join(NEW, c1)).ok).toBe(false);
    expect((await join(NEW, c2)).ok).toBe(true);
  });

  it('someone an owner or admin blocked cannot join, and is told nothing special', async () => {
    const g = await newGroup(OWNER);
    const code = (await create(OWNER, g)).value!;
    await seed(db, `INSERT INTO public.blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [OWNER, BLOCK]);
    const r = await join(BLOCK, code);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/invalid or has expired/);
    expect(await isMember(g, BLOCK)).toBe(false);
  });

  it('a full group refuses new members', async () => {
    const g = await newGroup(OWNER);
    const code = (await create(OWNER, g)).value!;
    await seed(
      db,
      `INSERT INTO auth.users (id, email) SELECT ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'bulk' || n || '@example.com' FROM generate_series(1, 99) n`
    );
    await seed(
      db,
      `INSERT INTO public.conversation_members (conversation_id, user_id) SELECT $1, ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 99) n`,
      [g]
    );
    const r = await join(NEW, code);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/full/);
  });

  it('links only work for plain groups, and only for signed-in people', async () => {
    const dm = await asUser(db, OWNER, async (q) => {
      const c = await q(`INSERT INTO public.conversations (type, created_by) VALUES ('private', $1) RETURNING id`, [OWNER]);
      const id = c.rows[0].id as string;
      await q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [id, OWNER]);
      return id;
    });
    expect((await create(OWNER, dm)).ok).toBe(false);
    const anon = await attempt(() => asAnon(db, (q) => q(`SELECT public.join_group_by_link('ABCDEF0123456789ABCD')`)));
    expect(anon.ok).toBe(false);
  });

  it('the links table is closed to the app: nobody reads or writes it directly', async () => {
    expect((await attempt(() => asUser(db, OWNER, (q) => q(`SELECT * FROM public.group_invite_links`)))).ok).toBe(false);
    expect((await attempt(() => asUser(db, OWNER, (q) => q(`INSERT INTO public.group_invite_links (conversation_id, code_hash, created_by, expires_at, max_uses) VALUES ($1, 'x', $2, NOW(), 1)`, [group, OWNER])))).ok).toBe(false);
    expect((await attempt(() => asUser(db, NEW, (q) => q(`UPDATE public.group_invite_links SET max_uses = 1000`)))).ok).toBe(false);
  });
});

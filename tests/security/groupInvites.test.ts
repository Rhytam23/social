import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 027: nobody can be put into a group by someone they do not know. Real Postgres (PGlite) running the
 * project's migrations, with the API role.
 *
 * ROOT  platform admin (first account)
 * OWNER owns the group
 * KNOWN has been answered by OWNER in a direct chat (so OWNER "knows" them)
 * MATE  shares a community with OWNER
 * STRAN a stranger
 * BLOCK blocked OWNER
 * ADM   a group admin (invites people on the owner's behalf)
 */

const ROOT = uid(1);
const OWNER = uid(2);
const KNOWN = uid(3);
const MATE = uid(4);
const STRAN = uid(5);
const BLOCK = uid(6);
const ADM = uid(7);
const STRAN2 = uid(8);

async function attempt<T>(fn: () => Promise<T>): Promise<{ ok: boolean; value?: T; error?: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

describe('migration 027: group invitations', () => {
  let db: PGlite;
  let group: string;

  const add = (as: string, conv: string, user: string) =>
    attempt(() => asUser(db, as, async (q) => (await q(`SELECT public.add_group_member($1, $2) AS r`, [conv, user])).rows[0].r as string));
  const invites = (as: string) => asUser(db, as, async (q) => (await q(`SELECT * FROM public.my_group_invites()`)).rows);
  const isMember = async (conv: string, user: string) =>
    ((await seed(db, `SELECT 1 FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`, [conv, user])).rows.length) === 1;
  const newGroup = async (owner: string): Promise<string> =>
    asUser(db, owner, async (q) => {
      const conv = await q(`INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'team', $1) RETURNING id`, [owner]);
      const id = conv.rows[0].id as string;
      await q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner')`, [id, owner]);
      return id;
    });

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [OWNER, 'olive'], [KNOWN, 'kim'], [MATE, 'max'], [STRAN, 'sam'], [BLOCK, 'bea'], [ADM, 'abe'], [STRAN2, 'stu']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    // OWNER and KNOWN have talked: KNOWN answered.
    const dm = await asUser(db, OWNER, async (q) => {
      const c = await q(`INSERT INTO public.conversations (type, created_by) VALUES ('private', $1) RETURNING id`, [OWNER]);
      const id = c.rows[0].id as string;
      await q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [id, OWNER, KNOWN]);
      await q(`INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, 'c', 'n')`, [id, OWNER]);
      return id;
    });
    await asUser(db, KNOWN, (q) => q(`INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, 'c', 'n')`, [dm, KNOWN]));
    // OWNER and MATE are in one community.
    const comm = await asUser(db, OWNER, (q) => q(`SELECT * FROM public.create_community('Studio', 'x')`));
    await seed(db, `INSERT INTO public.community_members (community_id, user_id, role) VALUES ($1, $2, 'member')`, [comm.rows[0].out_community_id, MATE]);
    await seed(db, `INSERT INTO public.blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [BLOCK, OWNER]);
    group = await newGroup(OWNER);
    await seed(db, `INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'admin')`, [group, ADM]);
  }, 120000);

  it('a person you know is added straight away, and so is someone from your community', async () => {
    expect((await add(OWNER, group, KNOWN)).value).toBe('added');
    expect((await add(OWNER, group, MATE)).value).toBe('added');
    expect(await isMember(group, KNOWN)).toBe(true);
    expect(await isMember(group, MATE)).toBe(true);
  });

  it('a stranger is invited, not added, and can read nothing of the group yet', async () => {
    expect((await add(OWNER, group, STRAN)).value).toBe('invited');
    expect(await isMember(group, STRAN)).toBe(false);
    const seen = await asUser(db, STRAN, (q) => q(`SELECT id FROM public.conversations WHERE id = $1`, [group]));
    expect(seen.rows).toHaveLength(0);
    const list = await invites(STRAN);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ conversation_id: group, group_name: 'team', inviter_name: 'olive', inviter_username: 'olive' });
    // Nobody else has it.
    expect(await invites(STRAN2)).toHaveLength(0);
  });

  it('accepting joins the group as a plain member and clears the invitation', async () => {
    const inv = (await invites(STRAN))[0];
    const joined = await attempt(() => asUser(db, STRAN, async (q) => (await q(`SELECT public.respond_group_invite($1, true) AS g`, [inv.id])).rows[0].g));
    expect(joined.value).toBe(group);
    expect(await isMember(group, STRAN)).toBe(true);
    expect((await seed(db, `SELECT role FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2`, [group, STRAN])).rows[0].role).toBe('member');
    expect(await invites(STRAN)).toHaveLength(0);
  });

  it('declining leaves the person out', async () => {
    const g = await newGroup(OWNER);
    await add(OWNER, g, STRAN2);
    const inv = (await invites(STRAN2)).find((i) => i.conversation_id === g)!;
    await asUser(db, STRAN2, (q) => q(`SELECT public.respond_group_invite($1, false)`, [inv.id]));
    expect(await isMember(g, STRAN2)).toBe(false);
    expect((await invites(STRAN2)).filter((i) => i.conversation_id === g)).toHaveLength(0);
  });

  it('only the invited person can answer an invitation', async () => {
    const g = await newGroup(OWNER);
    await add(OWNER, g, STRAN2);
    const inv = (await invites(STRAN2)).find((i) => i.conversation_id === g)!;
    const stolen = await attempt(() => asUser(db, KNOWN, (q) => q(`SELECT public.respond_group_invite($1, true)`, [inv.id])));
    expect(stolen.ok).toBe(false);
    expect(await isMember(g, KNOWN)).toBe(false);
  });

  it('nobody can put people into a group by writing the table, and the invitation table is closed', async () => {
    const g = await newGroup(OWNER);
    expect((await attempt(() => asUser(db, OWNER, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [g, STRAN])))).ok).toBe(false);
    expect((await attempt(() => asUser(db, ADM, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [group, STRAN2])))).ok).toBe(false);
    expect((await attempt(() => asUser(db, STRAN, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [g, STRAN])))).ok).toBe(false);
    expect((await attempt(() => asUser(db, OWNER, (q) => q(`SELECT * FROM public.group_invites`)))).ok).toBe(false);
    expect((await attempt(() => asUser(db, OWNER, (q) => q(`INSERT INTO public.group_invites (conversation_id, invitee_id, inviter_id) VALUES ($1, $2, $3)`, [g, STRAN2, OWNER])))).ok).toBe(false);
    expect((await attempt(() => asUser(db, STRAN, (q) => q(`DELETE FROM public.group_invites`)))).ok).toBe(false);
  });

  it('a plain member cannot add or invite anyone', async () => {
    const r = await add(KNOWN, group, STRAN2);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Only group admins/);
  });

  it('a group admin can invite, and the invitation stops working once that admin is no longer an admin', async () => {
    const g = await newGroup(OWNER);
    await seed(db, `INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'admin')`, [g, ADM]);
    expect((await add(ADM, g, STRAN2)).value).toBe('invited');
    await seed(db, `UPDATE public.conversation_members SET role = 'member' WHERE conversation_id = $1 AND user_id = $2`, [g, ADM]);
    const inv = (await invites(STRAN2)).find((i) => i.conversation_id === g)!;
    const r = await attempt(() => asUser(db, STRAN2, (q) => q(`SELECT public.respond_group_invite($1, true)`, [inv.id])));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no longer valid/);
    expect(await isMember(g, STRAN2)).toBe(false);
  });

  it('someone who blocked you is not added or invited, and you are not told', async () => {
    const g = await newGroup(OWNER);
    expect((await add(OWNER, g, BLOCK)).value).toBe('invited');
    expect(await isMember(g, BLOCK)).toBe(false);
    expect(await invites(BLOCK)).toHaveLength(0);
  });

  it('invitations expire after 14 days', async () => {
    const g = await newGroup(OWNER);
    await add(OWNER, g, STRAN2);
    await seed(db, `UPDATE public.group_invites SET created_at = NOW() - INTERVAL '15 days' WHERE conversation_id = $1`, [g]);
    expect((await invites(STRAN2)).filter((i) => i.conversation_id === g)).toHaveLength(0);
  });

  it('no more than 30 invitations wait for one person: extra ones are dropped quietly', async () => {
    const target = uid(50);
    await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, 'pile@example.com', $2)`, [target, JSON.stringify({ display_name: 'pile', username: 'pile' })]);
    for (let i = 0; i < 30; i++) {
      const g = (await seed(db, `INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'g', $1) RETURNING id`, [BLOCK])).rows[0].id as string;
      await seed(db, `INSERT INTO public.group_invites (conversation_id, invitee_id, inviter_id) VALUES ($1, $2, $3)`, [g, target, BLOCK]);
    }
    const g31 = await newGroup(OWNER);
    expect((await add(OWNER, g31, target)).value).toBe('invited');
    expect((await seed(db, `SELECT count(*)::int AS n FROM public.group_invites WHERE invitee_id = $1`, [target])).rows[0].n).toBe(30);
  });

  it('a platform admin can add anyone directly', async () => {
    const g = await newGroup(ROOT);
    expect((await add(ROOT, g, STRAN2)).value).toBe('added');
    expect(await isMember(g, STRAN2)).toBe(true);
  });

  it('a community channel cannot be filled this way, and you cannot add yourself', async () => {
    const chan = (await asUser(db, OWNER, (q) => q(`SELECT * FROM public.create_community('Other', 'x')`))).rows[0].out_channel_id as string;
    expect((await add(OWNER, chan, KNOWN)).ok).toBe(false);
    expect((await add(OWNER, group, OWNER)).ok).toBe(false);
  });

  it('adding someone who is already in returns "already", and someone who left comes back as a plain member', async () => {
    expect((await add(OWNER, group, KNOWN)).value).toBe('already');
    await seed(db, `UPDATE public.conversation_members SET left_at = NOW() WHERE conversation_id = $1 AND user_id = $2`, [group, KNOWN]);
    expect((await add(OWNER, group, KNOWN)).value).toBe('added');
    expect(await isMember(group, KNOWN)).toBe(true);
  });

  it('the creator still takes their own seat in a new group, but only their own', async () => {
    const g = await asUser(db, KNOWN, async (q) => (await q(`INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'k', $1) RETURNING id`, [KNOWN])).rows[0].id as string);
    const other = await attempt(() => asUser(db, KNOWN, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member')`, [g, STRAN2])));
    expect(other.ok).toBe(false);
    const self = await attempt(() => asUser(db, KNOWN, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner')`, [g, KNOWN])));
    expect(self.ok).toBe(true);
  });
});

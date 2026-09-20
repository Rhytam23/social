import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 023: a platform admin's profile is visible only to themselves, other platform admins, people who
 * share a conversation or a community with them. Real migrations on a real Postgres.
 * ROOT is the platform admin (first account). A, B and C are ordinary people.
 */

const ROOT = uid(1);
const A = uid(2);
const B = uid(3);
const C = uid(4);

const idsVisibleTo = async (db: PGlite, who: string) => (await asUser(db, who, (q) => q(`SELECT id FROM public.profiles ORDER BY id`))).rows.map((r) => r.id as string);

async function startDirectChat(db: PGlite, from: string, to: string): Promise<string> {
  return asUser(db, from, async (q) => {
    const conv = await q(`INSERT INTO public.conversations (type, created_by) VALUES ('private', $1) RETURNING id`, [from]);
    const id = conv.rows[0].id as string;
    await q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [id, from, to]);
    return id;
  });
}

describe('migration 023: platform admins cannot be found', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [A, 'alice'], [B, 'bob'], [C, 'carol']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
  }, 120000);

  it('a stranger cannot list, look up or fetch the admin, by any route', async () => {
    const visible = await idsVisibleTo(db, A);
    expect(visible).not.toContain(ROOT);
    expect((await asUser(db, A, (q) => q(`SELECT id FROM public.profiles WHERE username ILIKE 'root'`))).rows).toHaveLength(0);
    expect((await asUser(db, A, (q) => q(`SELECT id FROM public.profiles WHERE id = $1`, [ROOT]))).rows).toHaveLength(0);
    expect((await asUser(db, A, (q) => q(`SELECT id FROM public.profiles WHERE is_admin = true`))).rows).toHaveLength(0);
    expect((await asUser(db, A, (q) => q(`SELECT count(*)::int AS n FROM public.profiles WHERE display_name ILIKE '%oo%'`))).rows[0].n).toBe(0);
  });

  it('ordinary people are visible exactly as before', async () => {
    expect(await idsVisibleTo(db, A)).toEqual([A, B, C].sort());
  });

  it('everyone still sees themselves', async () => {
    expect(await idsVisibleTo(db, ROOT)).toContain(ROOT);
  });

  it('the admin sees everyone', async () => {
    expect((await idsVisibleTo(db, ROOT)).sort()).toEqual([ROOT, A, B, C].sort());
  });

  it('anonymous visitors see no profiles at all', async () => {
    await expect(asAnon(db, (q) => q(`SELECT id FROM public.profiles`))).rejects.toThrow();
  });

  it('once the admin starts a chat with someone, that person can see the admin, and only that person', async () => {
    const conv = await startDirectChat(db, ROOT, A);
    expect(await idsVisibleTo(db, A)).toContain(ROOT);
    expect(await idsVisibleTo(db, B)).not.toContain(ROOT);
    // The person can read the admin's name and the badge flag for the chat they share.
    const row = (await asUser(db, A, (q) => q(`SELECT display_name, is_admin FROM public.profiles WHERE id = $1`, [ROOT]))).rows[0];
    expect(row).toEqual({ display_name: 'root', is_admin: true });

    // When the admin leaves the conversation, they are hidden again.
    await seed(db, `UPDATE public.conversation_members SET left_at = NOW() WHERE conversation_id = $1 AND user_id = $2`, [conv, ROOT]);
    expect(await idsVisibleTo(db, A)).not.toContain(ROOT);
  });

  it('people in the same community as the admin can see them', async () => {
    const created = await asUser(db, ROOT, (q) => q(`SELECT * FROM public.create_community('Studio', 'x')`));
    const community = created.rows[0].out_community_id as string;
    await seed(db, `INSERT INTO public.community_members (community_id, user_id, role) VALUES ($1, $2, 'member')`, [community, B]);
    expect(await idsVisibleTo(db, B)).toContain(ROOT);
    expect(await idsVisibleTo(db, C)).not.toContain(ROOT);
  });

  it('the embedded profile of a conversation member follows the same rule (what the app loads)', async () => {
    const rows = (await asUser(db, C, (q) => q(`SELECT cm.user_id, p.id AS profile_id FROM public.conversation_members cm LEFT JOIN public.profiles p ON p.id = cm.user_id`))).rows;
    // C is in no conversation, so sees nothing; and a join can never reveal the admin's profile.
    expect(rows.every((r) => r.profile_id !== ROOT)).toBe(true);
  });

  it('is_admin() still works for the admin and for others (the policy does not recurse)', async () => {
    expect((await asUser(db, ROOT, (q) => q(`SELECT public.is_admin() AS a`))).rows[0].a).toBe(true);
    expect((await asUser(db, A, (q) => q(`SELECT public.is_admin() AS a`))).rows[0].a).toBe(false);
  });

  it('proof the migration matters: before 023 a stranger could see the admin', async () => {
    const before = await createDatabase('023');
    for (const [id, name] of [[ROOT, 'root'], [A, 'alice']] as const) {
      await seed(before, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    expect(await idsVisibleTo(before, A)).toContain(ROOT);
  }, 120000);
});

import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 028: a profile is visible only to its owner, platform admins, people in a conversation or community
 * with that person, and people who blocked them. Finding a new person is server-only. Real Postgres (PGlite).
 *
 * ROOT platform admin. A: the searcher. B: talks to A. C: was in a chat with A and left. D: same community as A.
 * E: blocked by A. F: a stranger to everyone. G: banned. H: an ordinary person A has never met (named "hana").
 */

const ROOT = uid(1);
const A = uid(2);
const B = uid(3);
const C = uid(4);
const D = uid(5);
const E = uid(6);
const F = uid(7);
const G = uid(8);
const H = uid(9);

const names: Array<[string, string]> = [
  [ROOT, 'root'], [A, 'arsh'], [B, 'arsalan'], [C, 'arya'], [D, 'dana'], [E, 'eli'], [F, 'arfa'], [G, 'arsgone'], [H, 'hana'],
];

const idsVisibleTo = async (db: PGlite, who: string) => (await asUser(db, who, (q) => q(`SELECT id FROM public.profiles ORDER BY id`))).rows.map((r) => r.id as string);

/** The server (service_role), the only role allowed to search. */
async function asServer<T>(db: PGlite, fn: (q: (sql: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec('SET LOCAL ROLE service_role');
    return fn((sql, p) => tx.query(sql, p));
  });
}

const search = (db: PGlite, caller: string, prefix: string) =>
  asServer(db, async (q) => (await q(`SELECT username FROM public.search_profiles_by_prefix($1, $2, 8)`, [caller, prefix])).rows.map((r) => r.username as string));

async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

describe('migration 028: profile visibility', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of names) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    // A and B: a direct chat. A and C: a group C later left.
    const direct = (await seed(db, `INSERT INTO public.conversations (type, created_by) VALUES ('private', $1) RETURNING id`, [A])).rows[0].id as string;
    await seed(db, `INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [direct, A, B]);
    const grp = (await seed(db, `INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'g', $1) RETURNING id`, [A])).rows[0].id as string;
    await seed(db, `INSERT INTO public.conversation_members (conversation_id, user_id, role, left_at) VALUES ($1, $2, 'owner', NULL), ($1, $3, 'member', NOW())`, [grp, A, C]);
    // A and D: one community.
    const comm = (await asUser(db, A, (q) => q(`SELECT * FROM public.create_community('Studio', 'x')`))).rows[0].out_community_id as string;
    await seed(db, `INSERT INTO public.community_members (community_id, user_id, role) VALUES ($1, $2, 'member')`, [comm, D]);
    await seed(db, `INSERT INTO public.blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [A, E]);
    await seed(db, `INSERT INTO public.user_moderation (user_id, banned_until) VALUES ($1, NOW() + INTERVAL '7 days')`, [G]);
  }, 120000);

  describe('who can read a profile through the API', () => {
    it('a person sees themselves, people they talk to, people who were in their chats, their community and people they blocked, and nobody else', async () => {
      expect((await idsVisibleTo(db, A)).sort()).toEqual([A, B, C, D, E].sort());
    });

    it('a stranger cannot list, look up or filter their way to anyone', async () => {
      expect(await idsVisibleTo(db, F)).toEqual([F]);
      expect((await asUser(db, F, (q) => q(`SELECT id FROM public.profiles WHERE username ILIKE 'ars%'`))).rows).toHaveLength(0);
      expect((await asUser(db, F, (q) => q(`SELECT id FROM public.profiles WHERE id = $1`, [B]))).rows).toHaveLength(0);
      expect((await asUser(db, F, (q) => q(`SELECT count(*)::int AS n FROM public.profiles`))).rows[0].n).toBe(1);
    });

    it('someone who left a chat with you still shows their name on old messages, but you are not visible to them if you left', async () => {
      expect(await idsVisibleTo(db, A)).toContain(C);
      // C left the group, so C is no longer an active member: C sees nobody through it.
      expect(await idsVisibleTo(db, C)).toEqual([C]);
    });

    it('being blocked does not make you see the blocker', async () => {
      expect(await idsVisibleTo(db, E)).toEqual([E]);
    });

    it('a platform admin sees everyone, and anonymous visitors see nothing', async () => {
      expect((await idsVisibleTo(db, ROOT)).sort()).toEqual(names.map(([id]) => id).sort());
      await expect(asAnon(db, (q) => q(`SELECT id FROM public.profiles`))).rejects.toThrow();
    });

    it('email and phone number stay hidden from everyone', async () => {
      const r = await attempt(() => asUser(db, A, (q) => q(`SELECT email FROM public.profiles WHERE id = $1`, [A])));
      expect(r.ok).toBe(false);
    });
  });

  describe('search_profiles_by_prefix (server only)', () => {
    it('cannot be called by a signed-in user, an anonymous visitor, or through the API at all', async () => {
      const asAuthed = await attempt(() => asUser(db, A, (q) => q(`SELECT * FROM public.search_profiles_by_prefix($1, 'ars', 8)`, [A])));
      expect(asAuthed.ok).toBe(false);
      expect(asAuthed.error).toMatch(/permission denied/i);
      const asAnonymous = await attempt(() => asAnon(db, (q) => q(`SELECT * FROM public.search_profiles_by_prefix($1, 'ars', 8)`, [A])));
      expect(asAnonymous.ok).toBe(false);
    });

    it('finds strangers by the start of the username, exact match first, and never the caller', async () => {
      expect(await search(db, F, 'ars')).toEqual(['arsalan', 'arsh']);
      expect(await search(db, A, 'ars')).toEqual(['arsalan']);
      expect(await search(db, F, 'arsh')).toEqual(['arsh']);
    });

    it('is case-insensitive and treats an underscore literally', async () => {
      expect(await search(db, F, 'ARS')).toEqual(['arsalan', 'arsh']);
      expect(await search(db, F, 'ar_')).toEqual([]);
    });

    it('never returns platform admins or suspended accounts', async () => {
      expect(await search(db, F, 'roo')).toEqual([]);
      expect(await search(db, F, 'arsg')).toEqual([]);
    });

    it('refuses anything that is not 3 to 30 username characters', async () => {
      for (const bad of ['ar', '', 'a%s', 'ars h', 'ars@', "ars'--"]) expect(await search(db, F, bad)).toEqual([]);
    });

    it('returns at most 8 people and only public profile columns', async () => {
      for (let i = 0; i < 12; i++) {
        const id = uid(200 + i);
        await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `many${i}@example.com`, JSON.stringify({ display_name: 'm', username: `many${String(i).padStart(2, '0')}` })]);
      }
      expect(await search(db, F, 'many')).toHaveLength(8);
      const cols = await asServer(db, async (q) => Object.keys((await q(`SELECT * FROM public.search_profiles_by_prefix($1, 'arsh', 8)`, [F])).rows[0]).sort());
      expect(cols).toEqual(['avatar_url', 'bio', 'created_at', 'display_name', 'id', 'pronouns', 'timezone', 'username']);
    });
  });
});

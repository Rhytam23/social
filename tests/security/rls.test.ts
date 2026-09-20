import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid, type Query } from './pgHarness';

/**
 * Black-box row level security tests against a real Postgres running the
 * project's actual migrations. Identities:
 *   A, B   two ordinary users who talk to each other
 *   C      an outsider (signed in, in no conversation with A or B)
 *   ADMIN  a platform administrator
 * Every attempt below is made with the API role and auth.uid() of that user,
 * so row level security decides, exactly as it does for a real client.
 */

const A = uid(1);
const B = uid(2);
const C = uid(3);
const ADMIN = uid(4);
const D = uid(5);
const E = uid(6); // signed in, has no conversation with anyone

async function seedUsers(db: PGlite) {
  // The first account on a fresh install is bootstrapped as the platform admin (see 007), so it goes first.
  for (const [id, name] of [[ADMIN, 'root'], [A, 'alice'], [B, 'bob'], [C, 'carol'], [D, 'dave'], [E, 'erin']] as const) {
    await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
  }
}

/** Creates a conversation the way the API does: creator inserts it, then every member row in ONE statement. */
async function createConversation(db: PGlite, owner: string, type: 'private' | 'group', members: string[]): Promise<string> {
  return asUser(db, owner, async (q) => {
    const conv = await q(`INSERT INTO public.conversations (type, name, created_by) VALUES ($1, $2, $3) RETURNING id`, [type, type === 'group' ? 'team' : null, owner]);
    const id = conv.rows[0].id as string;
    const all = [owner, ...members];
    const rows = all.map((u, i) => `($1, $${i + 2}${type === 'group' && u === owner ? `, 'owner'` : ''})`).join(',');
    await q(`INSERT INTO public.conversation_members (conversation_id, user_id${type === 'group' ? ', role' : ''}) VALUES ${type === 'group' ? all.map((u, i) => `($1, $${i + 2}, '${u === owner ? 'owner' : 'member'}')`).join(',') : rows}`, [id, ...all]);
    return id;
  });
}

async function sendMessage(db: PGlite, sender: string, conv: string, text = 'ciphertext') {
  return asUser(db, sender, (q) => q(`INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, $3, 'n') RETURNING id`, [conv, sender, text]));
}

/** Runs a query and reports whether the database allowed it. */
async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const count = async (q: Query, sql: string, params?: unknown[]) => Number((await q(`SELECT count(*)::int AS n FROM (${sql}) t`, params)).rows[0].n);

describe('row level security, current schema (001 to 017)', () => {
  let db: PGlite;
  let ab: string; // direct chat A <-> B
  let group: string; // group owned by A with B as a member

  beforeAll(async () => {
    db = await createDatabase();
    await seedUsers(db);
    ab = await createConversation(db, A, 'private', [B]);
    group = await createConversation(db, A, 'group', [B]);
    await sendMessage(db, A, ab, 'secret from A');
    await sendMessage(db, B, group, 'group note');
  }, 120000);

  describe('unauthenticated access', () => {
    it('anon cannot read messages, conversations, members, devices, envelopes or profiles', async () => {
      for (const table of ['messages', 'conversations', 'conversation_members', 'user_devices', 'group_key_envelopes', 'profiles', 'blocks', 'reports']) {
        const r = await attempt(() => asAnon(db, (q) => q(`SELECT * FROM public.${table}`)));
        // Either denied outright or an empty result: never any row.
        if (r.ok) expect(await asAnon(db, (q) => count(q, `SELECT 1 FROM public.${table}`)), table).toBe(0);
      }
    });

    it('anon cannot write', async () => {
      const r = await attempt(() => asAnon(db, (q) => q(`INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, 'x', 'n')`, [ab, A])));
      expect(r.ok).toBe(false);
    });

    it('anon cannot call the community functions', async () => {
      const r = await attempt(() => asAnon(db, (q) => q(`SELECT public.create_community('Hacked', 'x')`)));
      expect(r.ok).toBe(false);
    });
  });

  describe('user A reading user B (IDOR)', () => {
    it('outsider C sees none of the A-B messages', async () => {
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM public.messages WHERE conversation_id = $1`, [ab]))).toBe(0);
    });

    it('members do see them', async () => {
      expect(await asUser(db, B, (q) => count(q, `SELECT 1 FROM public.messages WHERE conversation_id = $1`, [ab]))).toBe(1);
    });

    it('outsider C cannot see the conversation or its members', async () => {
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM public.conversations WHERE id = $1`, [ab]))).toBe(0);
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM public.conversation_members WHERE conversation_id = $1`, [ab]))).toBe(0);
    });

    it('outsider C cannot post into the A-B conversation', async () => {
      expect((await attempt(() => sendMessage(db, C, ab))).ok).toBe(false);
    });

    it('sender_id cannot be forged: C cannot post as A', async () => {
      const r = await attempt(() => asUser(db, C, (q) => q(`INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, 'x', 'n')`, [ab, A])));
      expect(r.ok).toBe(false);
    });

    it('B cannot edit or delete A\'s message', async () => {
      const upd = await asUser(db, B, (q) => q(`UPDATE public.messages SET ciphertext = 'tampered' WHERE conversation_id = $1 AND sender_id = $2 RETURNING id`, [ab, A]));
      expect(upd.rows).toHaveLength(0);
      const del = await asUser(db, B, (q) => q(`DELETE FROM public.messages WHERE conversation_id = $1 AND sender_id = $2 RETURNING id`, [ab, A]));
      expect(del.rows).toHaveLength(0);
    });

    it('C cannot read B\'s reactions, receipts or saved messages', async () => {
      const m = (await seed(db, `SELECT id FROM public.messages WHERE conversation_id = $1 LIMIT 1`, [ab])).rows[0].id as string;
      await asUser(db, A, (q) => q(`INSERT INTO public.message_reactions (message_id, user_id, reaction) VALUES ($1, $2, 'like')`, [m, A]));
      await asUser(db, A, (q) => q(`INSERT INTO public.saved_messages (user_id, message_id, conversation_id) VALUES ($1, $2, $3)`, [A, m, ab]));
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM public.message_reactions`))).toBe(0);
      expect(await asUser(db, B, (q) => count(q, `SELECT 1 FROM public.saved_messages`))).toBe(0);
      expect((await attempt(() => asUser(db, C, (q) => q(`INSERT INTO public.message_reactions (message_id, user_id, reaction) VALUES ($1, $2, 'x')`, [m, C])))).ok).toBe(false);
    });

    it('B cannot read or change A\'s device keys unless they share a conversation, and never edit them', async () => {
      await asUser(db, A, (q) => q(`INSERT INTO public.user_devices (user_id, device_id, identity_public_key, signed_prekey) VALUES ($1, 'd1', 'PUBKEY', 'x')`, [A]));
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM public.user_devices WHERE user_id = $1`, [A]))).toBe(0);
      const upd = await asUser(db, B, (q) => q(`UPDATE public.user_devices SET identity_public_key = 'EVIL' WHERE user_id = $1 RETURNING id`, [A]));
      expect(upd.rows).toHaveLength(0);
      const forged = await attempt(() => asUser(db, C, (q) => q(`INSERT INTO public.user_devices (user_id, device_id, identity_public_key, signed_prekey) VALUES ($1, 'd9', 'EVIL', 'x')`, [A])));
      expect(forged.ok).toBe(false);
    });
  });

  describe('profiles and privilege escalation', () => {
    it('a user cannot make themselves an administrator', async () => {
      await asUser(db, C, (q) => q(`UPDATE public.profiles SET is_admin = true WHERE id = $1`, [C]));
      expect((await seed(db, `SELECT is_admin FROM public.profiles WHERE id = $1`, [C])).rows[0].is_admin).toBe(false);
    });

    it('a user cannot edit someone else\'s profile', async () => {
      const r = await asUser(db, C, (q) => q(`UPDATE public.profiles SET display_name = 'pwned' WHERE id = $1 RETURNING id`, [A]));
      expect(r.rows).toHaveLength(0);
    });

    it('email and phone number of other users are unreadable', async () => {
      const r = await attempt(() => asUser(db, C, (q) => q(`SELECT email FROM public.profiles WHERE id = $1`, [A])));
      expect(r.ok).toBe(false);
      const p = await attempt(() => asUser(db, C, (q) => q(`SELECT phone_number FROM public.profiles WHERE id = $1`, [A])));
      expect(p.ok).toBe(false);
    });

    it('a user cannot call the (revoked) email/phone lookup', async () => {
      const r = await attempt(() => asUser(db, C, (q) => q(`SELECT * FROM public.find_profiles_by_contact('alice@example.com')`)));
      expect(r.ok).toBe(false);
    });

    it('a profile photo cannot point at an arbitrary tracking URL', async () => {
      const bad = await attempt(() => asUser(db, C, (q) => q(`UPDATE public.profiles SET avatar_url = 'https://evil.example/pixel.gif' WHERE id = $1`, [C])));
      expect(bad.ok).toBe(false);
      const good = await attempt(() => asUser(db, C, (q) => q(`UPDATE public.profiles SET avatar_url = 'https://abc123.supabase.co/storage/v1/object/public/avatars/${C}/avatar.png?t=1' WHERE id = $1`, [C])));
      expect(good.ok).toBe(true);
    });

    it('only an administrator can read reports', async () => {
      await asUser(db, A, (q) => q(`INSERT INTO public.reports (reporter_id, reported_user_id, reason) VALUES ($1, $2, 'spam')`, [A, B]));
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM public.reports`))).toBe(0);
      expect(await asUser(db, A, (q) => count(q, `SELECT 1 FROM public.reports`))).toBe(0);
      expect(await asUser(db, ADMIN, (q) => count(q, `SELECT 1 FROM public.reports`))).toBe(1);
    });
  });

  describe('groups, roles and membership (fixed by 017)', () => {
    it('a member cannot move their own membership into another conversation', async () => {
      const own = await createConversation(db, C, 'group', [D]);
      const r = await attempt(() => asUser(db, C, (q) => q(`UPDATE public.conversation_members SET conversation_id = $1 WHERE conversation_id = $2 AND user_id = $3`, [group, own, C])));
      expect(r.ok).toBe(false);
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM public.messages WHERE conversation_id = $1`, [group]))).toBe(0);
    });

    it('a member cannot add other people to a group', async () => {
      const r = await attempt(() => asUser(db, B, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [group, C])));
      expect(r.ok).toBe(false);
    });

    it('the owner can add people', async () => {
      const g = await createConversation(db, A, 'group', [B]);
      const r = await attempt(() => asUser(db, A, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [g, D])));
      expect(r.ok).toBe(true);
    });

    it('a member cannot promote themselves or anyone', async () => {
      const self = await attempt(() => asUser(db, B, (q) => q(`UPDATE public.conversation_members SET role = 'admin' WHERE conversation_id = $1 AND user_id = $2`, [group, B])));
      expect(self.ok).toBe(false);
      const owner = await attempt(() => asUser(db, B, (q) => q(`UPDATE public.conversation_members SET role = 'owner' WHERE conversation_id = $1 AND user_id = $2`, [group, B])));
      expect(owner.ok).toBe(false);
    });

    it('a creator who left cannot add themselves back as owner, or add others', async () => {
      const g = await createConversation(db, A, 'group', [B, D]);
      await asUser(db, A, (q) => q(`UPDATE public.conversation_members SET role = 'owner' WHERE conversation_id = $1 AND user_id = $2`, [g, B]));
      await asUser(db, A, (q) => q(`DELETE FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2`, [g, A]));
      const rejoin = await attempt(() => asUser(db, A, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner')`, [g, A])));
      expect(rejoin.ok).toBe(false);
      const addOther = await attempt(() => asUser(db, A, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [g, C])));
      expect(addOther.ok).toBe(false);
    });

    it('an outsider cannot add themselves to any conversation', async () => {
      for (const conv of [ab, group]) {
        const r = await attempt(() => asUser(db, C, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [conv, C])));
        expect(r.ok, conv).toBe(false);
      }
    });

    it('a direct chat cannot hold three people', async () => {
      const r = await attempt(() => createConversation(db, A, 'private', [B, C]));
      expect(r.ok).toBe(false);
    });

    it('a member cannot rename the group; the owner can', async () => {
      const b = await asUser(db, B, (q) => q(`UPDATE public.conversations SET name = 'mine' WHERE id = $1 RETURNING id`, [group]));
      expect(b.rows).toHaveLength(0);
      const a = await asUser(db, A, (q) => q(`UPDATE public.conversations SET name = 'ours' WHERE id = $1 RETURNING id`, [group]));
      expect(a.rows).toHaveLength(1);
    });

    it('an admin (not the owner) cannot remove the owner', async () => {
      const g = await createConversation(db, A, 'group', [B]);
      await asUser(db, A, (q) => q(`UPDATE public.conversation_members SET role = 'admin' WHERE conversation_id = $1 AND user_id = $2`, [g, B]));
      const r = await asUser(db, B, (q) => q(`DELETE FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2 RETURNING user_id`, [g, A]));
      expect(r.rows).toHaveLength(0);
    });
  });

  describe('group key envelopes (fixed by 017)', () => {
    const insertEnvelope = (who: string, conv: string, recipient: string, device: string, version = 9) =>
      attempt(() => asUser(db, who, (q) => q(`INSERT INTO public.group_key_envelopes (conversation_id, user_id, device_id, encrypted_group_key, key_version) VALUES ($1, $2, $3, 'sealed', $4)`, [conv, recipient, device, version])));

    beforeAll(async () => {
      await asUser(db, B, (q) => q(`INSERT INTO public.user_devices (user_id, device_id, identity_public_key, signed_prekey) VALUES ($1, 'bdev', 'BPUB', 'x')`, [B]));
    });

    it('a plain member cannot plant a key for another member', async () => {
      // B is a plain member; A's device is the target.
      const r = await insertEnvelope(B, group, A, 'd1');
      expect(r.ok).toBe(false);
    });

    it('an outsider cannot plant a key', async () => {
      expect((await insertEnvelope(C, group, B, 'bdev')).ok).toBe(false);
    });

    it('the owner can distribute a key to a real member device', async () => {
      expect((await insertEnvelope(A, group, B, 'bdev', 1)).ok).toBe(true);
    });

    it('the owner cannot address a key to a device that is not the recipient\'s', async () => {
      expect((await insertEnvelope(A, group, B, 'not-b-device', 2)).ok).toBe(false);
    });

    it('a member reads only their own envelopes', async () => {
      expect(await asUser(db, A, (q) => count(q, `SELECT 1 FROM public.group_key_envelopes WHERE user_id = $1`, [B]))).toBe(0);
      expect(await asUser(db, B, (q) => count(q, `SELECT 1 FROM public.group_key_envelopes WHERE user_id = $1`, [B]))).toBe(1);
    });
  });

  describe('message integrity (fixed by 017)', () => {
    it('the sender can edit the content of their message', async () => {
      const m = (await sendMessage(db, A, ab, 'v1')).rows[0].id as string;
      const r = await asUser(db, A, (q) => q(`UPDATE public.messages SET ciphertext = 'v2', edited_at = now() WHERE id = $1 RETURNING id`, [m]));
      expect(r.rows).toHaveLength(1);
    });

    it('the sender cannot move a message to another conversation, re-date it or re-parent it', async () => {
      const other = await createConversation(db, A, 'group', [C]);
      const m = (await sendMessage(db, A, ab, 'stay')).rows[0].id as string;
      for (const set of [`conversation_id = '${other}'`, `created_at = now() - interval '5 years'`, `sender_id = '${B}'`, `reply_to_message_id = '${m}'`]) {
        const r = await attempt(() => asUser(db, A, (q) => q(`UPDATE public.messages SET ${set} WHERE id = $1`, [m])));
        expect(r.ok, set).toBe(false);
      }
    });

    it('a receipt cannot be moved onto a message in a conversation you are not in', async () => {
      const mine = (await sendMessage(db, A, ab, 'r1')).rows[0].id as string;
      const foreign = (await sendMessage(db, A, group, 'r2')).rows[0].id as string;
      await asUser(db, B, (q) => q(`INSERT INTO public.message_receipts (message_id, user_id, read_at) VALUES ($1, $2, now())`, [mine, B]));
      const r = await attempt(() => asUser(db, B, (q) => q(`UPDATE public.message_receipts SET message_id = $1 WHERE message_id = $2 AND user_id = $3`, [foreign, mine, B])));
      expect(r.ok).toBe(false);
    });
  });

  describe('blocking', () => {
    it('a blocked person cannot message the person who blocked them', async () => {
      const dm = await createConversation(db, B, 'private', [D]);
      await asUser(db, D, (q) => q(`INSERT INTO public.blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [D, B]));
      expect((await attempt(() => sendMessage(db, B, dm))).ok).toBe(false);
      expect((await attempt(() => sendMessage(db, D, dm))).ok).toBe(true);
    });

    it('nobody else can read or create a block', async () => {
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM public.blocks`))).toBe(0);
      expect((await attempt(() => asUser(db, C, (q) => q(`INSERT INTO public.blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [A, B])))).ok).toBe(false);
    });
  });

  describe('storage', () => {
    beforeAll(async () => {
      await seed(db, `INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('encrypted_attachments', $1, $2)`, [`${ab}/1_file.bin`, A]);
    });

    it('a member can list the attachment; an outsider cannot', async () => {
      expect(await asUser(db, B, (q) => count(q, `SELECT 1 FROM storage.objects WHERE bucket_id = 'encrypted_attachments'`))).toBe(1);
      expect(await asUser(db, C, (q) => count(q, `SELECT 1 FROM storage.objects WHERE bucket_id = 'encrypted_attachments'`))).toBe(0);
    });

    it('an outsider cannot upload into someone else\'s conversation folder or user folder', async () => {
      for (const name of [`${ab}/evil.bin`, `${A}/evil.bin`, `../${ab}/evil.bin`, `${ab}/../x.bin`]) {
        const r = await attempt(() => asUser(db, C, (q) => q(`INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('encrypted_attachments', $1, $2)`, [name, C])));
        expect(r.ok, name).toBe(false);
      }
    });

    it('since 021 nobody can upload directly: not a member into the conversation, not a user into their own folder', async () => {
      expect((await attempt(() => asUser(db, B, (q) => q(`INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('encrypted_attachments', $1, $2)`, [`${ab}/2_ok.bin`, B])))).ok).toBe(false);
      expect((await attempt(() => asUser(db, C, (q) => q(`INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('encrypted_attachments', $1, $2)`, [`${C}/mine.bin`, C])))).ok).toBe(false);
    });

    it('only the owner of a folder (or an admin) can delete', async () => {
      expect((await asUser(db, B, (q) => q(`DELETE FROM storage.objects WHERE name = $1 RETURNING id`, [`${ab}/1_file.bin`]))).rows).toHaveLength(0);
      expect((await asUser(db, C, (q) => q(`DELETE FROM storage.objects WHERE name = $1 RETURNING id`, [`${A}/none`]))).rows).toHaveLength(0);
    });

    it('the buckets carry their own size and type limits', async () => {
      const r = await seed(db, `SELECT id, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id IN ('encrypted_attachments','attachments') ORDER BY id`);
      expect(r.rows).toHaveLength(2);
      const limits = Object.fromEntries(r.rows.map((row) => [row.id as string, Number(row.file_size_limit)]));
      expect(limits).toEqual({ attachments: 26214400, encrypted_attachments: 104857600 });
      for (const row of r.rows) expect(row.allowed_mime_types).toEqual(['application/octet-stream']);
    });
  });

  describe('communities and invites', () => {
    let community: string;
    let code: string;

    beforeAll(async () => {
      const created = await asUser(db, A, (q) => q(`SELECT public.create_community('Studio', 'x') AS r`));
      const raw = created.rows[0].r as unknown;
      community = (typeof raw === 'string' ? raw.replace(/[()"]/g, '').split(',')[0] : (raw as { community_id?: string }).community_id ?? '') as string;
      if (!community) community = (await seed(db, `SELECT id FROM public.communities LIMIT 1`)).rows[0].id as string;
      code = (await asUser(db, A, (q) => q(`SELECT public.create_community_invite($1, 999999, 999999) AS c`, [community]))).rows[0].c as string;
    });

    it('only community admins can create an invite', async () => {
      const r = await attempt(() => asUser(db, C, (q) => q(`SELECT public.create_community_invite($1)`, [community])));
      expect(r.ok).toBe(false);
    });

    it('invite lifetime and use count are capped', async () => {
      const row = (await seed(db, `SELECT max_uses, expires_at - created_at AS life FROM public.community_invites WHERE community_id = $1`, [community])).rows[0];
      expect(Number(row.max_uses)).toBe(250);
    });

    it('invites are stored hashed and cannot be read by clients', async () => {
      expect(await asUser(db, A, (q) => count(q, `SELECT 1 FROM public.community_invites`))).toBe(0);
      const stored = (await seed(db, `SELECT code_hash FROM public.community_invites LIMIT 1`)).rows[0].code_hash as string;
      expect(stored).not.toContain(code);
    });

    it('a wrong code does not join', async () => {
      const r = await attempt(() => asUser(db, C, (q) => q(`SELECT public.join_community('AAAAAAAAAAAAAAAAAAAA')`)));
      expect(r.ok).toBe(false);
    });

    it('a valid code joins as a plain member, and cannot be used to gain a role', async () => {
      const r = await attempt(() => asUser(db, C, (q) => q(`SELECT public.join_community($1)`, [code])));
      expect(r.ok).toBe(true);
      expect((await seed(db, `SELECT role FROM public.community_members WHERE community_id = $1 AND user_id = $2`, [community, C])).rows[0].role).toBe('member');
      const promote = await attempt(() => asUser(db, C, (q) => q(`SELECT public.set_community_role($1, $2, 'owner')`, [community, C])));
      expect(promote.ok).toBe(false);
      const direct = await attempt(() => asUser(db, C, (q) => q(`UPDATE public.community_members SET role = 'owner' WHERE community_id = $1 AND user_id = $2`, [community, C])));
      expect((await seed(db, `SELECT role FROM public.community_members WHERE community_id = $1 AND user_id = $2`, [community, C])).rows[0].role).toBe('member');
      void direct;
    });

    it('a member cannot remove the owner, and cannot write community tables directly', async () => {
      const r = await attempt(() => asUser(db, C, (q) => q(`SELECT public.remove_community_member($1, $2)`, [community, A])));
      expect(r.ok).toBe(false);
      const w = await attempt(() => asUser(db, C, (q) => q(`INSERT INTO public.community_members (community_id, user_id, role) VALUES ($1, $2, 'admin')`, [community, D])));
      expect(w.ok).toBe(false);
    });

    it('an outsider cannot see a community or its members', async () => {
      expect(await asUser(db, D, (q) => count(q, `SELECT 1 FROM public.communities`))).toBe(0);
      expect(await asUser(db, D, (q) => count(q, `SELECT 1 FROM public.community_members`))).toBe(0);
    });
  });

  describe('realtime broadcast authorization', () => {
    const send = (who: string, topic: string) =>
      attempt(() =>
        asUser(db, who, async (q) => {
          await q(`SELECT set_config('realtime.topic', $1, true)`, [topic]);
          return q(`INSERT INTO realtime.messages (topic, extension) VALUES ($1, 'broadcast')`, [topic]);
        })
      );
    const receive = (who: string, topic: string) =>
      asUser(db, who, async (q) => {
        await q(`SELECT set_config('realtime.topic', $1, true)`, [topic]);
        return count(q, `SELECT 1 FROM realtime.messages WHERE topic = $1`, [topic]);
      });

    beforeAll(async () => {
      await seed(db, `INSERT INTO realtime.messages (topic, extension) VALUES ($1, 'broadcast'), ($2, 'broadcast')`, [`pc-typing:${ab}`, `pc-call:${A}`]);
    });

    it('typing: only members of the conversation can send or receive', async () => {
      expect((await send(A, `pc-typing:${ab}`)).ok).toBe(true);
      expect((await send(C, `pc-typing:${ab}`)).ok).toBe(false);
      expect(await receive(B, `pc-typing:${ab}`)).toBeGreaterThan(0);
      expect(await receive(C, `pc-typing:${ab}`)).toBe(0);
    });

    it('calls: only the owner of an inbox can listen, and only people who share a conversation can ring it', async () => {
      expect(await receive(A, `pc-call:${A}`)).toBeGreaterThan(0);
      expect(await receive(C, `pc-call:${A}`)).toBe(0);
      expect((await send(B, `pc-call:${A}`)).ok).toBe(true);
      expect((await send(E, `pc-call:${A}`)).ok).toBe(false);
    });

    it('an unknown topic is refused', async () => {
      expect((await send(A, `pc-presence-everyone`)).ok).toBe(false);
      expect((await send(A, `pc-typing:not-a-uuid`)).ok).toBe(false);
    });
  });
});

describe('the schema BEFORE 017 (kept to prove each fix matters)', () => {
  let db: PGlite;
  let ab: string;
  let group: string;

  beforeAll(async () => {
    db = await createDatabase('017');
    await seedUsers(db);
    ab = await createConversation(db, A, 'private', [B]);
    group = await createConversation(db, A, 'group', [B]);
  }, 120000);

  it('NOT exploitable even before 017: moving a membership is stopped by the SELECT policy (017 adds a trigger as a second layer)', async () => {
    const own = await createConversation(db, C, 'group', [D]);
    const r = await attempt(() => asUser(db, C, (q) => q(`UPDATE public.conversation_members SET conversation_id = $1 WHERE conversation_id = $2 AND user_id = $3`, [group, own, C])));
    expect(r.ok).toBe(false);
  });

  it('VULNERABLE: a creator who left could re-insert themselves as owner', async () => {
    const g = await createConversation(db, A, 'group', [B]);
    await asUser(db, A, (q) => q(`DELETE FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2`, [g, A]));
    const r = await attempt(() => asUser(db, A, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner')`, [g, A])));
    expect(r.ok).toBe(true);
  });

  it('VULNERABLE: a plain member could plant a group key envelope for another member', async () => {
    await asUser(db, A, (q) => q(`INSERT INTO public.user_devices (user_id, device_id, identity_public_key, signed_prekey) VALUES ($1, 'd1', 'PUB', 'x')`, [A]));
    const r = await attempt(() => asUser(db, B, (q) => q(`INSERT INTO public.group_key_envelopes (conversation_id, user_id, device_id, encrypted_group_key, key_version) VALUES ($1, $2, 'd1', 'attacker-key', 9)`, [group, A])));
    expect(r.ok).toBe(true);
  });

  it('VULNERABLE: blocking did nothing: a blocked user could still message the person who blocked them', async () => {
    const dm = await createConversation(db, B, 'private', [D]);
    await asUser(db, D, (q) => q(`INSERT INTO public.blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [D, B]));
    expect((await attempt(() => sendMessage(db, B, dm))).ok).toBe(true);
  });

  it('VULNERABLE: a sender could move a message to another conversation', async () => {
    const other = await createConversation(db, A, 'group', [C]);
    const m = (await sendMessage(db, A, ab, 'x')).rows[0].id as string;
    const r = await attempt(() => asUser(db, A, (q) => q(`UPDATE public.messages SET conversation_id = $1 WHERE id = $2`, [other, m])));
    expect(r.ok).toBe(true);
  });
});

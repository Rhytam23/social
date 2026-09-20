import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 020: get_latest_messages(), the one-query replacement for one request per conversation.
 * It must return exactly the newest row per conversation, and only for conversations the caller may read.
 */

const ROOT = uid(1);
const A = uid(2);
const B = uid(3);
const C = uid(4);

async function conversation(db: PGlite, owner: string, other: string): Promise<string> {
  return asUser(db, owner, async (q) => {
    const conv = await q(`INSERT INTO public.conversations (type, created_by) VALUES ('private', $1) RETURNING id`, [owner]);
    const id = conv.rows[0].id as string;
    await q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [id, owner, other]);
    return id;
  });
}

const send = (db: PGlite, sender: string, conv: string, text: string, at: string) =>
  seed(db, `INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce, created_at) VALUES ($1, $2, $3, 'n', $4)`, [conv, sender, text, at]);

describe('migration 020: latest message per conversation', () => {
  let db: PGlite;
  let ab: string;
  let ac: string;
  let bc: string;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [A, 'alice'], [B, 'bob'], [C, 'carol']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
    ab = await conversation(db, A, B);
    ac = await conversation(db, A, C);
    bc = await conversation(db, B, C);
    await send(db, A, ab, 'ab-old', '2026-09-01T10:00:00Z');
    await send(db, B, ab, 'ab-new', '2026-09-02T10:00:00Z');
    await send(db, A, ac, 'ac-only', '2026-09-03T10:00:00Z');
    await send(db, B, bc, 'bc-secret', '2026-09-04T10:00:00Z');
  }, 120000);

  const latestFor = async (user: string, ids: string[]) =>
    (await asUser(db, user, (q) => q(`SELECT conversation_id, ciphertext FROM public.get_latest_messages($1::uuid[])`, [ids]))).rows;

  it('returns exactly the newest message of each requested conversation', async () => {
    const rows = await latestFor(A, [ab, ac]);
    expect(rows).toHaveLength(2);
    expect(Object.fromEntries(rows.map((r) => [r.conversation_id, r.ciphertext]))).toEqual({ [ab]: 'ab-new', [ac]: 'ac-only' });
  });

  it('never returns a conversation the caller is not in, even when asked for it by id', async () => {
    const rows = await latestFor(A, [ab, bc]);
    expect(rows.map((r) => r.conversation_id)).toEqual([ab]);
    expect(await latestFor(A, [bc])).toEqual([]);
  });

  it('returns nothing for an empty list and skips conversations without messages', async () => {
    expect(await latestFor(A, [])).toEqual([]);
    const empty = await conversation(db, A, B);
    expect(await latestFor(A, [empty])).toEqual([]);
  });

  it('is not callable when signed out', async () => {
    await expect(asAnon(db, (q) => q(`SELECT * FROM public.get_latest_messages($1::uuid[])`, [[ab]]))).rejects.toThrow();
  });
});

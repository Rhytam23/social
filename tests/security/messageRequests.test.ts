import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 026: a person you have not talked to can send 3 messages in a direct chat until you reply.
 * Real Postgres (PGlite) running the project's migrations, with the API role.
 */

const ROOT = uid(1); // first account is bootstrapped as platform admin
const A = uid(2);
const B = uid(3);
const C = uid(4);
const D = uid(5);

async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function direct(db: PGlite, creator: string, other: string): Promise<string> {
  return asUser(db, creator, async (q) => {
    const conv = await q(`INSERT INTO public.conversations (type, created_by) VALUES ('private', $1) RETURNING id`, [creator]);
    const id = conv.rows[0].id as string;
    await q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [id, creator, other]);
    return id;
  });
}

const send = (db: PGlite, conv: string, sender: string) =>
  attempt(() => asUser(db, sender, (q) => q(`INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, 'c', 'n')`, [conv, sender])));

describe('migration 026: message requests', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [A, 'ann'], [B, 'bob'], [C, 'cat'], [D, 'dan']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
  }, 120000);

  it('a stranger can send 3 messages, and the 4th is refused', async () => {
    const conv = await direct(db, A, B);
    for (let i = 0; i < 3; i++) expect((await send(db, conv, A)).ok).toBe(true);
    const fourth = await send(db, conv, A);
    expect(fourth.ok).toBe(false);
    expect(fourth.error).toMatch(/message_request_limit/);
  });

  it('once the other person replies, the chat is normal for both', async () => {
    const conv = await direct(db, A, C);
    for (let i = 0; i < 3; i++) await send(db, conv, A);
    expect((await send(db, conv, A)).ok).toBe(false);
    expect((await send(db, conv, C)).ok).toBe(true);
    for (let i = 0; i < 6; i++) expect((await send(db, conv, A)).ok).toBe(true);
    for (let i = 0; i < 6; i++) expect((await send(db, conv, C)).ok).toBe(true);
  });

  it('the person who received the request can send freely from the start', async () => {
    const conv = await direct(db, A, D);
    await send(db, conv, A);
    for (let i = 0; i < 5; i++) expect((await send(db, conv, D)).ok).toBe(true);
  });

  it('deleting messages does not give the limit back', async () => {
    const conv = await direct(db, B, C);
    for (let i = 0; i < 3; i++) await send(db, conv, B);
    await asUser(db, B, (q) => q(`DELETE FROM public.messages WHERE conversation_id = $1 AND sender_id = $2`, [conv, B]));
    expect((await send(db, conv, B)).error).toMatch(/message_request_limit/);
  });

  it('a person cannot edit the counters, and cannot reset them by leaving and re-adding themselves', async () => {
    const conv = await direct(db, B, D);
    for (let i = 0; i < 3; i++) await send(db, conv, B);

    const reset = await attempt(() => asUser(db, B, (q) => q(`UPDATE public.conversations SET intro_count = 0 WHERE id = $1`, [conv])));
    // Direct chats cannot be updated by members at all (the row is filtered out or the trigger refuses).
    const after = await seed(db, `SELECT intro_count FROM public.conversations WHERE id = $1`, [conv]);
    expect(after.rows[0].intro_count).toBe(3);
    expect(reset.ok === false || after.rows[0].intro_count === 3).toBe(true);

    await asUser(db, B, (q) => q(`DELETE FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2`, [conv, B]));
    await attempt(() => asUser(db, B, (q) => q(`INSERT INTO public.conversation_members (conversation_id, user_id) VALUES ($1, $2)`, [conv, B])));
    expect((await send(db, conv, B)).ok).toBe(false);
  });

  it('another person cannot mark a chat as replied to lift the limit', async () => {
    const conv = await direct(db, C, D);
    for (let i = 0; i < 3; i++) await send(db, conv, C);
    await attempt(() => asUser(db, C, (q) => q(`UPDATE public.conversations SET replied = TRUE WHERE id = $1`, [conv])));
    expect((await send(db, conv, C)).ok).toBe(false);
  });

  it('each new stranger has their own allowance', async () => {
    const one = await direct(db, D, A);
    const two = await direct(db, D, B);
    for (let i = 0; i < 3; i++) {
      expect((await send(db, one, D)).ok).toBe(true);
      expect((await send(db, two, D)).ok).toBe(true);
    }
    expect((await send(db, one, D)).ok).toBe(false);
    expect((await send(db, two, D)).ok).toBe(false);
  });

  it('a platform admin is not limited, and starting a chat opens it for the other person', async () => {
    const conv = await direct(db, ROOT, A);
    for (let i = 0; i < 6; i++) expect((await send(db, conv, ROOT)).ok).toBe(true);
    // The admin reached out, so this is a normal conversation and the person can answer at length.
    for (let i = 0; i < 6; i++) expect((await send(db, conv, A)).ok).toBe(true);
  });

  it('groups are not limited', async () => {
    const group = await asUser(db, C, async (q) => {
      const conv = await q(`INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'g', $1) RETURNING id`, [C]);
      const id = conv.rows[0].id as string;
      await q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner')`, [id, C]);
      return id;
    });
    for (let i = 0; i < 8; i++) expect((await send(db, group, C)).ok).toBe(true);
  });
});

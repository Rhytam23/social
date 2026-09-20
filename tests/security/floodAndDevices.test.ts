import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 018: a cap on registered device identities and database-level write limits,
 * exercised with the API role on a real Postgres (PGlite) running the project's migrations.
 */

const ROOT = uid(1); // first account is bootstrapped as admin, kept out of the way
const P = uid(2);
const Q = uid(3);
const R = uid(4);

async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const registerDevice = (db: PGlite, user: string, deviceId: string) =>
  asUser(db, user, (q) =>
    q(
      `INSERT INTO public.user_devices (user_id, device_id, identity_public_key, signed_prekey)
       VALUES ($1, $2, 'pk', 'pk')
       ON CONFLICT (user_id, device_id) DO UPDATE SET last_seen_at = NOW()`,
      [user, deviceId]
    )
  );

async function newConversation(db: PGlite, owner: string): Promise<string> {
  return asUser(db, owner, async (q) => {
    const conv = await q(`INSERT INTO public.conversations (type, name, created_by) VALUES ('group', 'g', $1) RETURNING id`, [owner]);
    const id = conv.rows[0].id as string;
    await q(`INSERT INTO public.conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'owner')`, [id, owner]);
    return id;
  });
}

describe('migration 018: devices and flood limits', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createDatabase();
    for (const [id, name] of [[ROOT, 'root'], [P, 'pat'], [Q, 'quinn'], [R, 'robin']] as const) {
      await seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)`, [id, `${name}@example.com`, JSON.stringify({ display_name: name, username: name })]);
    }
  }, 120000);

  describe('device identities', () => {
    it('an account can register up to 3 identities and the 4th is refused', async () => {
      for (const d of ['d1', 'd2', 'd3']) expect((await attempt(() => registerDevice(db, P, d))).ok).toBe(true);
      const fourth = await attempt(() => registerDevice(db, P, 'd4'));
      expect(fourth.ok).toBe(false);
      expect(fourth.error).toMatch(/device_limit_reached/);
    });

    it('re-registering an identity the account already has still works at the cap', async () => {
      expect((await attempt(() => registerDevice(db, P, 'd2'))).ok).toBe(true);
    });

    it('the cap is per account: another user is unaffected', async () => {
      expect((await attempt(() => registerDevice(db, Q, 'q1'))).ok).toBe(true);
    });

    it('removing an identity frees a slot', async () => {
      await asUser(db, P, (q) => q(`DELETE FROM public.user_devices WHERE user_id = $1 AND device_id = 'd1'`, [P]));
      expect((await attempt(() => registerDevice(db, P, 'd4'))).ok).toBe(true);
    });

    it('a user cannot register a device for someone else', async () => {
      const r = await attempt(() => asUser(db, Q, (q) => q(`INSERT INTO public.user_devices (user_id, device_id, identity_public_key, signed_prekey) VALUES ($1, 'x', 'pk', 'pk')`, [R])));
      expect(r.ok).toBe(false);
    });
  });

  describe('write limits', () => {
    it('refuses the 121st message from one account within a minute, and only that account', async () => {
      const conv = await newConversation(db, Q);
      const insert = () =>
        asUser(db, Q, (q) => q(`INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, 'c', 'n')`, [conv, Q]));
      for (let i = 0; i < 120; i++) expect((await attempt(insert)).ok).toBe(true);
      const over = await attempt(insert);
      expect(over.ok).toBe(false);
      expect(over.error).toMatch(/rate_limit_exceeded/);

      const other = await newConversation(db, R);
      const fine = await attempt(() =>
        asUser(db, R, (q) => q(`INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, 'c', 'n')`, [other, R]))
      );
      expect(fine.ok).toBe(true);
    }, 120000);

    it('refuses the 31st conversation created by one account within an hour', async () => {
      // Q already created one above.
      for (let i = 0; i < 29; i++) await newConversation(db, Q);
      const over = await attempt(() => newConversation(db, Q));
      expect(over.ok).toBe(false);
      expect(over.error).toMatch(/rate_limit_exceeded/);
    }, 120000);

    it('does not limit trusted server-side writes (no signed-in user)', async () => {
      const conv = await newConversation(db, ROOT);
      for (let i = 0; i < 130; i++) {
        await seed(db, `INSERT INTO public.messages (conversation_id, sender_id, ciphertext, nonce) VALUES ($1, $2, 'c', 'n')`, [conv, ROOT]);
      }
      const r = await seed(db, `SELECT count(*)::int AS n FROM public.messages WHERE sender_id = $1`, [ROOT]);
      expect(r.rows[0].n).toBe(130);
    }, 120000);
  });
});

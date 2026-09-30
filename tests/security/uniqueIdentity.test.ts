import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { asAnon, asUser, createDatabase, seed, uid } from './pgHarness';

/**
 * Migration 030: no duplicate people (case-insensitive usernames, unique email and phone), a username
 * the person chooses, and a change limit. Run on a real Postgres (PGlite) with the project's own migrations.
 */

const MIGRATION_030 = readFileSync(path.resolve(__dirname, '../../database/migrations/030_unique_identity.sql'), 'utf8');

async function attempt(fn: () => Promise<unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const signUp = (db: Awaited<ReturnType<typeof createDatabase>>, id: string, email: string, meta: Record<string, string> = {}) =>
  seed(db, `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3::jsonb)`, [id, email, JSON.stringify(meta)]);

describe('030 unique identity (fresh database)', () => {
  it('rejects a username that differs only by letter case', async () => {
    const db = await createDatabase();
    await signUp(db, uid(1), 'root@example.com'); // first account becomes admin
    await signUp(db, uid(2), 'a@example.com', { username: 'alice' });
    await signUp(db, uid(3), 'b@example.com');
    const r = await attempt(() => asUser(db, uid(3), (q) => q(`UPDATE public.profiles SET username = 'ALICE' WHERE id = $1`, [uid(3)])));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/duplicate|unique/i);
  });

  it('stores usernames lowercase and rejects invalid ones', async () => {
    const db = await createDatabase();
    await signUp(db, uid(1), 'root@example.com');
    await signUp(db, uid(2), 'a@example.com');
    await asUser(db, uid(2), (q) => q(`UPDATE public.profiles SET username = 'Mixed.Case_1' WHERE id = $1`, [uid(2)]));
    const row = await seed(db, `SELECT username, username_set FROM public.profiles WHERE id = $1`, [uid(2)]);
    expect(row.rows[0]).toEqual({ username: 'mixed.case_1', username_set: true });
    const bad = await attempt(() => asUser(db, uid(2), (q) => q(`UPDATE public.profiles SET username = 'no spaces!' WHERE id = $1`, [uid(2)])));
    expect(bad.ok).toBe(false);
  });

  it('sign-up never fails on a name clash: the second person gets a free name', async () => {
    const db = await createDatabase();
    await signUp(db, uid(1), 'root@example.com');
    await signUp(db, uid(2), 'sam@one.com');
    await signUp(db, uid(3), 'sam@two.com'); // same email prefix
    await signUp(db, uid(4), 'x@three.com', { username: 'SAM' });
    const rows = await seed(db, `SELECT lower(username) AS u FROM public.profiles`);
    const names = rows.rows.map((r) => r.u as string);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(4);
  });

  it('a new account is asked to choose a username (username_set is false)', async () => {
    const db = await createDatabase();
    await signUp(db, uid(1), 'root@example.com');
    await signUp(db, uid(2), 'a@example.com');
    const row = await asUser(db, uid(2), (q) => q(`SELECT username_set FROM public.profiles WHERE id = $1`, [uid(2)]));
    expect(row.rows[0].username_set).toBe(false);
  });

  it('nobody can flip username_set by hand, and a username can be changed once every 14 days', async () => {
    const db = await createDatabase();
    await signUp(db, uid(1), 'root@example.com');
    await signUp(db, uid(2), 'a@example.com');
    await asUser(db, uid(2), (q) => q(`UPDATE public.profiles SET username_set = TRUE WHERE id = $1`, [uid(2)]));
    expect((await seed(db, `SELECT username_set FROM public.profiles WHERE id = $1`, [uid(2)])).rows[0].username_set).toBe(false);

    await asUser(db, uid(2), (q) => q(`UPDATE public.profiles SET username = 'first_pick' WHERE id = $1`, [uid(2)])); // free
    const again = await attempt(() => asUser(db, uid(2), (q) => q(`UPDATE public.profiles SET username = 'second_pick' WHERE id = $1`, [uid(2)])));
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/14 days/);

    await seed(db, `UPDATE public.profiles SET username_changed_at = NOW() - INTERVAL '15 days' WHERE id = $1`, [uid(2)]);
    const later = await attempt(() => asUser(db, uid(2), (q) => q(`UPDATE public.profiles SET username = 'second_pick' WHERE id = $1`, [uid(2)])));
    expect(later.ok).toBe(true);
  });

  it('email and phone number cannot be shared, even with different case or spacing', async () => {
    const db = await createDatabase();
    await signUp(db, uid(1), 'root@example.com');
    await signUp(db, uid(2), 'a@example.com');
    await signUp(db, uid(3), 'b@example.com');
    const mail = await attempt(() => seed(db, `UPDATE public.profiles SET email = ' A@Example.com ' WHERE id = $1`, [uid(3)]));
    expect(mail.ok).toBe(false);
    await seed(db, `UPDATE public.profiles SET phone_number = '+911234567890' WHERE id = $1`, [uid(2)]);
    const phone = await attempt(() => seed(db, `UPDATE public.profiles SET phone_number = ' +911234567890' WHERE id = $1`, [uid(3)]));
    expect(phone.ok).toBe(false);
    // blank phone numbers are stored as NULL, so several people can have none
    await seed(db, `UPDATE public.profiles SET phone_number = '  ' WHERE id IN ($1, $2)`, [uid(1), uid(3)]);
    expect((await seed(db, `SELECT count(*)::int AS n FROM public.profiles WHERE phone_number IS NULL`)).rows[0].n).toBe(2);
  });

  it('available_usernames is callable only by the server and hides reserved or taken names', async () => {
    const db = await createDatabase();
    await signUp(db, uid(1), 'root@example.com');
    await signUp(db, uid(2), 'a@example.com', { username: 'taken_name' });
    const call = `SELECT public.available_usernames(ARRAY['Taken_Name','free_one','admin','nook_support','ab'])::text AS r`;
    const asServer = await seed(db, call);
    expect(asServer.rows[0].r).toBe('{free_one}');
    expect((await attempt(() => asUser(db, uid(2), (q) => q(call)))).ok).toBe(false);
    expect((await attempt(() => asAnon(db, (q) => q(call)))).ok).toBe(false);
  });
});

describe('030 unique identity (upgrading an existing database)', () => {
  it('renames existing case-insensitive clashes instead of failing, and can be re-run', async () => {
    const db = await createDatabase('030');
    await signUp(db, uid(1), 'root@example.com');
    await signUp(db, uid(2), 'one@example.com');
    await signUp(db, uid(3), 'two@example.com');
    await signUp(db, uid(4), 'three@example.com');
    // Allowed by the old, case-sensitive rule:
    await seed(db, `UPDATE public.profiles SET username = 'Alice' WHERE id = $1`, [uid(2)]);
    await seed(db, `UPDATE public.profiles SET username = 'alice' WHERE id = $1`, [uid(3)]);
    await seed(db, `UPDATE public.profiles SET email = 'Dup@Example.com' WHERE id = $1`, [uid(2)]);
    await seed(db, `UPDATE public.profiles SET email = 'dup@example.com' WHERE id = $1`, [uid(3)]);
    await seed(db, `UPDATE public.profiles SET username = 'made_by_me' WHERE id = $1`, [uid(4)]);

    await db.exec(MIGRATION_030);
    await db.exec(MIGRATION_030);

    const rows = await seed(db, `SELECT id, username, username_set, email FROM public.profiles ORDER BY id`);
    const byId = new Map(rows.rows.map((r) => [r.id as string, r]));
    const names = rows.rows.map((r) => r.username as string);
    expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(names.length);
    expect(byId.get(uid(3))!.username).toMatch(/^alice_[0-9a-f]{6}$/);
    expect(byId.get(uid(2))!.username).toBe('alice'); // the oldest keeps the name
    expect(byId.get(uid(2))!.email).toBe('dup@example.com');
    expect(byId.get(uid(3))!.email).toBeNull();
    expect(byId.get(uid(4))!.username_set).toBe(true); // a name someone picked is kept as chosen
    expect(byId.get(uid(2))!.username_set).toBe(true);
  });
});

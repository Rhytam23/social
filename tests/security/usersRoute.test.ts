import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

type Profile = { id: string; username: string; display_name: string; is_admin?: boolean };

const state: { user: string | null; profiles: Profile[]; blocked: string[]; rpcCalls: Array<Record<string, unknown>>; readProfilesAsUser: number } = {
  user: null,
  profiles: [],
  blocked: [],
  rpcCalls: [],
  readProfilesAsUser: 0,
};

/** The server-only search function, as migration 028 defines it (its behaviour is tested on real Postgres in profileVisibility.test.ts). */
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (fn: string, args: { p_caller: string; p_prefix: string; p_limit: number }) => {
      state.rpcCalls.push({ fn, ...args });
      const prefix = args.p_prefix.toLowerCase();
      const rows = state.profiles
        .filter((p) => p.id !== args.p_caller && !p.is_admin && p.username.toLowerCase().startsWith(prefix))
        .sort((a, b) => a.username.localeCompare(b.username))
        .slice(0, args.p_limit)
        .map(({ id, username, display_name }) => ({ id, username, display_name }));
      return { data: rows, error: null };
    },
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null }, error: null }) },
    from: (table: string) => {
      // Reading strangers' profiles with the person's own session is exactly what 028 closed: count any attempt.
      if (table === 'profiles') state.readProfilesAsUser++;
      const b = {
        select: () => b,
        eq: () => b,
        in: (_c: string, ids: string[]) => ({ then: (resolve: (v: unknown) => void) => resolve({ data: state.blocked.filter((x) => ids.includes(x)).map((blocked_id) => ({ blocked_id })), error: null }) }),
      };
      return b;
    },
  }),
}));

import { GET } from '../../app/api/users/route';

const ME = 'aaaaaaaa-0000-4000-8000-0000000000a1';
let n = 0;
const search = (q: string) =>
  GET(new NextRequest(`http://localhost:3000/api/users?username=${encodeURIComponent(q)}`, { headers: { 'x-real-ip': `192.0.2.${(++n % 240) + 1}` } }));

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role');
  Object.assign(state, {
    user: ME,
    rpcCalls: [],
    readProfilesAsUser: 0,
    blocked: [],
    profiles: [
      { id: 'u1', username: 'arsh', display_name: 'Arsh' },
      { id: 'u2', username: 'arsalan', display_name: 'Arsalan' },
      { id: 'u3', username: 'ars', display_name: 'Ars' },
      { id: 'u4', username: 'barsh', display_name: 'Barsh' },
      { id: 'u5', username: 'alex', display_name: 'Alex' },
    ],
  });
});

afterEach(() => vi.unstubAllEnvs());

describe('GET /api/users?username=<start of a username>', () => {
  it('needs a session', async () => {
    state.user = null;
    expect((await search('ars')).status).toBe(401);
  });

  it('returns everyone whose username starts with the text, the exact match first', async () => {
    const res = await search('ars');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: Array<{ username: string }> };
    expect(body.users.map((u) => u.username)).toEqual(['ars', 'arsalan', 'arsh']);
  });

  it('does not match the middle of a username', async () => {
    const body = (await (await search('arsh')).json()) as { users: Array<{ username: string }> };
    expect(body.users.map((u) => u.username)).toEqual(['arsh']);
  });

  it('is case-insensitive and ignores a leading @', async () => {
    const body = (await (await search('@ARS')).json()) as { users: unknown[] };
    expect(body.users).toHaveLength(3);
  });

  it('refuses fewer than 3 characters, wildcards and email-like text', async () => {
    expect((await search('ar')).status).toBe(400);
    expect((await search('a%s')).status).toBe(400);
    expect((await search('a@b.com')).status).toBe(400);
    expect(state.rpcCalls).toHaveLength(0);
  });

  it('never lists the searcher, and returns nothing for an unused start', async () => {
    state.profiles.push({ id: ME, username: 'arsme', display_name: 'Me' });
    const body = (await (await search('arsm')).json()) as { users: unknown[] };
    expect(body.users).toEqual([]);
  });

  it('returns at most 8 people', async () => {
    state.profiles = Array.from({ length: 20 }, (_, i) => ({ id: `m${i}`, username: `many${String(i).padStart(2, '0')}`, display_name: 'x' }));
    const body = (await (await search('many')).json()) as { users: unknown[] };
    expect(body.users).toHaveLength(8);
  });

  it('flags people the searcher blocked and never returns email, phone or other private fields', async () => {
    state.blocked = ['u1'];
    const body = (await (await search('arsh')).json()) as { users: Array<Record<string, unknown>> };
    expect(body.users[0].blocked).toBe(true);
    expect(Object.keys(body.users[0]).sort()).toEqual(['blocked', 'display_name', 'id', 'username']);
  });

  it('searches only through the server-only function, never by reading profiles with the caller session', async () => {
    await search('ars');
    expect(state.rpcCalls).toEqual([{ fn: 'search_profiles_by_prefix', p_caller: ME, p_prefix: 'ars', p_limit: 8 }]);
    expect(state.readProfilesAsUser).toBe(0);
  });

  it('is unavailable without the server key, instead of falling back to reading profiles', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect((await search('ars')).status).toBe(503);
    expect(state.readProfilesAsUser).toBe(0);
  });

  it('never returns a platform admin', async () => {
    state.profiles.push({ id: 'admin1', username: 'arsroot', display_name: 'Root', is_admin: true });
    const body = (await (await search('ars')).json()) as { users: Array<{ username: string }> };
    expect(body.users.map((u) => u.username)).not.toContain('arsroot');
  });

  it('limits how often one account can search', async () => {
    const codes: number[] = [];
    for (let i = 0; i < 45; i++) codes.push((await search('ars')).status);
    expect(codes).toContain(429);
    expect(codes.filter((c) => c === 200).length).toBeLessThanOrEqual(40);
  });
});

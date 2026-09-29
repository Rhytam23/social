import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

type Row = Record<string, unknown>;

const db: { profiles: Row[]; blocks: Row[]; conversation_members: Row[]; me: string } = {
  profiles: [],
  blocks: [],
  conversation_members: [],
  me: 'me',
};

/** Postgres LIKE/ILIKE with backslash escapes, so the escaping in the route is really exercised. */
function likeToRegex(pattern: string): RegExp {
  const esc = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '\\') out += esc(pattern[++i] ?? '');
    else if (c === '%') out += '.*';
    else if (c === '_') out += '.';
    else out += esc(c);
  }
  return new RegExp(`^${out}$`, 'i');
}

function table(source: Row[]) {
  let rows = source;
  const filters: Array<(r: Row) => boolean> = [];
  let cols: string[] | null = null;
  let max = Infinity;
  const run = () =>
    rows
      .filter((r) => filters.every((f) => f(r)))
      .slice(0, max)
      .map((r) => (cols ? Object.fromEntries(cols.map((c) => [c, r[c]])) : r));
  const q: Record<string, unknown> = {
    select: (c: string) => {
      cols = c.split(',').map((x) => x.trim());
      return q;
    },
    ilike: (col: string, pat: string) => {
      filters.push((r) => likeToRegex(pat).test(String(r[col] ?? '')));
      return q;
    },
    neq: (col: string, v: unknown) => {
      filters.push((r) => r[col] !== v);
      return q;
    },
    eq: (col: string, v: unknown) => {
      filters.push((r) => r[col] === v);
      return q;
    },
    in: (col: string, v: unknown[]) => {
      filters.push((r) => v.includes(r[col]));
      return q;
    },
    is: (col: string, v: unknown) => {
      filters.push((r) => (r[col] ?? null) === v);
      return q;
    },
    order: (col: string) => {
      rows = [...rows].sort((a, b) => String(a[col] ?? '').localeCompare(String(b[col] ?? '')));
      return q;
    },
    limit: (n: number) => {
      max = n;
      return q;
    },
    maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
    then: (resolve: (v: unknown) => unknown) => resolve({ data: run(), error: null }),
  };
  return q;
}

/** The server-only search function (migration 028): starts-with, no admins, not the caller. Real behaviour is tested on Postgres. */
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (_fn: string, args: { p_caller: string; p_prefix: string; p_limit: number }) => {
      const rows = db.profiles
        .filter((p) => p.id !== args.p_caller && !p.is_admin && String(p.username).toLowerCase().startsWith(args.p_prefix))
        .sort((a, b) => String(a.username).localeCompare(String(b.username)))
        .slice(0, args.p_limit)
        .map(({ id, username, display_name, avatar_url, created_at, bio, pronouns, timezone }) => ({ id, username, display_name, avatar_url, created_at, bio, pronouns, timezone }));
      return { data: rows, error: null };
    },
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: db.me ? { id: db.me } : null }, error: null }) },
    from: (name: 'profiles' | 'blocks' | 'conversation_members') => table(db[name]),
  }),
}));

import { GET } from '../../app/api/users/route';

let call = 0;
const get = async (qs: string) => {
  const req = new NextRequest(new Request(`http://localhost:3000/api/users${qs}`, { headers: { 'x-forwarded-for': `10.0.0.${++call}` } }));
  const res = await GET(req);
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role');
  db.me = 'me';
  db.profiles = [
    { id: 'me', username: 'me_user', display_name: 'Me', email: 'me@x.io', phone_number: '111', is_admin: false },
    { id: 'u1', username: 'alex_m', display_name: 'Alex Morgan', email: 'alex@example.com', phone_number: '+15550199', bio: 'hello', is_admin: false },
    { id: 'u2', username: 'sam.k', display_name: 'Samir Khan', email: 'sam@example.com', phone_number: '+15550100', is_admin: false },
    { id: 'u3', username: 'alexxm', display_name: 'Alexx M', email: 'a3@example.com', phone_number: null, is_admin: false },
  ];
  db.blocks = [];
  db.conversation_members = [];
});

type Found = { username: string; blocked: boolean; id: string };
const names = (body: { users: Found[] }) => body.users.map((u) => u.username);

describe('GET /api/users?username= (start of a username)', () => {
  it('requires a signed-in user', async () => {
    db.me = '';
    expect((await get('?username=alex_m')).status).toBe(401);
  });

  it('finds a person by their full username', async () => {
    const { status, body } = await get('?username=alex_m');
    expect(status).toBe(200);
    expect(body.users).toHaveLength(1);
    expect(body.users[0]).toMatchObject({ id: 'u1', username: 'alex_m', display_name: 'Alex Morgan', blocked: false });
  });

  it('finds everyone whose username starts with the text, exact match first', async () => {
    const { body } = await get('?username=alex');
    expect(names(body)).toEqual(['alex_m', 'alexxm']);
    db.profiles.push({ id: 'u9', username: 'alex', display_name: 'Alex', is_admin: false });
    expect(names((await get('?username=alex')).body)[0]).toBe('alex');
  });

  it('is case-insensitive and accepts a leading @', async () => {
    expect((await get('?username=ALEX_M')).body.users[0].id).toBe('u1');
    expect((await get('?username=%40Alex_M')).body.users[0].id).toBe('u1');
  });

  it('never returns email or phone number', async () => {
    const { body } = await get('?username=alex');
    expect(JSON.stringify(body)).not.toContain('example.com');
    expect(JSON.stringify(body)).not.toContain('5550199');
    expect(JSON.stringify(body)).not.toContain('email');
  });

  it('does not match the middle or end of a username', async () => {
    expect((await get('?username=lex_m')).body.users).toEqual([]);
    expect((await get('?username=morgan')).body.users).toEqual([]);
  });

  it('treats an underscore literally: al_x must not match alex_m', async () => {
    expect((await get('?username=al_x')).body.users).toEqual([]);
  });

  it('does not find people by display name, email, phone or bio', async () => {
    expect((await get('?username=Alex%20Morgan')).status).toBe(400);
    expect((await get('?username=alex%40example.com')).status).toBe(400);
    expect((await get('?username=%2B15550199')).status).toBe(400);
    expect((await get('?username=hello')).body.users).toEqual([]);
  });

  it('rejects empty, too short and wildcard searches', async () => {
    expect((await get('?username=')).status).toBe(400);
    expect((await get('?username=al')).status).toBe(400);
    expect((await get('?username=%25%25%25')).status).toBe(400);
  });

  it('does not return yourself', async () => {
    expect((await get('?username=me_')).body.users).toEqual([]);
  });

  it('flags people you blocked', async () => {
    db.blocks = [{ blocker_id: 'me', blocked_id: 'u1' }];
    expect((await get('?username=alex')).body.users.find((u: Found) => u.id === 'u1')).toMatchObject({ blocked: true });
  });

  it('does not reveal that someone blocked you', async () => {
    db.blocks = [{ blocker_id: 'u1', blocked_id: 'me' }];
    expect((await get('?username=alex')).body.users.find((u: Found) => u.id === 'u1')).toMatchObject({ blocked: false });
  });
});

describe('GET /api/users (no username)', () => {
  it('lists only people you already share a conversation with', async () => {
    db.conversation_members = [
      { conversation_id: 'c1', user_id: 'me', left_at: null },
      { conversation_id: 'c1', user_id: 'u1', left_at: null },
      { conversation_id: 'c2', user_id: 'u2', left_at: null },
    ];
    const { status, body } = await get('');
    expect(status).toBe(200);
    expect((body as Row[]).map((p) => p.id)).toEqual(['u1']);
  });

  it('returns nothing when you have no conversations, not everyone', async () => {
    expect((await get('')).body).toEqual([]);
  });

  it('ignores the old free-text q parameter', async () => {
    db.conversation_members = [{ conversation_id: 'c1', user_id: 'me', left_at: null }];
    expect((await get('?q=alex')).body).toEqual([]);
  });
});

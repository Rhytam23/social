import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const state: {
  user: string | null;
  member: boolean;
  usedBytes: number | null;
  rpcError: { message: string } | null;
  signError: { message: string } | null;
  listed: Array<{ name: string; metadata: { size: number } | null }>;
  removed: string[];
  signedPaths: string[];
} = { user: null, member: true, usedBytes: 0, rpcError: null, signError: null, listed: [], removed: [], signedPaths: [] };

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null }, error: null }) },
    from: () => {
      const q: Record<string, unknown> = {
        select: () => q,
        eq: () => q,
        is: () => q,
        maybeSingle: async () => ({ data: state.member ? { user_id: state.user } : null, error: null }),
      };
      return q;
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async () => (state.rpcError ? { data: null, error: state.rpcError } : { data: state.usedBytes, error: null }),
    storage: {
      from: () => ({
        createSignedUploadUrl: async (path: string) => {
          if (state.signError) return { data: null, error: state.signError };
          state.signedPaths.push(path);
          return { data: { path, token: 'signed-token', signedUrl: 'https://example.invalid/x' }, error: null };
        },
        list: async () => ({ data: state.listed, error: null }),
        remove: async (paths: string[]) => (state.removed.push(...paths), { data: [], error: null }),
      }),
    },
  }),
}));

import { POST as sign } from '../../app/api/uploads/sign/route';
import { POST as complete } from '../../app/api/uploads/complete/route';

const U = 'aaaaaaaa-0000-4000-8000-000000000041';
const OTHER = 'aaaaaaaa-0000-4000-8000-000000000042';
const CONV = 'bbbbbbbb-0000-4000-8000-000000000041';
const RANDOM = 'cccccccc-0000-4000-8000-000000000041';
const MB = 1024 * 1024;

let n = 0;
let userCounter = 0;
const freshUser = () => `aaaaaaaa-0000-4000-8000-0000000001${String(++userCounter).padStart(2, '0')}`;
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(new Request(`http://localhost:3000${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': `192.0.2.${++n % 250}`, ...headers }, body: JSON.stringify(body) }));
const signReq = (body: unknown, headers?: Record<string, string>) => sign(post('/api/uploads/sign', body, headers));
const completeReq = (body: unknown) => complete(post('/api/uploads/complete', body));

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role');
  vi.stubEnv('NEXT_PUBLIC_STORAGE_MAX_FILE_MB', '');
  Object.assign(state, { user: null, member: true, usedBytes: 0, rpcError: null, signError: null, listed: [], removed: [], signedPaths: [] });
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/uploads/sign', () => {
  it('needs a session and refuses other sites', async () => {
    expect((await signReq({ conversationId: CONV, kind: 'image', size: 10 })).status).toBe(401);
    state.user = freshUser();
    expect((await signReq({ conversationId: CONV, kind: 'image', size: 10 }, { origin: 'https://evil.example', host: 'localhost:3000' })).status).toBe(403);
  });

  it('refuses malformed requests', async () => {
    state.user = freshUser();
    for (const body of [{}, { conversationId: 'nope', kind: 'image', size: 10 }, { conversationId: CONV, kind: 'movie', size: 10 }, { conversationId: CONV, kind: 'image', size: 0 }, { conversationId: CONV, kind: 'image', size: 1.5 }, { conversationId: CONV, kind: 'image', size: '10' }]) {
      expect((await signReq(body)).status, JSON.stringify(body)).toBe(400);
    }
  });

  it('accepts a 10 MB image and issues an opaque path that carries no file name', async () => {
    const user = freshUser();
    state.user = user;
    const res = await signReq({ conversationId: CONV, kind: 'image', size: 10 * MB });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { path: string; token: string };
    expect(body.token).toBe('signed-token');
    expect(body.path).toMatch(new RegExp(`^${CONV}/${user}_[0-9a-f-]{36}$`));
  });

  it('refuses an image over 10 MB and a video over the deployment ceiling with a clear message', async () => {
    state.user = freshUser();
    const image = await signReq({ conversationId: CONV, kind: 'image', size: 10 * MB + 1 });
    expect(image.status).toBe(413);
    expect(((await image.json()) as { error: string }).error).toMatch(/Images can be up to 10 MB/);
    // Default ceiling is 50 MB (the free Supabase plan); 100 MB is refused until it is raised.
    expect((await signReq({ conversationId: CONV, kind: 'video', size: 100 * MB })).status).toBe(413);
    vi.stubEnv('NEXT_PUBLIC_STORAGE_MAX_FILE_MB', '100');
    expect((await signReq({ conversationId: CONV, kind: 'video', size: 100 * MB })).status).toBe(201);
    expect((await signReq({ conversationId: CONV, kind: 'video', size: 100 * MB + 1 })).status).toBe(413);
  });

  it('other files stop at 25 MB', async () => {
    state.user = freshUser();
    expect((await signReq({ conversationId: CONV, kind: 'file', size: 25 * MB })).status).toBe(201);
    expect((await signReq({ conversationId: CONV, kind: 'file', size: 25 * MB + 1 })).status).toBe(413);
  });

  it('a non-member cannot get an upload address for the conversation', async () => {
    state.user = freshUser();
    state.member = false;
    expect((await signReq({ conversationId: CONV, kind: 'image', size: 10 })).status).toBe(403);
    expect(state.signedPaths).toHaveLength(0);
  });

  it('stops at the daily quota', async () => {
    state.user = freshUser();
    state.usedBytes = 495 * MB;
    const res = await signReq({ conversationId: CONV, kind: 'file', size: 10 * MB });
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toMatch(/daily upload limit of 500 MB/);
    state.usedBytes = 400 * MB;
    expect((await signReq({ conversationId: CONV, kind: 'file', size: 10 * MB })).status).toBe(201);
  });

  it('still works (rate limits only) before migration 021 provides the quota function', async () => {
    state.user = freshUser();
    state.rpcError = { message: 'function public.uploaded_bytes_last_day does not exist' };
    expect((await signReq({ conversationId: CONV, kind: 'image', size: 10 })).status).toBe(201);
  });

  it('limits how fast one account can start uploads', async () => {
    state.user = freshUser();
    const codes: number[] = [];
    for (let i = 0; i < 9; i++) codes.push((await signReq({ conversationId: CONV, kind: 'image', size: 10 })).status);
    expect(codes.filter((c) => c === 201)).toHaveLength(6);
    expect(codes.slice(6).every((c) => c === 429)).toBe(true);
  });

  it('is unavailable, not silently broken, when the server key is missing', async () => {
    state.user = freshUser();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect((await signReq({ conversationId: CONV, kind: 'image', size: 10 })).status).toBe(503);
  });

  it('does not leak storage error text', async () => {
    state.user = freshUser();
    state.signError = { message: 'bucket policy internal detail' };
    const res = await signReq({ conversationId: CONV, kind: 'image', size: 10 });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('internal detail');
  });
});

describe('POST /api/uploads/complete', () => {
  const path = (owner: string) => `${CONV}/${owner}_${RANDOM}`;

  it('needs a session', async () => {
    expect((await completeReq({ path: path(U), kind: 'image' })).status).toBe(401);
  });

  it('refuses a path that is not one this account was issued', async () => {
    const user = freshUser();
    state.user = user;
    for (const bad of [path(OTHER), `${CONV}/${user}_not-a-uuid`, `${CONV}/../x/${user}_${RANDOM}`, `${CONV}/${user}_${RANDOM}/extra`, 'nonsense', '']) {
      expect((await completeReq({ path: bad, kind: 'image' })).status, bad).toBe(400);
    }
    expect(state.removed).toHaveLength(0);
  });

  it('confirms a stored file within the limit for its kind', async () => {
    const user = freshUser();
    state.user = user;
    state.listed = [{ name: `${user}_${RANDOM}`, metadata: { size: 8 * MB } }];
    const res = await completeReq({ path: path(user), kind: 'image' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { size: number }).size).toBe(8 * MB);
    expect(state.removed).toHaveLength(0);
  });

  it('deletes and refuses a file whose real size is over the limit (a client that lied when signing)', async () => {
    const user = freshUser();
    state.user = user;
    state.listed = [{ name: `${user}_${RANDOM}`, metadata: { size: 30 * MB } }];
    const res = await completeReq({ path: path(user), kind: 'image' });
    expect(res.status).toBe(413);
    expect(state.removed).toEqual([path(user)]);
  });

  it('says so when the file is not there', async () => {
    const user = freshUser();
    state.user = user;
    state.listed = [];
    expect((await completeReq({ path: path(user), kind: 'image' })).status).toBe(404);
  });

  it('a member who left cannot confirm', async () => {
    const user = freshUser();
    state.user = user;
    state.member = false;
    expect((await completeReq({ path: path(user), kind: 'image' })).status).toBe(403);
  });
});

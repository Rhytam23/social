import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

type Row = Record<string, unknown>;
const db: { conversation_members: Row[]; messages: Row[]; conversations: Row[]; user: string | null; failWith: string | null } = {
  conversation_members: [],
  messages: [],
  conversations: [],
  user: null,
  failWith: null,
};

/** A small in-memory stand-in for the Supabase client: enough to check what the ROUTES decide. */
function table(name: 'conversation_members' | 'messages' | 'conversations') {
  const filters: Array<(r: Row) => boolean> = [];
  let mode: 'select' | 'insert' | 'update' = 'select';
  let payload: Row | Row[] = {};
  const run = () => db[name].filter((r) => filters.every((f) => f(r)));
  const result = (rows: Row[]) => (db.failWith ? { data: null, error: { message: db.failWith } } : { data: rows, error: null });
  const q: Record<string, unknown> = {
    select: () => q,
    order: () => q,
    limit: () => q,
    lt: () => q,
    in: () => q,
    eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), q),
    is: (c: string, v: unknown) => (filters.push((r) => (r[c] ?? null) === v), q),
    insert: (p: Row | Row[]) => ((mode = 'insert'), (payload = p), q),
    update: (p: Row) => ((mode = 'update'), (payload = p), q),
    single: async () => {
      const rows = mode === 'insert' ? [{ id: 'new-id', ...(payload as Row) }] : run();
      const r = result(rows);
      return { data: r.data?.[0] ?? null, error: r.error };
    },
    maybeSingle: async () => {
      if (mode === 'update') {
        const rows = run();
        rows.forEach((r) => Object.assign(r, payload));
        return { data: rows[0] ?? null, error: null };
      }
      return { data: run()[0] ?? null, error: null };
    },
    then: (resolve: (v: unknown) => unknown) => {
      if (mode === 'insert') {
        const rows = Array.isArray(payload) ? payload : [payload];
        return resolve(db.failWith ? { error: { message: db.failWith } } : { error: null, data: rows });
      }
      return resolve(result(run()));
    },
  };
  return q;
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: db.user ? { id: db.user } : null }, error: db.user ? null : { message: 'no session' } }) },
    from: (t: 'conversation_members' | 'messages' | 'conversations') => table(t),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => table('conversations') }) }));
vi.mock('@/lib/auth/roles', () => ({ isUserAdmin: async (id: string) => id === 'aaaaaaaa-0000-4000-8000-000000000004' }));

import { GET as getMessages, POST as postMessage, PATCH as patchMessage } from '../../app/api/messages/route';
import { PATCH as patchAdmin } from '../../app/api/admin/users/route';
import { POST as postGroupMember } from '../../app/api/groups/members/route';
import { clientIp, isUuid } from '../../lib/api/security';

const A = 'aaaaaaaa-0000-4000-8000-000000000001';
const B = 'aaaaaaaa-0000-4000-8000-000000000002';
const C = 'aaaaaaaa-0000-4000-8000-000000000003';
const ADMIN = 'aaaaaaaa-0000-4000-8000-000000000004';
const F = 'aaaaaaaa-0000-4000-8000-000000000006'; // fresh accounts for the rate limit tests
const G = 'aaaaaaaa-0000-4000-8000-000000000007';
const H = 'aaaaaaaa-0000-4000-8000-000000000008';
const CONV = 'bbbbbbbb-0000-4000-8000-000000000001';
const OTHER = 'bbbbbbbb-0000-4000-8000-000000000002';

let n = 0;
const req = (path: string, init: { method?: string; body?: unknown; headers?: Record<string, string>; raw?: BodyInit } = {}) => {
  const headers: Record<string, string> = { 'x-real-ip': `203.0.113.${++n % 250}`, ...(init.headers ?? {}) };
  let body: BodyInit | undefined = init.raw;
  if (init.body !== undefined) {
    body = JSON.stringify(init.body);
    headers['content-type'] = 'application/json';
  }
  return new NextRequest(new Request(`http://localhost:3000${path}`, { method: init.method ?? 'GET', headers, body }));
};
const asUser = (id: string | null) => (db.user = id);

beforeEach(() => {
  db.user = null;
  db.failWith = null;
  db.conversation_members = [
    { conversation_id: CONV, user_id: A, left_at: null, role: 'owner' },
    { conversation_id: CONV, user_id: B, left_at: null, role: 'member' },
    ...[F, G, H].map((u) => ({ conversation_id: CONV, user_id: u, left_at: null, role: 'member' })),
  ];
  db.messages = [{ id: 'cccccccc-0000-4000-8000-000000000001', conversation_id: CONV, sender_id: A, ciphertext: 'x', nonce: 'n', deleted_at: null }];
  db.conversations = [{ id: CONV, type: 'group' }];
});

describe('authentication is enforced on the server', () => {
  it('rejects every sensitive route without a session', async () => {
    asUser(null);
    expect((await getMessages(req(`/api/messages?conversationId=${CONV}`))).status).toBe(401);
    expect((await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x', nonce: 'n' } }))).status).toBe(401);
    expect((await patchMessage(req('/api/messages', { method: 'PATCH', body: { messageId: CONV, deleted: true } }))).status).toBe(401);
    expect((await patchAdmin(req('/api/admin/users', { method: 'PATCH', body: { userId: A, isAdmin: true } }))).status).toBe(401);
    expect((await postGroupMember(req('/api/groups/members', { method: 'POST', body: { groupId: CONV, userId: C } }))).status).toBe(401);
  });

  it('a forged or expired token (Supabase says no user) is a 401, never trusted', async () => {
    asUser(null);
    const r = await getMessages(req(`/api/messages?conversationId=${CONV}`, { headers: { authorization: 'Bearer forged.jwt.token', cookie: 'sb-access-token=forged' } }));
    expect(r.status).toBe(401);
  });
});

describe('authorization and IDOR', () => {
  it('outsider C cannot read A and B\'s messages', async () => {
    asUser(C);
    expect((await getMessages(req(`/api/messages?conversationId=${CONV}`))).status).toBe(403);
  });
  it('member B can', async () => {
    asUser(B);
    expect((await getMessages(req(`/api/messages?conversationId=${CONV}`))).status).toBe(200);
  });
  it('outsider C cannot post into the conversation', async () => {
    asUser(C);
    expect((await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x', nonce: 'n' } }))).status).toBe(403);
  });
  it('a member cannot reply to, or thread under, a message from another conversation', async () => {
    asUser(B);
    db.messages.push({ id: 'cccccccc-0000-4000-8000-000000000009', conversation_id: OTHER, sender_id: C, ciphertext: 'x', nonce: 'n' });
    const r = await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x', nonce: 'n', replyToMessageId: 'cccccccc-0000-4000-8000-000000000009' } }));
    expect(r.status).toBe(404);
  });
  it('a non-admin cannot use the admin route; an admin can, but not on themselves', async () => {
    asUser(B);
    expect((await patchAdmin(req('/api/admin/users', { method: 'PATCH', body: { userId: B, isAdmin: true } }))).status).toBe(403);
    asUser(ADMIN);
    expect((await patchAdmin(req('/api/admin/users', { method: 'PATCH', body: { userId: ADMIN, isAdmin: false } }))).status).toBe(400);
  });
  it('a plain member cannot add people to a group (role check)', async () => {
    asUser(B);
    const r = await postGroupMember(req('/api/groups/members', { method: 'POST', body: { groupId: CONV, userId: C } }));
    expect(r.status).toBe(403);
  });
});

describe('input validation and tampering', () => {
  it('rejects non-UUID and injection-shaped identifiers', async () => {
    asUser(A);
    for (const id of ['1', "x' OR '1'='1", '../../etc/passwd', `${CONV},or=(id.neq.0)`, 'null']) {
      expect((await getMessages(req(`/api/messages?conversationId=${encodeURIComponent(id)}`))).status, id).toBe(400);
    }
    expect((await patchMessage(req('/api/messages', { method: 'PATCH', body: { messageId: "1' or '1'='1", deleted: true } }))).status).toBe(400);
  });
  it('rejects a bad pagination cursor', async () => {
    asUser(A);
    expect((await getMessages(req(`/api/messages?conversationId=${CONV}&before=2020-01-01'%20or%20true`))).status).toBe(400);
  });
  it('rejects malformed, non-object and oversized bodies', async () => {
    asUser(A);
    expect((await postMessage(req('/api/messages', { method: 'POST', raw: '{not json', headers: { 'content-type': 'application/json' } }))).status).toBe(400);
    expect((await postMessage(req('/api/messages', { method: 'POST', raw: '[1,2]', headers: { 'content-type': 'application/json' } }))).status).toBe(400);
    const huge = await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x'.repeat(300_000), nonce: 'n' } }));
    expect(huge.status).toBe(400);
  });
  it('rejects wrong types instead of passing them to the database', async () => {
    asUser(A);
    for (const body of [{ conversationId: CONV, ciphertext: { $ne: 1 }, nonce: 'n' }, { conversationId: CONV, ciphertext: 'x', nonce: 'n', encryptionVersion: 99 }, { conversationId: [CONV], ciphertext: 'x', nonce: 'n' }]) {
      expect((await postMessage(req('/api/messages', { method: 'POST', body }))).status).toBe(400);
    }
  });
  it('mass assignment: the sender and other columns come from the server, never the body', async () => {
    asUser(A);
    const r = await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x', nonce: 'n', sender_id: B, id: 'evil', created_at: '2001-01-01T00:00:00Z' } }));
    expect(r.status).toBe(201);
    const body = await r.json();
    expect(body.sender_id).toBe(A);
    expect(body.id).not.toBe('evil');
  });
  it('an edit cannot change anything but the content, and a delete needs a real boolean', async () => {
    asUser(A);
    const r = await patchMessage(req('/api/messages', { method: 'PATCH', body: { messageId: 'cccccccc-0000-4000-8000-000000000001', ciphertext: 'new', nonce: 'n2', conversation_id: OTHER, sender_id: B } }));
    expect(r.status).toBe(200);
    expect(db.messages[0].conversation_id).toBe(CONV);
    expect(db.messages[0].sender_id).toBe(A);
    expect((await patchMessage(req('/api/messages', { method: 'PATCH', body: { messageId: 'cccccccc-0000-4000-8000-000000000001', deleted: 'yes' } }))).status).toBe(400);
  });
});

describe('information leakage', () => {
  it('database errors are logged, not returned to the client', async () => {
    asUser(A);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    db.failWith = 'duplicate key value violates unique constraint "secret_table_pkey"';
    const r = await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x', nonce: 'n' } }));
    const text = JSON.stringify(await r.json());
    expect(r.status).toBe(500);
    expect(text).not.toContain('secret_table_pkey');
    expect(text).not.toContain('constraint');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('rate limiting and abuse', () => {
  it('limits message sending per account, and a spoofed X-Forwarded-For does not reset it', async () => {
    asUser(F);
    const statuses: number[] = [];
    for (let i = 0; i < 70; i++) {
      statuses.push((await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x', nonce: 'n' }, headers: { 'x-real-ip': `198.51.100.${i}`, 'x-forwarded-for': `1.2.3.${i}` } }))).status);
    }
    expect(statuses.filter((s) => s === 201).length).toBe(60);
    expect(statuses.slice(60).every((s) => s === 429)).toBe(true);
  });
});

describe('CSRF', () => {
  it('a state-changing request from another site is refused', async () => {
    asUser(H);
    const r = await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x', nonce: 'n' }, headers: { origin: 'https://evil.example', host: 'localhost:3000' } }));
    expect(r.status).toBe(403);
    const same = await postMessage(req('/api/messages', { method: 'POST', body: { conversationId: CONV, ciphertext: 'x', nonce: 'n' }, headers: { origin: 'http://localhost:3000', host: 'localhost:3000' } }));
    expect(same.status).toBe(201);
  });
});

describe('helpers', () => {
  it('clientIp never trusts a client-supplied first X-Forwarded-For entry', () => {
    const h = (o: Record<string, string>) => ({ headers: new Headers(o) }) as never;
    expect(clientIp(h({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('10.0.0.1');
    expect(clientIp(h({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' }))).toBe('1.1.1.1');
    expect(clientIp(h({ 'x-forwarded-for': '1.1.1.1/../../admin' }))).toBe('unknown');
    expect(clientIp(h({}))).toBe('unknown');
  });
  it('isUuid accepts UUIDs and refuses injection-shaped values', () => {
    expect(isUuid(CONV)).toBe(true);
    expect(isUuid("' or 1=1")).toBe(false);
  });
});

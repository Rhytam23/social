import { describe, it, expect } from 'vitest';
import { POST as postConversations } from '../../app/api/conversations/route';
import { GET as getMessages, POST as postMessages } from '../../app/api/messages/route';
import { POST as postGroups } from '../../app/api/groups/route';
import { POST as postUploadSign } from '../../app/api/uploads/sign/route';
import { POST as postUploadComplete } from '../../app/api/uploads/complete/route';
import { GET as getUsers } from '../../app/api/users/route';
import { NextRequest } from 'next/server';

function createMockRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}): NextRequest {
  const headers: Record<string, string> = {
    'x-forwarded-for': '127.0.0.1',
    ...(options.headers || {}),
  };
  let body: string | undefined;
  if (options.body) {
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    headers['content-type'] = 'application/json';
  }
  const req = new Request(url, {
    method: options.method || 'GET',
    headers,
    body,
  });
  return new NextRequest(req);
}

describe('API Routes Security & Verification Suite', () => {
  describe('3. Conversations API (/api/conversations)', () => {
    it('should reject unauthenticated conversation creation with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: { type: 'direct', participantIds: ['usr-123'] },
      });
      const res = await postConversations(req);
      expect(res.status).toBe(401);
    });
  });

  describe('4. Messages API (/api/messages)', () => {
    it('should reject unauthenticated message fetch with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/messages?conversationId=conv-123');
      const res = await getMessages(req);
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated message send with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        body: { conversationId: 'conv-123', ciphertext: 'b64==', nonce: 'b64==' },
      });
      const res = await postMessages(req);
      expect(res.status).toBe(401);
    });
  });

  describe('5. Groups API (/api/groups)', () => {
    it('should reject unauthenticated group creation with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: { name: 'Test Group', memberIds: ['usr-1'] },
      });
      const res = await postGroups(req);
      expect(res.status).toBe(401);
    });
  });

  describe('6. Uploads API (/api/uploads/sign and /complete)', () => {
    it('should reject unauthenticated upload requests with 401', async () => {
      const sign = createMockRequest('http://localhost:3000/api/uploads/sign', { method: 'POST', body: { conversationId: 'c', kind: 'image', size: 1 } });
      expect((await postUploadSign(sign)).status).toBe(401);
      const complete = createMockRequest('http://localhost:3000/api/uploads/complete', { method: 'POST', body: { path: 'x', kind: 'image' } });
      expect((await postUploadComplete(complete)).status).toBe(401);
    });
  });

  describe('7. Users Discovery API (/api/users)', () => {
    it('should reject unauthenticated user discovery search with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/users?q=alice');
      const res = await getUsers(req);
      expect(res.status).toBe(401);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateSecureToken, hashToken, safeCompareHashes } from '../../lib/utils/crypto';

const root = process.cwd();
const consumeInviteSql = readFileSync(
  join(root, 'database/functions/atomic_invite_consumption.sql'),
  'utf-8'
);

describe('Invite Security — cryptographic token unit tests', () => {
  it('generates a 64-character hex cryptographically secure token', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('computes a SHA-256 hash without exposing the raw token', () => {
    const rawToken = generateSecureToken();
    const hash = hashToken(rawToken);

    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(rawToken);
    expect(hashToken(rawToken)).toBe(hash);
  });

  it('evaluates constant-time hash comparisons correctly', () => {
    const hash1 = hashToken('token123');
    const hash2 = hashToken('token123');
    const hash3 = hashToken('different');

    expect(safeCompareHashes(hash1, hash2)).toBe(true);
    expect(safeCompareHashes(hash1, hash3)).toBe(false);
  });
});

describe('Invite Security — consume_invite hardening (static SQL verification)', () => {
  it('never returns raw database errors (SQLERRM as a value)', () => {
    // The dangerous pattern is returning SQLERRM as a message value.
    expect(consumeInviteSql).not.toMatch(/message', SQLERRM/);
    // The EXCEPTION handler returns a generic, non-sensitive message.
    expect(consumeInviteSql).toMatch(/Invite consumption failed/);
  });

  it('is restricted to the service_role (no authenticated EXECUTE)', () => {
    expect(consumeInviteSql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.consume_invite\(TEXT, UUID, TEXT\) TO service_role/
    );
    expect(consumeInviteSql).not.toMatch(/TO authenticated, service_role/);
  });

  it('uses FOR UPDATE row locking for atomic single-use consumption', () => {
    expect(consumeInviteSql).toMatch(/FOR UPDATE/);
  });

  it('enforces intended-user (email) and status/expiry validation', () => {
    expect(consumeInviteSql).toMatch(/assigned email does not match/);
    expect(consumeInviteSql).toMatch(/already been used/);
    expect(consumeInviteSql).toMatch(/has been revoked/);
    expect(consumeInviteSql).toMatch(/has expired/);
  });

  it('sets an explicit search_path to avoid search_path hijacking', () => {
    expect(consumeInviteSql).toMatch(/SET search_path = public/);
  });
});

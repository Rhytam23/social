import { describe, it, expect } from 'vitest';
import { canAddMembers, canChangeRole, canRemoveMember, pickSuccessor } from '../../lib/groups/roles';

describe('group permissions', () => {
  it('only managers add members', () => {
    expect(canAddMembers('owner')).toBe(true);
    expect(canAddMembers('admin')).toBe(true);
    expect(canAddMembers('member')).toBe(false);
    expect(canAddMembers(undefined)).toBe(false);
  });

  it('admins remove members but not admins or the owner', () => {
    expect(canRemoveMember('admin', 'member', false)).toBe(true);
    expect(canRemoveMember('admin', 'admin', false)).toBe(false);
    expect(canRemoveMember('admin', 'owner', false)).toBe(false);
    expect(canRemoveMember('owner', 'admin', false)).toBe(true);
    expect(canRemoveMember('member', 'member', false)).toBe(false);
  });

  it('anyone can leave', () => {
    expect(canRemoveMember('member', 'member', true)).toBe(true);
  });

  it('only the owner changes roles, and not their own', () => {
    expect(canChangeRole('owner', 'member', 'admin', false)).toBe(true);
    expect(canChangeRole('admin', 'member', 'admin', false)).toBe(false);
    expect(canChangeRole('owner', 'owner', 'admin', true)).toBe(false);
    expect(canChangeRole('owner', 'admin', 'admin', false)).toBe(false);
  });
});

describe('pickSuccessor', () => {
  const members = [
    { userId: 'o', role: 'owner' as const, joinedAt: '2026-01-01' },
    { userId: 'm1', role: 'member' as const, joinedAt: '2026-01-02' },
    { userId: 'a1', role: 'admin' as const, joinedAt: '2026-01-05' },
    { userId: 'a2', role: 'admin' as const, joinedAt: '2026-01-03' },
  ];

  it('prefers the longest-serving admin', () => {
    expect(pickSuccessor(members, 'o')).toBe('a2');
  });

  it('falls back to the longest-serving member', () => {
    expect(pickSuccessor([members[0], members[1]], 'o')).toBe('m1');
  });

  it('returns null when nobody is left', () => {
    expect(pickSuccessor([members[0]], 'o')).toBeNull();
  });
});

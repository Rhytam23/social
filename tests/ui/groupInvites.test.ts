import { describe, it, expect } from 'vitest';
import { describeAddResult, describeGroupCreated, invitesFromRows } from '../../lib/groups/invites';

describe('group invitations', () => {
  it('turns database rows into invitations and drops anything malformed', () => {
    const items = invitesFromRows([
      { id: 'i1', conversation_id: 'c1', group_name: 'team', inviter_name: 'Olive', inviter_username: 'olive', created_at: '2026-09-20T00:00:00Z' },
      { id: 'i2', conversation_id: 'c2', group_name: null, inviter_name: null, inviter_username: 'sam', created_at: '2026-09-20T00:00:00Z' },
      { nonsense: true },
      null,
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: 'i1', groupName: 'team', inviterName: 'Olive', inviterUsername: 'olive' });
    expect(items[1]).toMatchObject({ groupName: 'a group', inviterName: 'sam' });
    expect(invitesFromRows(undefined)).toEqual([]);
    expect(invitesFromRows('x')).toEqual([]);
  });

  it('describes what happened when people are added, without promising more than is known', () => {
    expect(describeAddResult('added', 'Kim')).toBe('Kim was added.');
    expect(describeAddResult('already', 'Kim')).toContain('already');
    expect(describeAddResult('invited', 'Sam')).toContain('if they accept');
  });

  it('describes a new group only when something needs saying', () => {
    expect(describeGroupCreated(0, 0)).toBeNull();
    expect(describeGroupCreated(1, 0)).toContain('1 person was sent an invitation');
    expect(describeGroupCreated(3, 2)).toContain('3 people were sent an invitation');
    expect(describeGroupCreated(3, 2)).toContain('2 could not be added');
  });
});

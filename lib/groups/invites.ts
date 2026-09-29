/**
 * Group invitations (migration 027). A person the adder knows is added at once; everyone else receives an
 * invitation and joins only if they accept. This file is the shape the app uses and the wording it shows.
 */

export interface GroupInviteItem {
  id: string;
  conversationId: string;
  groupName: string;
  inviterName: string;
  inviterUsername: string;
  createdAt: string;
}

interface InviteRow {
  id: string;
  conversation_id: string;
  group_name: string | null;
  inviter_name: string | null;
  inviter_username: string | null;
  created_at: string;
}

/** Turns the rows my_group_invites() returns into what the interface shows. Anything malformed is dropped. */
export function invitesFromRows(rows: unknown): GroupInviteItem[] {
  if (!Array.isArray(rows)) return [];
  return (rows as InviteRow[])
    .filter((r) => r && typeof r.id === 'string' && typeof r.conversation_id === 'string')
    .map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      groupName: r.group_name || 'a group',
      inviterName: r.inviter_name || r.inviter_username || 'Someone',
      inviterUsername: r.inviter_username || '',
      createdAt: r.created_at,
    }));
}

/** What the adder is told after adding people. `invited` is worded so it does not prove an invitation exists. */
export function describeAddResult(result: 'added' | 'invited' | 'already', name: string): string {
  if (result === 'added') return `${name} was added.`;
  if (result === 'already') return `${name} is already in this group.`;
  return `${name} was sent an invitation. They join if they accept.`;
}

export function describeGroupCreated(invited: number, failed: number): string | null {
  const parts: string[] = [];
  if (invited > 0) parts.push(`${invited} ${invited === 1 ? 'person was' : 'people were'} sent an invitation and will join if they accept`);
  if (failed > 0) parts.push(`${failed} could not be added`);
  return parts.length ? `${parts.join('; ')}.` : null;
}

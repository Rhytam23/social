export type GroupRole = 'owner' | 'admin' | 'member';

const RANK: Record<GroupRole, number> = { owner: 3, admin: 2, member: 1 };

export function isGroupRole(value: unknown): value is GroupRole {
  return value === 'owner' || value === 'admin' || value === 'member';
}

/** Admins and owners manage the group. */
export function isGroupManager(role: GroupRole | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function canAddMembers(role: GroupRole | undefined): boolean {
  return isGroupManager(role);
}

/** You may remove someone who ranks strictly below you; anyone may remove themselves (leave). */
export function canRemoveMember(actor: GroupRole | undefined, target: GroupRole | undefined, isSelf: boolean): boolean {
  if (isSelf) return true;
  if (!actor || !target || !isGroupManager(actor)) return false;
  return RANK[actor] > RANK[target];
}

/** Only the owner changes roles (promote to admin, demote to member, transfer ownership). */
export function canChangeRole(actor: GroupRole | undefined, target: GroupRole | undefined, nextRole: GroupRole, isSelf: boolean): boolean {
  if (actor !== 'owner' || !target) return false;
  if (isSelf) return false; // ownership moves by promoting someone else to owner
  return target !== nextRole;
}

export function canEditGroup(role: GroupRole | undefined): boolean {
  return isGroupManager(role);
}

/** Who should inherit ownership when the owner leaves: the longest-serving admin, else the longest-serving member. */
export function pickSuccessor(members: Array<{ userId: string; role: GroupRole; joinedAt: string }>, leavingUserId: string): string | null {
  const rest = members.filter((m) => m.userId !== leavingUserId);
  if (rest.length === 0) return null;
  const byJoined = (a: { joinedAt: string }, b: { joinedAt: string }) => a.joinedAt.localeCompare(b.joinedAt);
  const admins = rest.filter((m) => m.role === 'admin').sort(byJoined);
  return (admins[0] ?? rest.sort(byJoined)[0]).userId;
}

export const ROLE_LABEL: Record<GroupRole, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

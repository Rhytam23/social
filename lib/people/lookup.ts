import type { UserItem } from '../../types/ui';
import { parseUsernameQuery } from './username';

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  pronouns?: string | null;
  timezone?: string | null;
  created_at?: string;
}

export type LookupOutcome =
  | { status: 'found'; matches: Array<{ user: UserItem; blocked: boolean }> }
  | { status: 'none' }
  | { status: 'invalid'; message: string }
  | { status: 'error'; message: string };

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h | 0;
}

/** Turns a public profile row (never email or phone) into the shape the UI uses. */
export function profileRowToUser(p: ProfileRow): UserItem {
  return {
    id: p.id,
    name: p.display_name || p.username,
    username: p.username,
    avatarUrl: p.avatar_url ?? undefined,
    bio: p.bio ?? undefined,
    pronouns: p.pronouns ?? undefined,
    timezone: p.timezone ?? undefined,
    registrationId: (Math.abs(hashCode(p.id)) % 90000) + 10000,
    role: 'member',
    deviceCount: 1,
    joinedAt: '',
    identityFingerprint: '',
    presence: 'offline',
  };
}

/** Finds people whose username starts with the text (at least 3 characters). */
export async function lookupUsernameRemote(raw: string, fetchImpl: typeof fetch = fetch): Promise<LookupOutcome> {
  const parsed = parseUsernameQuery(raw);
  if (!parsed.ok) return { status: 'invalid', message: parsed.error };

  try {
    const res = await fetchImpl(`/api/users?username=${encodeURIComponent(parsed.value)}`);
    if (res.status === 429) return { status: 'error', message: 'Too many searches. Wait a minute and try again.' };
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return { status: 'invalid', message: body.error ?? 'That is not a valid username.' };
    }
    if (!res.ok) return { status: 'error', message: 'Search failed. Check your connection and try again.' };
    const body = (await res.json()) as { users?: Array<ProfileRow & { blocked?: boolean }> };
    const users = body.users ?? [];
    if (users.length === 0) return { status: 'none' };
    return { status: 'found', matches: users.map((u) => ({ user: profileRowToUser(u), blocked: !!u.blocked })) };
  } catch {
    return { status: 'error', message: 'Search failed. Check your connection and try again.' };
  }
}

/**
 * Names that look official belong to platform admins only, so nobody can pose as one. The database enforces
 * this (migration 025, guard_profile_names); this is the same rule in the browser, to give a clear message
 * before anything is sent. Keep the two in step.
 */
const OFFICIAL = /(admin|moderator|staff|official|verified|nook[ _.-]*(team|support|staff|hq))/i;
const OFFICIAL_MARKS = /[✓✔✅☑🛡]/;
const RESERVED_HANDLES = ['admin', 'administrator', 'root', 'support', 'staff', 'nook', 'moderator', 'official', 'system'];

export function looksOfficial(text: string | null | undefined): boolean {
  const value = text ?? '';
  return OFFICIAL.test(value) || OFFICIAL_MARKS.test(value);
}

/** A message for a display name or username that is reserved, or null when it is fine. */
export function reservedNameMessage(displayName: string, username?: string): string | null {
  if (looksOfficial(displayName) || looksOfficial(username)) return 'That name is reserved for the people who run the service. Please choose another.';
  if (username && RESERVED_HANDLES.includes(username.trim().toLowerCase())) return 'That username is reserved. Please choose another.';
  return null;
}

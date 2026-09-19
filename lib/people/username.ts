/**
 * Username is the only way to find a person you have not talked to yet.
 * This is the one place that decides what a valid search looks like, so the
 * search box and the API route can never disagree.
 */

const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

export type UsernameQuery = { ok: true; value: string } | { ok: false; error: string };

/** Trims, drops one leading "@", lowercases, and rejects anything that is not a username. */
export function parseUsernameQuery(raw: string | null | undefined): UsernameQuery {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '' || trimmed === '@') return { ok: false, error: 'Enter a username to search.' };

  const value = (trimmed.startsWith('@') ? trimmed.slice(1) : trimmed).toLowerCase();
  if (value.includes('@') || value.includes('+') || /\s/.test(value)) {
    return { ok: false, error: 'Search by username only. Names, email addresses and phone numbers cannot be used.' };
  }
  if (!USERNAME_PATTERN.test(value)) {
    return { ok: false, error: 'A username is 3 to 30 letters, numbers, dots or underscores.' };
  }
  return { ok: true, value };
}

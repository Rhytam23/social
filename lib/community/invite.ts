/** Pulls the invite code out of a pasted link (`?join=CODE`) or a bare code, upper-cased. */
export function parseInviteCode(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    return (url.searchParams.get('join') ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  } catch {
    return trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
}

/** Pulls the group invite code out of a pasted link (`?g=CODE`) or a bare code, upper-cased. */
export function parseGroupLinkCode(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    return (url.searchParams.get('g') ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  } catch {
    return trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
}

/** The link people share to bring others into a group. */
export function groupLinkUrl(origin: string, code: string): string {
  return `${origin}/?g=${code}`;
}

/** A group link kept across the sign-in redirect (also across a new tab, for the confirmation email) for one day. */
const PENDING_GROUP_LINK_KEY = 'pc_pending_group_link';
const PENDING_GROUP_LINK_MS = 24 * 60 * 60 * 1000;

export function rememberGroupLink(code: string, now: number = Date.now()): void {
  try {
    localStorage.setItem(PENDING_GROUP_LINK_KEY, JSON.stringify({ code, at: now }));
  } catch {
    // storage blocked: the link has to be opened again after signing in
  }
}

/** Returns the remembered code once (and forgets it), or null when there is none or it is too old. */
export function takeRememberedGroupLink(now: number = Date.now()): string | null {
  try {
    const raw = localStorage.getItem(PENDING_GROUP_LINK_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_GROUP_LINK_KEY);
    const parsed = JSON.parse(raw) as { code?: unknown; at?: unknown };
    if (typeof parsed.code !== 'string' || typeof parsed.at !== 'number') return null;
    if (now - parsed.at > PENDING_GROUP_LINK_MS) return null;
    const code = parseGroupLinkCode(parsed.code);
    return code.length >= 6 ? code : null;
  } catch {
    return null;
  }
}

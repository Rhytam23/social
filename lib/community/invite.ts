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

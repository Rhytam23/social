/**
 * Privacy rules for Vercel Web Analytics (page-view counts only).
 *
 * Pages can carry private values in the address: an invite link is `/?join=CODE`, and sign-in
 * screens can carry `?redirect=`. Nothing after the path may ever leave the browser, so the
 * analytics script is given only the origin and path.
 */
export function stripUrlDetails(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

/** Applies stripUrlDetails to any analytics event that carries a url; other events pass through unchanged. */
export function scrubAnalyticsEvent<T extends object>(event: T): T {
  const url = (event as { url?: unknown }).url;
  return typeof url === 'string' ? { ...event, url: stripUrlDetails(url) } : event;
}

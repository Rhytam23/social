/**
 * The public address of this deployment and the product's one-line description.
 * Everything that must be an absolute URL (canonical links, sitemap, Open Graph, structured data) reads it here.
 *
 * Set NEXT_PUBLIC_SITE_URL to the production domain (for example https://chat.example.com). On Vercel the
 * project's production domain is used when it is not set. Without either, production builds have no
 * absolute URL and the sitemap and canonical links are simply left out rather than pointing at a wrong host.
 */
export const SITE_NAME = 'Private Chat';
export const SITE_TAGLINE = 'End-to-end encrypted messaging';
export const SITE_DESCRIPTION =
  'Private Chat is an end-to-end encrypted messenger for direct messages, groups and communities. Messages are encrypted on your device, so the server only stores ciphertext.';

/** Normalises a host or URL to an origin without a trailing slash, or null when it is not usable. */
function toOrigin(value: string | undefined | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string | null {
  const configured = toOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? null : 'http://localhost:3000';
}

/** Absolute URL for a site path, or null when the site address is unknown. */
export function absoluteUrl(path = '/'): string | null {
  const origin = getSiteUrl();
  return origin ? `${origin}${path.startsWith('/') ? path : `/${path}`}` : null;
}

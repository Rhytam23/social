/**
 * Optional bot check (Cloudflare Turnstile) on sign-up, sign-in and password reset. Sign-in traffic goes
 * straight from the browser to Supabase Auth, so this app cannot rate-limit it on its own: the check is
 * what keeps automated floods out. It is off until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, and it only
 * works once CAPTCHA protection is also enabled in Supabase (Authentication, Attack Protection) with the
 * matching secret, otherwise Supabase ignores the token. See docs/SETUP.md.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export function captchaEnabled(siteKey: string = TURNSTILE_SITE_KEY): boolean {
  return /^[0-9A-Za-z_-]{6,64}$/.test(siteKey);
}

export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

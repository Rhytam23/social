import { describe, it, expect, afterEach, vi } from 'vitest';
import { absoluteUrl, getSiteUrl } from '../../lib/site';

afterEach(() => vi.unstubAllEnvs());

describe('site address', () => {
  it('uses NEXT_PUBLIC_SITE_URL and strips paths and trailing slashes', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://chat.example.com/some/path/');
    expect(getSiteUrl()).toBe('https://chat.example.com');
    expect(absoluteUrl('/privacy')).toBe('https://chat.example.com/privacy');
  });

  it('accepts a bare host, as Vercel provides it', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'chat.example.com');
    expect(getSiteUrl()).toBe('https://chat.example.com');
  });

  it('prefers the explicit setting over the Vercel one', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://mine.example.com');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'other.example.com');
    expect(getSiteUrl()).toBe('https://mine.example.com');
  });

  it('is unknown in production when nothing is configured, so no wrong host is published', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSiteUrl()).toBeNull();
    expect(absoluteUrl('/')).toBeNull();
  });

  it('falls back to localhost only outside production', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('NODE_ENV', 'development');
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });

  it('ignores a value that is not a URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'not a url ::');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSiteUrl()).toBeNull();
  });
});

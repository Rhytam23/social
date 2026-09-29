import { describe, it, expect } from 'vitest';
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from '../../lib/ui/themeScript';

/** Runs the pre-paint script against a fake page and reports the data-theme it sets. */
function themeFor(stored: string | null, storageThrows = false): string | null {
  let applied: string | null = null;
  const localStorage = {
    getItem: (k: string) => {
      if (storageThrows) throw new Error('blocked');
      return k === THEME_STORAGE_KEY ? stored : null;
    },
  };
  const document = { documentElement: { setAttribute: (_: string, v: string) => (applied = v) } };
  new Function('localStorage', 'document', THEME_INIT_SCRIPT)(localStorage, document);
  return applied;
}

describe('default theme follows the device', () => {
  it('uses "system" when nothing is saved', () => {
    expect(themeFor(null)).toBe('system');
  });

  it('uses "system" when the saved value is unknown', () => {
    expect(themeFor('neon')).toBe('system');
  });

  it('uses "system" when storage is blocked', () => {
    expect(themeFor(null, true)).toBe('system');
  });

  it('still respects an explicit choice made in Settings', () => {
    expect(themeFor('dark')).toBe('dark');
    expect(themeFor('light')).toBe('light');
    expect(themeFor('system')).toBe('system');
  });
});

describe('sign-in hint for the landing page', () => {
  function hintFor(cookie: string): string | null {
    let session: string | null = null;
    const localStorage = { getItem: () => null };
    const document = {
      cookie,
      documentElement: { setAttribute: (name: string, v: string) => { if (name === 'data-session') session = v; } },
    };
    new Function('localStorage', 'document', THEME_INIT_SCRIPT)(localStorage, document);
    return session;
  }

  it('is set when a Supabase auth cookie is present, including chunked ones', () => {
    expect(hintFor('a=1; sb-abcdefgh-auth-token=x')).toBe('1');
    expect(hintFor('sb-abcdefgh-auth-token.0=x')).toBe('1');
  });

  it('is not set without one, or for a look-alike cookie', () => {
    expect(hintFor('')).toBeNull();
    expect(hintFor('theme=dark; other-sb-auth=1')).toBeNull();
    expect(hintFor('xsb-abc-auth-token=1')).toBeNull();
  });

  it('is not set by the temporary cookies of a sign-in that has only started', () => {
    expect(hintFor('sb-abcdefgh-auth-token-code-verifier=base64-x')).toBeNull();
    expect(hintFor('sb-127-auth-token-flow-f6304091-code-verifier=x; sb-127-auth-token-flows-code-verifier=y')).toBeNull();
    expect(hintFor('sb-abcdefgh-auth-token-code-verifier=x; sb-abcdefgh-auth-token.1=y')).toBe('1');
  });
});

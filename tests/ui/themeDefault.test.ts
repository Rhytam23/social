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

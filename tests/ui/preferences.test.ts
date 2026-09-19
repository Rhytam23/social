import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFERENCES, inQuietHours, mergePreferences } from '../../lib/prefs/preferences';
import { validateUsername } from '../../lib/profile/profileClient';

describe('mergePreferences', () => {
  it('returns defaults for missing or invalid saved data', () => {
    expect(mergePreferences(DEFAULT_PREFERENCES, null)).toEqual(DEFAULT_PREFERENCES);
    expect(mergePreferences(DEFAULT_PREFERENCES, 'nope')).toEqual(DEFAULT_PREFERENCES);
  });

  it('keeps defaults for settings added after the data was saved', () => {
    const merged = mergePreferences(DEFAULT_PREFERENCES, { notifications: { level: 'mentions' } });
    expect(merged.notifications.level).toBe('mentions');
    expect(merged.notifications.sound).toBe(true);
    expect(merged.privacy.readReceipts).toBe(true);
  });

  it('ignores values of the wrong type', () => {
    const merged = mergePreferences(DEFAULT_PREFERENCES, { privacy: { readReceipts: 'yes' } });
    expect(merged.privacy.readReceipts).toBe(true);
  });
});

describe('inQuietHours', () => {
  const at = (h: number, m = 0) => new Date(2026, 0, 1, h, m);

  it('is off when disabled', () => {
    expect(inQuietHours({ enabled: false, start: '22:00', end: '07:00' }, at(23))).toBe(false);
  });

  it('handles a range that crosses midnight', () => {
    const q = { enabled: true, start: '22:00', end: '07:00' };
    expect(inQuietHours(q, at(23))).toBe(true);
    expect(inQuietHours(q, at(3))).toBe(true);
    expect(inQuietHours(q, at(12))).toBe(false);
    expect(inQuietHours(q, at(7))).toBe(false);
  });

  it('handles a same-day range', () => {
    const q = { enabled: true, start: '09:00', end: '17:00' };
    expect(inQuietHours(q, at(10))).toBe(true);
    expect(inQuietHours(q, at(18))).toBe(false);
  });
});

describe('validateUsername', () => {
  it('accepts normal handles', () => {
    expect(validateUsername('alex_m.2')).toBeNull();
  });

  it('rejects short, long and unsafe handles', () => {
    expect(validateUsername('ab')).not.toBeNull();
    expect(validateUsername('a'.repeat(31))).not.toBeNull();
    expect(validateUsername('bad name')).not.toBeNull();
    expect(validateUsername('<script>')).not.toBeNull();
  });
});

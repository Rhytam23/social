import { describe, it, expect } from 'vitest';
import { looksOfficial, reservedNameMessage } from '../../lib/profile/names';

describe('official-looking names (browser side of migration 025)', () => {
  it('flags names that pose as the people who run the service', () => {
    for (const name of ['Nook Admin', 'Support Staff', 'Official', 'Alice ✓', 'Moderator Mia', 'nook_team', 'Bob 🛡️', 'Verified']) {
      expect(looksOfficial(name), name).toBe(true);
    }
  });

  it('leaves ordinary names alone', () => {
    for (const name of ['Olive Green', 'Nora', 'Mad Max', 'Sam K', '']) {
      expect(looksOfficial(name), name).toBe(false);
    }
    expect(looksOfficial(null)).toBe(false);
    expect(looksOfficial(undefined)).toBe(false);
  });

  it('gives a clear message for a reserved name or username, and null otherwise', () => {
    expect(reservedNameMessage('Nook Admin')).toMatch(/reserved/);
    expect(reservedNameMessage('Olive', 'support')).toMatch(/username is reserved/);
    expect(reservedNameMessage('Olive', 'ROOT')).toMatch(/username is reserved/);
    expect(reservedNameMessage('Olive', 'olive_g')).toBeNull();
    expect(reservedNameMessage('Olive')).toBeNull();
  });
});

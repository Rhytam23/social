import { describe, it, expect, beforeEach } from 'vitest';
import { groupLinkUrl, parseGroupLinkCode, rememberGroupLink, takeRememberedGroupLink } from '../../lib/community/invite';

// A tiny in-memory localStorage (the tests run in Node).
function installStorage() {
  const data = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe('group invite links', () => {
  beforeEach(installStorage);

  it('reads the code from a pasted link or a bare code', () => {
    expect(parseGroupLinkCode('https://nook.example/?g=ab12-cd34ef')).toBe('AB12CD34EF');
    expect(parseGroupLinkCode('  ab12cd34ef ')).toBe('AB12CD34EF');
    expect(parseGroupLinkCode('https://nook.example/?join=ZZZ')).toBe('');
  });

  it('builds the shareable link', () => {
    expect(groupLinkUrl('https://nook.example', 'ABCDEF0123456789ABCD')).toBe('https://nook.example/?g=ABCDEF0123456789ABCD');
  });

  it('remembers a link across sign-in and hands it over exactly once', () => {
    rememberGroupLink('ABCDEF0123456789ABCD', 1_000);
    expect(takeRememberedGroupLink(2_000)).toBe('ABCDEF0123456789ABCD');
    expect(takeRememberedGroupLink(2_000)).toBeNull();
  });

  it('forgets a link that is more than a day old, and junk', () => {
    rememberGroupLink('ABCDEF0123456789ABCD', 0);
    expect(takeRememberedGroupLink(25 * 60 * 60 * 1000)).toBeNull();
    localStorage.setItem('pc_pending_group_link', '{not json');
    expect(takeRememberedGroupLink()).toBeNull();
    localStorage.setItem('pc_pending_group_link', JSON.stringify({ code: 'x', at: Date.now() }));
    expect(takeRememberedGroupLink()).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { parseInviteCode } from '../../lib/community/invite';

describe('parseInviteCode', () => {
  it('reads the code from an invite link', () => {
    expect(parseInviteCode('https://chat.example.com/?join=ab12cd34ef56')).toBe('AB12CD34EF56');
  });

  it('accepts a bare code, ignoring spaces and dashes', () => {
    expect(parseInviteCode('  ab12-cd34 ef56 ')).toBe('AB12CD34EF56');
  });

  it('returns an empty string for a link without a code', () => {
    expect(parseInviteCode('https://chat.example.com/')).toBe('');
  });
});

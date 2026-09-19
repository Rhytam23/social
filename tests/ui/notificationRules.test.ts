import { describe, it, expect } from 'vitest';
import { extractMentionIds, matchesKeyword, mentionsUser, shouldNotify, type NotifyContext } from '../../lib/notifications/rules';

const base: NotifyContext = {
  globalLevel: 'all',
  conversationLevel: 'default',
  status: 'auto',
  quietHours: false,
  isDirect: false,
  isMention: false,
  isKeyword: false,
  now: 1_000_000,
};

describe('shouldNotify', () => {
  it('notifies for everything by default', () => {
    expect(shouldNotify(base)).toBe(true);
  });

  it('is silenced by do-not-disturb, meetings and quiet hours', () => {
    expect(shouldNotify({ ...base, status: 'dnd' })).toBe(false);
    expect(shouldNotify({ ...base, status: 'meeting' })).toBe(false);
    expect(shouldNotify({ ...base, quietHours: true })).toBe(false);
  });

  it('honours a timed mute and lets it expire', () => {
    expect(shouldNotify({ ...base, mutedUntil: base.now + 1000 })).toBe(false);
    expect(shouldNotify({ ...base, mutedUntil: base.now - 1 })).toBe(true);
  });

  it('mentions-only still alerts for DMs, mentions and keywords', () => {
    const c = { ...base, globalLevel: 'mentions' as const };
    expect(shouldNotify(c)).toBe(false);
    expect(shouldNotify({ ...c, isDirect: true })).toBe(true);
    expect(shouldNotify({ ...c, isMention: true })).toBe(true);
    expect(shouldNotify({ ...c, isKeyword: true })).toBe(true);
  });

  it('a conversation setting overrides the global one', () => {
    expect(shouldNotify({ ...base, globalLevel: 'none', conversationLevel: 'all' })).toBe(true);
    expect(shouldNotify({ ...base, globalLevel: 'all', conversationLevel: 'none' })).toBe(false);
  });
});

describe('mentions', () => {
  const me = { id: 'u1', name: 'Alex Morgan', username: 'alex_m' };

  it('matches @username and @first-name as whole words', () => {
    expect(mentionsUser('hey @alex_m look', me)).toBe(true);
    expect(mentionsUser('hey @Alex!', me)).toBe(true);
    expect(mentionsUser('email me at bob@alexander.com', me)).toBe(false);
    expect(mentionsUser('@alexander hi', me)).toBe(false);
  });

  it('matches by id list', () => {
    expect(mentionsUser('hello', me, ['u1'])).toBe(true);
    expect(mentionsUser('hello', me, ['u2'])).toBe(false);
  });

  it('extracts ids of everyone mentioned', () => {
    const people = [me, { id: 'u2', name: 'Sam Lee', username: 'sam' }];
    expect(extractMentionIds('cc @sam and @alex_m', people).sort()).toEqual(['u1', 'u2']);
  });

  it('keywords need at least two characters and ignore case', () => {
    expect(matchesKeyword('Deploy is Done', ['deploy'])).toBe(true);
    expect(matchesKeyword('a b c', ['a'])).toBe(false);
  });
});

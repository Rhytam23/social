import { describe, it, expect } from 'vitest';
import { parseUsernameQuery } from '../../lib/people/username';

describe('parseUsernameQuery', () => {
  it('lowercases and trims', () => {
    expect(parseUsernameQuery('  Alex_M  ')).toEqual({ ok: true, value: 'alex_m' });
  });

  it('drops one leading @', () => {
    expect(parseUsernameQuery('@alex.m')).toEqual({ ok: true, value: 'alex.m' });
  });

  it('rejects empty input and a lone @', () => {
    expect(parseUsernameQuery('')).toMatchObject({ ok: false });
    expect(parseUsernameQuery('   ')).toMatchObject({ ok: false });
    expect(parseUsernameQuery('@')).toMatchObject({ ok: false });
    expect(parseUsernameQuery(null)).toMatchObject({ ok: false });
  });

  it('rejects email addresses and phone numbers instead of searching them', () => {
    expect(parseUsernameQuery('alex@example.com')).toMatchObject({ ok: false });
    expect(parseUsernameQuery('+1 555 0199')).toMatchObject({ ok: false });
  });

  it('rejects display names with spaces and too-short or too-long values', () => {
    expect(parseUsernameQuery('Alex Morgan')).toMatchObject({ ok: false });
    expect(parseUsernameQuery('ab')).toMatchObject({ ok: false });
    expect(parseUsernameQuery('a'.repeat(31))).toMatchObject({ ok: false });
  });

  it('rejects SQL wildcards and other symbols', () => {
    expect(parseUsernameQuery('alex%')).toMatchObject({ ok: false });
    expect(parseUsernameQuery('a-b-c')).toMatchObject({ ok: false });
  });
});

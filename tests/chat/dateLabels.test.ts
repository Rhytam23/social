import { describe, it, expect } from 'vitest';
import { dayKey, dayLabel, listStamp, fullTimestamp } from '../../lib/ui/dateLabels';

// Built from local-time parts so the tests hold in any time zone.
const local = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min, 0).toISOString();
const NOW = new Date(2026, 2, 12, 15, 0, 0); // 12 March 2026, 15:00 local

describe('dateLabels', () => {
  it('shares a day key within one local day and changes at midnight', () => {
    expect(dayKey(local(2026, 3, 12, 0, 1))).toBe(dayKey(local(2026, 3, 12, 23, 59)));
    expect(dayKey(local(2026, 3, 12, 23, 59))).not.toBe(dayKey(local(2026, 3, 13, 0, 1)));
  });

  it('labels today and yesterday, whatever the time of day', () => {
    expect(dayLabel(local(2026, 3, 12, 0, 5), NOW)).toBe('Today');
    expect(dayLabel(local(2026, 3, 11, 23, 59), NOW)).toBe('Yesterday');
  });

  it('uses the weekday inside the last week and the full date after that', () => {
    const twoDays = dayLabel(local(2026, 3, 10), NOW);
    expect(twoDays).toBe(new Date(2026, 2, 10).toLocaleDateString([], { weekday: 'long' }));
    const old = dayLabel(local(2026, 3, 1), NOW);
    expect(old).toContain('2026');
    expect(old).toContain('1');
    expect(dayLabel(local(2025, 12, 31), NOW)).toContain('2025');
  });

  it('rolls over at 12 am: a message sent just after midnight is Today, the day before is Yesterday', () => {
    const afterMidnight = new Date(2026, 2, 13, 0, 30, 0);
    expect(dayLabel(local(2026, 3, 13, 0, 10), afterMidnight)).toBe('Today');
    expect(dayLabel(local(2026, 3, 12, 23, 50), afterMidnight)).toBe('Yesterday');
  });

  it('shows a clock time in the chat list for today and the day label for older chats', () => {
    expect(listStamp(local(2026, 3, 12, 9, 5), NOW)).toMatch(/\d/);
    expect(listStamp(local(2026, 3, 11, 9, 5), NOW)).toBe('Yesterday');
  });

  it('gives the full date and time, and empty text for bad input', () => {
    expect(fullTimestamp(local(2026, 3, 12, 10, 30))).toContain('2026');
    expect(dayKey('nope')).toBe('');
    expect(dayLabel('nope', NOW)).toBe('');
    expect(fullTimestamp('nope')).toBe('');
    expect(listStamp('nope', NOW)).toBe('');
  });
});

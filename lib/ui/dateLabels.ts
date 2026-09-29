/**
 * Date labels for chats, in the viewer's own time zone: "Today", "Yesterday", a weekday for the last week,
 * then the full date. Pure functions (the clock is passed in) so they are easy to test.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar day of a timestamp, e.g. "2026-03-12". Two messages share a day label when their keys match. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole calendar days from `iso` to `now` (0 = same local day), independent of the time of day. */
function daysAgo(iso: string, now: Date): number {
  const d = new Date(iso);
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** "Today", "Yesterday", a weekday ("Monday") within the last 6 days, otherwise "12 March 2026". */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const ago = daysAgo(iso, now);
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  if (ago > 1 && ago < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

/** The exact moment a message was sent, e.g. "Thursday, 12 March 2026, 10:30:15". */
export function fullTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date}, ${time}`;
}

/** The short time shown beside a message: "10:30 AM". */
export function clockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** For the chat list: the time today, "Yesterday", a weekday within the last week, else a short date. */
export function listStamp(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const ago = daysAgo(iso, now);
  if (ago <= 0) return clockTime(iso);
  if (ago === 1) return 'Yesterday';
  if (ago < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

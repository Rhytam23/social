/** Shapes and pure helpers for the admin error list (kept out of the component so they can be tested). */

export interface ErrorLogRow {
  id: string;
  level: 'error' | 'warn';
  source: 'server' | 'client';
  area: string;
  message: string;
  detail: string | null;
  user_id: string | null;
  path: string | null;
  user_agent: string | null;
  release: string | null;
  status: 'open' | 'resolved';
  occurrences: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
}

export type StatusFilter = 'open' | 'resolved' | 'all';
export type SourceFilter = 'all' | 'server' | 'client';

/** Filters and searches the loaded rows. Pure so it can be tested. */
export function filterErrorRows(rows: ErrorLogRow[], status: StatusFilter, source: SourceFilter, query: string): ErrorLogRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (status !== 'all' && r.status !== status) return false;
    if (source !== 'all' && r.source !== source) return false;
    if (q && !`${r.area} ${r.message} ${r.detail ?? ''} ${r.path ?? ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Plain-text summary an admin can paste into a message or a ticket. */
export function describeErrorRow(r: ErrorLogRow, who: string): string {
  return [
    `${r.source.toUpperCase()} ${r.level.toUpperCase()}  ${r.area}`,
    r.message,
    `Seen ${r.occurrences}x, first ${new Date(r.first_seen_at).toISOString()}, last ${new Date(r.last_seen_at).toISOString()}`,
    `Affected: ${who}`,
    r.path ? `Path: ${r.path}` : '',
    r.release ? `Release: ${r.release}` : '',
    r.user_agent ? `Browser: ${r.user_agent}` : '',
    r.detail ? `\n${r.detail}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}


'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { isSupabaseConfigured } from '../../lib/supabase/env';
import { technicalNote, userError } from '../../lib/ui/errors';
import { Button } from '../ui/button';
import { Badge } from '../ui/primitives';
import { describeErrorRow, filterErrorRows, type ErrorLogRow, type SourceFilter, type StatusFilter } from '../../lib/logging/errorRows';

const REFRESH_MS = 30_000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The admin error log: server and browser errors, deduplicated, with who was affected. Readable by
 * platform admins only (row level security enforces it). Everything shown here is plain text.
 */
export const AdminErrors: React.FC<{ nameOf: (userId: string) => string }> = ({ nameOf }) => {
  const [rows, setRows] = useState<ErrorLogRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('open');
  const [source, setSource] = useState<SourceFilter>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setRows([]);
      setNote('Error logs are collected when the app is connected to Supabase. There is nothing to show in demo mode.');
      return;
    }
    const { data, error } = await createClient()
      .from('error_logs' as never)
      .select('id, level, source, area, message, detail, user_id, path, user_agent, release, status, occurrences, first_seen_at, last_seen_at, resolved_by, resolved_at')
      .order('last_seen_at', { ascending: false })
      .limit(300);
    if (error) {
      setNote(technicalNote('Error logs need the latest database update (migration 019).', 'The error log is not available right now.'));
      setRows([]);
      return;
    }
    setNote(null);
    setRows((data as unknown as ErrorLogRow[]) || []);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const who = useCallback((id: string | null) => (id ? `${nameOf(id)} (${id.slice(0, 8)})` : 'unknown or signed out'), [nameOf]);

  const summary = useMemo(() => {
    const all = rows ?? [];
    const cutoff = Date.now() - DAY_MS;
    const recent = all.filter((r) => new Date(r.last_seen_at).getTime() >= cutoff);
    return {
      open: all.filter((r) => r.status === 'open').length,
      last24h: recent.reduce((n, r) => n + r.occurrences, 0),
      server: all.filter((r) => r.status === 'open' && r.source === 'server').length,
      client: all.filter((r) => r.status === 'open' && r.source === 'client').length,
    };
  }, [rows]);

  const shown = useMemo(() => filterErrorRows(rows ?? [], status, source, query), [rows, status, source, query]);

  const act = async (fn: () => PromiseLike<{ error: unknown }>, failure: string) => {
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) setNote(userError(error, failure));
      else setNote(null);
    } catch (err) {
      setNote(userError(err, failure));
    } finally {
      setBusy(false);
      void load();
    }
  };

  const setRowStatus = (id: string, next: 'open' | 'resolved') =>
    act(() => createClient().rpc('admin_set_error_status' as never, { p_id: id, p_status: next } as never), 'Could not update that entry.');

  const clearResolved = async () => {
    setConfirmClear(false);
    await act(() => createClient().rpc('admin_clear_errors' as never, { p_only_resolved: true } as never), 'Could not clear resolved entries.');
  };

  const copy = async (r: ErrorLogRow) => {
    try {
      await navigator.clipboard.writeText(describeErrorRow(r, who(r.user_id)));
      setCopied(r.id);
      setTimeout(() => setCopied((c) => (c === r.id ? null : c)), 2000);
    } catch {
      setNote('Copying is not allowed in this browser. Select the text and copy it by hand.');
    }
  };

  const tab = (label: string, active: boolean, onClick: () => void) => (
    <Button size="sm" variant={active ? 'primary' : 'tertiary'} onClick={onClick} aria-pressed={active}>
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Open errors', summary.open],
          ['Occurrences, last 24 h', summary.last24h],
          ['Open on the server', summary.server],
          ['Open in browsers', summary.client],
        ].map(([label, value]) => (
          <div key={label as string} className="panel !p-3">
            <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="panel flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5" role="group" aria-label="Status">
            {tab('Open', status === 'open', () => setStatus('open'))}
            {tab('Resolved', status === 'resolved', () => setStatus('resolved'))}
            {tab('All', status === 'all', () => setStatus('all'))}
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Where it happened">
            {tab('Everywhere', source === 'all', () => setSource('all'))}
            {tab('Server', source === 'server', () => setSource('server'))}
            {tab('Browser', source === 'client', () => setSource('client'))}
          </div>
          <input
            className="field flex-1 min-w-[10rem] !h-8 text-xs"
            placeholder="Search area, message or path"
            aria-label="Search errors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
          />
          <Button size="sm" variant="tertiary" onClick={() => void load()} disabled={busy}>
            Refresh
          </Button>
          {confirmClear ? (
            <span className="flex items-center gap-1.5">
              <Button size="sm" variant="danger" onClick={clearResolved} disabled={busy}>
                Yes, clear resolved
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)} disabled={busy || !(rows ?? []).some((r) => r.status === 'resolved')}>
              Clear resolved
            </Button>
          )}
        </div>

        {note && (
          <p role="status" className="text-xs text-[var(--text-muted)]">
            {note}
          </p>
        )}

        {rows === null ? (
          <p className="text-xs text-[var(--text-muted)]">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">{rows.length === 0 ? 'No errors have been recorded.' : 'No errors match these filters.'}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shown.map((r) => {
              const isOpen = openId === r.id;
              return (
                <li key={r.id} className="rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    className="w-full text-left p-3 flex flex-col gap-1"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={r.level === 'error' ? 'danger' : 'warning'}>{r.level}</Badge>
                      <Badge>{r.source === 'server' ? 'server' : 'browser'}</Badge>
                      {r.status === 'resolved' && <Badge tone="accent">resolved</Badge>}
                      <span className="text-[11px] text-[var(--text-muted)] font-mono break-all">{r.area}</span>
                      <span className="ml-auto text-[11px] text-[var(--text-muted)]">
                        {r.occurrences}x · last {new Date(r.last_seen_at).toLocaleString()}
                      </span>
                    </span>
                    <span className="text-xs text-[var(--text-primary)] break-words">{r.message || '(no message)'}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Affected: {who(r.user_id)}</span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-2">
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                        <dt className="text-[var(--text-muted)]">First seen</dt>
                        <dd>{new Date(r.first_seen_at).toLocaleString()}</dd>
                        {r.path && (
                          <>
                            <dt className="text-[var(--text-muted)]">Page</dt>
                            <dd className="font-mono break-all">{r.path}</dd>
                          </>
                        )}
                        {r.release && (
                          <>
                            <dt className="text-[var(--text-muted)]">Release</dt>
                            <dd className="font-mono">{r.release}</dd>
                          </>
                        )}
                        {r.user_agent && (
                          <>
                            <dt className="text-[var(--text-muted)]">Browser</dt>
                            <dd className="break-all">{r.user_agent}</dd>
                          </>
                        )}
                        {r.resolved_at && (
                          <>
                            <dt className="text-[var(--text-muted)]">Resolved</dt>
                            <dd>
                              {new Date(r.resolved_at).toLocaleString()}
                              {r.resolved_by ? ` by ${nameOf(r.resolved_by)}` : ''}
                            </dd>
                          </>
                        )}
                      </dl>
                      {r.detail && (
                        <pre className="text-[11px] leading-relaxed bg-[var(--canvas-bg)] border border-[var(--border-subtle)] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-words">{r.detail}</pre>
                      )}
                      <div className="flex gap-2">
                        {r.status === 'open' ? (
                          <Button size="sm" variant="tertiary" disabled={busy} onClick={() => setRowStatus(r.id, 'resolved')}>
                            Mark resolved
                          </Button>
                        ) : (
                          <Button size="sm" variant="tertiary" disabled={busy} onClick={() => setRowStatus(r.id, 'open')}>
                            Reopen
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => void copy(r)}>
                          {copied === r.id ? 'Copied' : 'Copy details'}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[11px] text-[var(--text-muted)]">
          Entries are kept for 30 days. The same error is counted once, and a resolved error that happens again reopens. Secrets and message content are never recorded.
        </p>
      </div>
    </div>
  );
};

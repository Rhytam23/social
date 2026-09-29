'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { isSupabaseConfigured } from '../../lib/supabase/env';
import { technicalNote, userError } from '../../lib/ui/errors';
import { Button } from '../ui/button';
import { Badge } from '../ui/primitives';
import { SUPPORT_TOPIC_LABEL, filterSupportRows, replyHref, type SupportRow, type SupportStatusFilter } from '../../lib/support';

const REFRESH_MS = 60_000;

/**
 * Messages from the contact form and "Report a problem". Readable by platform admins only (row level
 * security). Everything shown is plain text; the reply link is a fixed-shape mailto.
 */
export const AdminSupport: React.FC<{ nameOf: (userId: string) => string }> = ({ nameOf }) => {
  const [rows, setRows] = useState<SupportRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [status, setStatus] = useState<SupportStatusFilter>('open');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setRows([]);
      setNote('Support requests are collected when the app is connected to Supabase. There is nothing to show in demo mode.');
      return;
    }
    const { data, error } = await createClient()
      .from('support_requests' as never)
      .select('id, user_id, name, email, topic, message, context, status, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) {
      setNote(technicalNote('Support requests need the latest database update (migration 022).', 'Support requests are not available right now.'));
      setRows([]);
      return;
    }
    setNote(null);
    setRows((data as unknown as SupportRow[]) || []);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const shown = useMemo(() => filterSupportRows(rows ?? [], status, query), [rows, status, query]);
  const openCount = (rows ?? []).filter((r) => r.status === 'open').length;

  const setRowStatus = async (id: string, next: 'open' | 'resolved') => {
    setBusy(true);
    try {
      const { error } = await createClient().rpc('admin_set_support_status' as never, { p_id: id, p_status: next } as never);
      setNote(error ? userError(error, 'Could not update that request.') : null);
    } catch (err) {
      setNote(userError(err, 'Could not update that request.'));
    } finally {
      setBusy(false);
      void load();
    }
  };

  const filterButton = (label: string, value: SupportStatusFilter) => (
    <Button size="sm" variant={status === value ? 'primary' : 'tertiary'} onClick={() => setStatus(value)} aria-pressed={status === value}>
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="panel !p-3 self-start min-w-[10rem]">
        <p className="text-[11px] text-[var(--text-muted)]">Open requests</p>
        <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5">{openCount}</p>
      </div>

      <div className="panel flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5" role="group" aria-label="Status">
            {filterButton('Open', 'open')}
            {filterButton('Resolved', 'resolved')}
            {filterButton('All', 'all')}
          </div>
          <input
            className="field flex-1 min-w-[10rem] !h-8 text-xs"
            placeholder="Search name, email or message"
            aria-label="Search support requests"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
          />
          <Button size="sm" variant="tertiary" onClick={() => void load()} disabled={busy}>
            Refresh
          </Button>
        </div>

        {note && (
          <p role="status" className="text-xs text-[var(--text-muted)]">
            {note}
          </p>
        )}

        {rows === null ? (
          <p className="text-xs text-[var(--text-muted)]">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">{rows.length === 0 ? 'No support requests yet.' : 'No requests match these filters.'}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shown.map((r) => (
              <li key={r.id} className="rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={r.topic === 'abuse' ? 'danger' : 'neutral'}>{SUPPORT_TOPIC_LABEL[r.topic]}</Badge>
                  {r.status === 'resolved' && <Badge tone="accent">resolved</Badge>}
                  <span className="text-xs text-[var(--text-primary)] break-all">{r.name ? `${r.name} · ` : ''}{r.email}</span>
                  {r.user_id && <span className="text-[11px] text-[var(--text-muted)]">Account: {nameOf(r.user_id)} ({r.user_id.slice(0, 8)})</span>}
                  <span className="ml-auto text-[11px] text-[var(--text-muted)]">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap break-words">{r.message}</p>
                {r.context && <p className="text-[11px] text-[var(--text-muted)] whitespace-pre-wrap break-words font-mono">{r.context}</p>}
                <div className="flex gap-2">
                  <a href={replyHref(r)} className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]">
                    Reply by email
                  </a>
                  <Button size="sm" variant="tertiary" disabled={busy} onClick={() => void setRowStatus(r.id, r.status === 'open' ? 'resolved' : 'open')}>
                    {r.status === 'open' ? 'Mark resolved' : 'Reopen'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { isSupabaseConfigured } from '../../lib/supabase/env';
import { Button } from '../ui/button';
import { Badge } from '../ui/primitives';

interface ReportRow {
  id: string;
  reason: string;
  excerpt: string | null;
  status: 'open' | 'reviewed' | 'dismissed';
  created_at: string;
  reporter_id: string;
  reported_user_id: string | null;
}

/** Reports filed by members. Visible to platform administrators only (row level security enforces it). */
export const AdminReports: React.FC<{ nameOf: (userId: string) => string }> = ({ nameOf }) => {
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setRows([]);
      return;
    }
    const { data, error } = await createClient()
      .from('reports' as never)
      .select('id, reason, excerpt, status, created_at, reporter_id, reported_user_id')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      setNote('Reports need the latest database update (migration 015).');
      setRows([]);
      return;
    }
    setRows((data as unknown as ReportRow[]) || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: ReportRow['status']) => {
    await createClient().from('reports' as never).update({ status } as never).eq('id', id);
    void load();
  };

  return (
    <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-3">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">Reports</h3>
      {note && <p className="text-xs text-[var(--text-muted)]">{note}</p>}
      {rows === null ? (
        <p className="text-xs text-[var(--text-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No reports.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="p-3 rounded-xl bg-[var(--surface-2)] flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span>
                  {nameOf(r.reporter_id)} reported {r.reported_user_id ? nameOf(r.reported_user_id) : 'a message'} · {new Date(r.created_at).toLocaleString()}
                </span>
                <Badge tone={r.status === 'open' ? 'warning' : 'neutral'}>{r.status}</Badge>
              </div>
              <p className="text-xs text-[var(--text-primary)]">{r.reason}</p>
              {r.excerpt ? (
                <p className="text-xs text-[var(--text-secondary)] border-l-2 border-[var(--border-strong)] pl-2 whitespace-pre-wrap break-words">{r.excerpt}</p>
              ) : (
                <p className="text-[11px] text-[var(--text-muted)]">The reporter did not share the message text.</p>
              )}
              {r.status === 'open' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="tertiary" onClick={() => setStatus(r.id, 'reviewed')}>Mark reviewed</Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'dismissed')}>Dismiss</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

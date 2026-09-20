'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { isSupabaseConfigured } from '../../lib/supabase/env';
import { technicalNote } from '../../lib/ui/errors';
import { Button } from '../ui/button';

interface AuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: string | null;
  created_at: string;
}

const LABELS: Record<string, string> = {
  promote_admin: 'made an admin',
  demote_admin: 'removed as admin',
  resolve_error: 'resolved an error',
  reopen_error: 'reopened an error',
  clear_errors: 'cleared error log entries',
};

/** What admins did, newest first. Append-only: nobody can edit or delete these rows through the app. */
export const AdminActivity: React.FC<{ nameOf: (userId: string) => string }> = ({ nameOf }) => {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setRows([]);
      setNote('The activity log is recorded when the app is connected to Supabase. There is nothing to show in demo mode.');
      return;
    }
    const { data, error } = await createClient()
      .from('admin_audit_log' as never)
      .select('id, actor_id, action, target_type, target_id, detail, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      setNote(technicalNote('The activity log needs the latest database update (migration 019).', 'The activity log is not available right now.'));
      setRows([]);
      return;
    }
    setNote(null);
    setRows((data as unknown as AuditRow[]) || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const target = (r: AuditRow) => {
    if (r.target_type === 'user' && r.target_id) return nameOf(r.target_id);
    return r.detail || '';
  };

  return (
    <div className="panel flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Admin activity</h3>
        <Button size="sm" variant="tertiary" onClick={() => void load()}>
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
      ) : rows.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No admin activity has been recorded.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
          {rows.map((r) => (
            <li key={r.id} className="py-2 flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">{r.actor_id ? nameOf(r.actor_id) : 'An admin'}</span>
              <span className="text-[var(--text-secondary)]">{LABELS[r.action] ?? r.action}</span>
              {target(r) && <span className="text-[var(--text-primary)]">{target(r)}</span>}
              <span className="ml-auto text-[11px] text-[var(--text-muted)]">{new Date(r.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-[var(--text-muted)]">This record cannot be edited or deleted from the app.</p>
    </div>
  );
};

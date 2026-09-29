'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { isSupabaseConfigured } from '../../lib/supabase/env';
import { technicalNote, userError } from '../../lib/ui/errors';
import { Button } from '../ui/button';
import { Badge } from '../ui/primitives';
import { VerifiedBadge } from '../brand/VerifiedBadge';
import { MODERATION, RISK_LABEL, describeBan, isBanned, riskLevel } from '../../lib/moderation';

interface OverviewRow {
  user_id: string;
  display_name: string | null;
  username: string | null;
  distinct_reporters: number;
  total_reports: number;
  open_reports: number;
  last_report_at: string | null;
  warned: boolean;
  banned_until: string | null;
  is_platform_admin: boolean;
}

interface BlockedRow {
  id: string;
  kind: 'email' | 'ip';
  value: string;
  reason: string | null;
  source: 'auto' | 'admin';
  user_id: string | null;
  expires_at: string | null;
  created_at: string;
  accounts_seen: number;
}

/**
 * The safety queue: people ranked by how many DIFFERENT people reported them, with what will happen at each level,
 * manual ban and lift, and the list of blocked emails and addresses. Platform admins only (the database
 * functions check it). Everything shown is plain text.
 */
export const AdminModeration: React.FC = () => {
  const [rows, setRows] = useState<OverviewRow[] | null>(null);
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; days: number } | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setRows([]);
      return;
    }
    const client = createClient();
    const overview = await client.rpc('admin_moderation_overview' as never);
    if (overview.error) {
      setNote(technicalNote('Bans and warnings need the latest database update (migration 024).', 'The safety queue is not available right now.'));
      setRows([]);
      return;
    }
    setNote(null);
    setRows((overview.data as unknown as OverviewRow[]) || []);
    const list = await client.rpc('admin_blocked_identities' as never);
    setBlocked(((list.data as unknown as BlockedRow[]) || []).slice());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => PromiseLike<{ error: unknown }>, failure: string) => {
    setBusy(true);
    try {
      const { error } = await fn();
      setNote(error ? userError(error, failure) : null);
    } catch (err) {
      setNote(userError(err, failure));
    } finally {
      setBusy(false);
      setConfirm(null);
      void load();
    }
  };

  const ban = (id: string, days: number) => act(() => createClient().rpc('admin_ban_user' as never, { p_user: id, p_days: days, p_reason: 'Banned by an administrator' } as never), 'Could not ban that account.');
  const unban = (id: string) => act(() => createClient().rpc('admin_unban_user' as never, { p_user: id } as never), 'Could not lift that ban.');
  const unblock = (id: string) => act(() => createClient().rpc('admin_unblock_identity' as never, { p_id: id } as never), 'Could not remove that block.');

  return (
    <div className="panel flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Safety queue</h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Each different person who reports someone counts once (last {MODERATION.windowDays} days; dismissed reports and reports from accounts under {MODERATION.minReporterAgeHours} hours old do not count).
          At {MODERATION.warnAt} the person gets a warning. At {MODERATION.tempBanAt} they are banned for {MODERATION.tempBanDays} days and their email and addresses cannot create new accounts for that time.
          Above {MODERATION.tempBanAt} they are shown in red. At {MODERATION.blockAt} they are blocked permanently. Platform admins are never banned automatically. You can lift any ban.
        </p>
      </div>

      {note && <p role="status" className="text-xs text-[var(--text-muted)]">{note}</p>}

      {rows === null ? (
        <p className="text-xs text-[var(--text-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">Nobody has been reported.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const level = riskLevel(r.distinct_reporters);
            const banned = isBanned(r.banned_until);
            const red = level === 'red' || level === 'blocked';
            return (
              <li key={r.user_id} className={`rounded-xl border p-3 flex flex-col gap-2 ${red ? 'border-[var(--danger-neutral)] bg-[var(--danger-subtle)]' : 'border-[var(--border-subtle)] bg-[var(--surface-2)]'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5">
                    {r.display_name || r.username || 'A member'}
                    {r.is_platform_admin && <VerifiedBadge />}
                  </span>
                  {r.username && <span className="text-[11px] text-[var(--text-muted)] font-mono">@{r.username}</span>}
                  <Badge tone={red ? 'danger' : level === 'none' ? 'neutral' : 'warning'}>{RISK_LABEL[level]}</Badge>
                  {banned && <Badge tone="danger">{describeBan(r.banned_until)}</Badge>}
                  <span className="ml-auto text-xs font-semibold text-[var(--text-primary)]">{r.distinct_reporters} different {r.distinct_reporters === 1 ? 'person' : 'people'}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {r.total_reports} reports in total, {r.open_reports} open{r.last_report_at ? `, last ${new Date(r.last_report_at).toLocaleString()}` : ''}. Read the reasons in the list below.
                </p>
                {!r.is_platform_admin && (
                  <div className="flex flex-wrap gap-2">
                    {banned ? (
                      <Button size="sm" variant="tertiary" disabled={busy} onClick={() => void unban(r.user_id)}>Lift ban</Button>
                    ) : confirm?.id === r.user_id ? (
                      <>
                        <Button size="sm" variant="danger" disabled={busy} onClick={() => void ban(r.user_id, confirm.days)}>
                          Yes, ban {confirm.days > 0 ? `for ${confirm.days} days` : 'permanently'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="tertiary" disabled={busy} onClick={() => setConfirm({ id: r.user_id, days: MODERATION.tempBanDays })}>Ban {MODERATION.tempBanDays} days</Button>
                        <Button size="sm" variant="tertiary" disabled={busy} onClick={() => setConfirm({ id: r.user_id, days: 0 })}>Ban permanently</Button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4">
        <h4 className="text-xs font-semibold text-[var(--text-primary)]">Blocked emails and addresses ({blocked.length})</h4>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          A network address is shared by everyone on the same Wi-Fi or mobile connection, so a block can catch people who did nothing. The number of accounts seen from an address is shown so you can check before you leave a block in place.
        </p>
        {blocked.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">Nothing is blocked.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {blocked.map((b) => (
              <li key={b.id} className="rounded-lg bg-[var(--surface-2)] px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
                <Badge>{b.kind === 'email' ? 'email' : 'address'}</Badge>
                <span className="font-mono text-[var(--text-primary)] break-all">{b.value}</span>
                {b.kind === 'ip' && b.accounts_seen > 1 && <Badge tone="warning">shared: {b.accounts_seen} accounts</Badge>}
                <span className="text-[11px] text-[var(--text-muted)]">{b.expires_at ? `until ${new Date(b.expires_at).toLocaleDateString()}` : 'permanent'}</span>
                <Button size="sm" variant="ghost" className="ml-auto" disabled={busy} onClick={() => void unblock(b.id)}>Unblock</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

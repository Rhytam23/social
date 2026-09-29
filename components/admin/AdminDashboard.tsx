import React, { useState } from 'react';
import { UserItem } from '../../types/ui';
import { AdminReports } from './AdminReports';
import { AdminModeration } from './AdminModeration';
import { AdminErrors } from './AdminErrors';
import { AdminActivity } from './AdminActivity';
import { AdminSupport } from './AdminSupport';
import { Button } from '../ui/button';
import { VerifiedBadge } from '../brand/VerifiedBadge';

export interface AdminDashboardProps {
  users: UserItem[];
}

type AdminTab = 'people' | 'support' | 'errors' | 'activity';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users }) => {
  const [tab, setTab] = useState<AdminTab>('people');
  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? 'A member';
  return (
    <div className="flex-1 bg-[var(--canvas-bg)] flex flex-col h-full overflow-y-auto p-6 sm:p-8 gap-6 font-sans max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-[var(--border-subtle)] pb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
            Admin Operations
          </h2>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold uppercase">
            Restricted Access
          </span>
        </div>
        <p className="text-xs text-slate-400 font-sans">
          Manage member privileges, review reports, and see what is going wrong without needing access to the hosting or database dashboards.
        </p>
        <div className="flex gap-1.5 mt-3" role="tablist" aria-label="Admin sections">
          {([
            ['people', 'People and reports'],
            ['support', 'Support'],
            ['errors', 'Errors'],
            ['activity', 'Activity'],
          ] as Array<[AdminTab, string]>).map(([id, label]) => (
            <Button key={id} size="sm" role="tab" aria-selected={tab === id} variant={tab === id ? 'primary' : 'tertiary'} onClick={() => setTab(id)}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {tab === 'support' && <AdminSupport nameOf={nameOf} />}
      {tab === 'errors' && <AdminErrors nameOf={nameOf} />}
      {tab === 'activity' && <AdminActivity nameOf={nameOf} />}
      {tab === 'people' && (
        <>

      {/* People. Read-only: platform admins are made and removed in Supabase, never from here. */}
      <div className="panel flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">People ({users.length})</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Platform admins are added and removed only in the Supabase dashboard, so a stolen admin session cannot create more admins. See the maintainer guide, &quot;Making someone a platform admin&quot;.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Member</th>
                <th className="pb-3 font-semibold">Devices</th>
                <th className="pb-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {users.map((u) => (
                <tr key={u.id} className="text-[var(--text-primary)]">
                  <td className="py-3 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {u.name}
                      {u.role === 'admin' && <VerifiedBadge />}
                    </span>
                  </td>
                  <td className="py-3 text-[var(--text-secondary)]">{u.deviceCount} active</td>
                  <td className="py-3 text-[var(--text-secondary)]">{u.role === 'admin' ? 'Platform admin' : 'Member'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModeration />

      <AdminReports nameOf={nameOf} />
        </>
      )}
    </div>
  );
};

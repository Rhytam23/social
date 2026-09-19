import React from 'react';
import { UserItem } from '../../types/ui';

export interface AdminDashboardProps {
  users: UserItem[];
  onToggleUserRole: (userId: string, currentRole: 'admin' | 'member') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onToggleUserRole }) => {
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
          Manage member security privileges.
        </p>
      </div>

      {/* Member Permissions Table */}
      <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-100">
          Member Privileges ({users.length} active users)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Member</th>
                <th className="pb-3 font-semibold">Registration ID</th>
                <th className="pb-3 font-semibold">Devices</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold text-right">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="text-slate-200">
                  <td className="py-3 font-bold text-slate-100">{u.name}</td>
                  <td className="py-3 text-slate-400 font-mono">#{u.registrationId}</td>
                  <td className="py-3 text-slate-300">{u.deviceCount} active</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                      u.role === 'admin'
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onToggleUserRole(u.id, u.role)}
                      className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs transition-colors"
                    >
                      {u.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

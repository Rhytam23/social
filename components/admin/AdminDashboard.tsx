import React, { useState } from 'react';
import { InviteItem, UserItem } from '../../types/ui';
import { IconCheck, IconPlus } from '../ui/icons';

export interface AdminDashboardProps {
  invites: InviteItem[];
  users: UserItem[];
  onGenerateInvite: (assignedEmail: string) => Promise<string | null>;
  onRevokeInvite: (inviteId: string) => void;
  onToggleUserRole: (userId: string, currentRole: 'admin' | 'member') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  invites,
  users,
  onGenerateInvite,
  onRevokeInvite,
  onToggleUserRole,
}) => {
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setGenError('Enter a valid email address to invite.');
      return;
    }
    setIsGenerating(true);
    setCreatedToken(null);
    setGenError(null);
    try {
      const token = await onGenerateInvite(inviteEmail.trim());
      if (token) {
        setCreatedToken(token);
        setInviteEmail('');
      } else {
        setGenError('Failed to generate invite. See the error banner above.');
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate invite.');
    } finally {
      setIsGenerating(false);
    }
  };

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
          Manage single-use network invitations and member security privileges.
        </p>
      </div>

      {/* 1. Generate Single-Use Invite Token */}
      <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Single-Use Invitation Tokens
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Generate a single-use invitation for a specific email address.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="newmember@example.com"
            className="flex-1 bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="py-2 px-3.5 bg-slate-100 hover:bg-white text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <IconPlus className="w-4 h-4" />
            <span>{isGenerating ? 'Generating...' : 'Generate invitation'}</span>
          </button>
        </div>

        {genError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">{genError}</div>
        )}

        {createdToken && (
          <div className="p-4 bg-slate-950/60 border border-emerald-500/30 rounded-xl flex flex-col gap-2 font-sans text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <IconCheck className="w-4 h-4" />
              <span>Invitation Token Generated</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={createdToken}
                className="flex-1 bg-slate-900 text-slate-100 border border-slate-800 p-2.5 text-xs rounded-lg font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(createdToken)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors shrink-0"
              >
                Copy token
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Invitation Registry */}
      <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-100">
          Invitation Registry ({invites.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Recipient Email</th>
                <th className="pb-3 font-semibold">Created At</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500 font-sans">
                    No active invitation tokens issued.
                  </td>
                </tr>
              ) : (
                invites.map((inv) => (
                  <tr key={inv.id} className="text-slate-200">
                    <td className="py-3 font-mono font-bold truncate max-w-[180px] text-slate-100">{inv.token}</td>
                    <td className="py-3 text-slate-400">{inv.createdAt}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        inv.status === 'consumed'
                          ? 'bg-slate-800 text-slate-400'
                          : inv.status === 'pending'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => onRevokeInvite(inv.id)}
                          className="py-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Member Permissions Table */}
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

import React from 'react';
import { UserItem, ConversationItem } from '../../types/ui';
import { IconCheck, IconShield, IconUsers, IconX } from '../ui/icons';

export interface UserProfileModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (user: UserItem) => void;
  sharedGroups?: ConversationItem[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onStartChat,
  sharedGroups = [],
}) => {
  if (!isOpen || !user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatFingerprint = (fp: string) => {
    return fp.match(/.{1,4}/g)?.join(' ') || fp;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-[var(--surface-1)] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Banner */}
        <div className="h-20 bg-gradient-to-r from-slate-900 to-slate-800 relative flex items-start justify-end p-3">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-900/60 border border-slate-700/60 transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar Overlay */}
        <div className="px-6 pb-6 pt-0 flex flex-col gap-4 relative">
          <div className="-mt-10 flex justify-between items-end">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-[var(--surface-1)] flex items-center justify-center text-xl font-bold text-white shadow-xl">
                {getInitials(user.name)}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[var(--surface-1)]" />
            </div>

            <button
              onClick={() => {
                onStartChat(user);
                onClose();
              }}
              className="py-2 px-4 bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              Start Chat
            </button>
          </div>

          {/* User Bio Details */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">{user.name}</h2>
              {user.role === 'admin' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold uppercase">
                  Admin
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Registration ID: #{user.registrationId}
            </span>
          </div>

          {/* Security & Verification Card */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                <IconShield className="w-3.5 h-3.5 text-emerald-400" />
                Identity Key Verification
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                <IconCheck className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 tracking-wider text-center select-all">
              {formatFingerprint(user.identityFingerprint)}
            </p>
          </div>

          {/* Shared Context */}
          {sharedGroups.length > 0 && (
            <div className="flex flex-col gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <IconUsers className="w-3.5 h-3.5 text-slate-400" />
                Shared Spaces ({sharedGroups.length})
              </span>
              <div className="flex flex-col gap-1">
                {sharedGroups.map((g) => (
                  <div
                    key={g.id}
                    className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-slate-200"
                  >
                    <span className="font-medium">{g.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">E2EE Group</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

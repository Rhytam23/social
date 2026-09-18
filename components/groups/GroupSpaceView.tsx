import React, { useState } from 'react';
import { ConversationItem, MessageData, UserItem } from '../../types/ui';
import { IconFile, IconShield } from '../ui/icons';

export interface GroupSpaceViewProps {
  group: ConversationItem;
  members: UserItem[];
  messages: MessageData[];
  onRotateKey?: () => void;
  onLeaveGroup?: (groupId: string) => void;
  onOpenChat: (convId: string) => void;
}

export const GroupSpaceView: React.FC<GroupSpaceViewProps> = ({
  group,
  members,
  messages,
  onRotateKey,
  onLeaveGroup,
  onOpenChat,
}) => {
  type GroupTab = 'overview' | 'members' | 'files' | 'security';
  const [activeTab, setActiveTab] = useState<GroupTab>('overview');

  const attachments = messages.flatMap((m) => m.attachments || []);

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const tabs: { key: GroupTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: `Members (${members.length})` },
    { key: 'files', label: `Files (${attachments.length})` },
    { key: 'security', label: 'Group Security' },
  ];

  return (
    <div className="flex-1 bg-[var(--canvas-bg)] flex flex-col h-full overflow-hidden p-6 sm:p-8 gap-6 font-sans max-w-5xl mx-auto w-full">
      {/* Group Header Card */}
      <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xl font-bold shadow-md shrink-0">
            {getInitials(group.title)}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">{group.title}</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
                Group Space
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {group.groupMeta?.memberCount || members.length} members • Signal Sender Key Protocol v{group.groupMeta?.senderKeyVersion || 1}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenChat(group.id)}
            className="py-2.5 px-4 bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            Open Chat Workspace
          </button>

          {onLeaveGroup && (
            <button
              onClick={() => onLeaveGroup(group.id)}
              className="py-2.5 px-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors"
            >
              Leave Group
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === t.key
                ? 'bg-slate-800 text-slate-100 border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-5 bg-[var(--surface-1)] border border-slate-800 rounded-2xl flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-100">About Group Space</h3>
              <p className="text-slate-300 leading-relaxed">
                Encrypted team space protected by Signal Sender Key Protocol. All group members have equal standing with local end-to-end encryption.
              </p>
            </div>

            <div className="p-5 bg-[var(--surface-1)] border border-slate-800 rounded-2xl flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-100">Recent Group Activity</h3>
              {messages.length === 0 ? (
                <span className="text-slate-500">No activity yet in this space.</span>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.slice(-3).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-200">{m.senderName}</span>
                        <span className="text-slate-400 truncate max-w-md">{m.content}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{m.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equal Standing Group Members */}
        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-[var(--surface-1)] border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold">
                    {m.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">{m.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Reg ID: #{m.registrationId}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-[10px] font-mono">
                  Member
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex flex-col gap-2 text-xs">
            {attachments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No media or encrypted attachments shared in this group.</div>
            ) : (
              attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-3.5 bg-[var(--surface-1)] border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <IconFile className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{att.fileName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{att.fileSize} • Encrypted</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-5 bg-[var(--surface-1)] border border-slate-800 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 flex items-center gap-2">
                  <IconShield className="w-4 h-4 text-emerald-400" />
                  Signal Sender Key Protocol State
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                  Key Version {group.groupMeta?.senderKeyVersion || 1}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Group keys automatically rotate upon member departure or key rotation trigger to enforce forward secrecy.
              </p>
              {onRotateKey && (
                <button
                  onClick={onRotateKey}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 w-fit transition-colors"
                >
                  Rotate Group Encryption Keys
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

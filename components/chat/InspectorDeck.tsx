import React, { useState } from 'react';
import { ConversationItem, DeviceItem, UserItem } from '../../types/ui';
import { IconCheck, IconLaptop, IconLock, IconMobile, IconShield } from '../ui/icons';

export interface InspectorDeckProps {
  conversation: ConversationItem;
  devices?: DeviceItem[];
  members?: UserItem[];
  onRotateGroupKey?: () => void;
  onLeaveGroup?: () => void;
  onVerifyIdentityKey?: () => void;
}

export const InspectorDeck: React.FC<InspectorDeckProps> = ({
  conversation,
  devices = [],
  members = [],
  onRotateGroupKey,
  onLeaveGroup,
  onVerifyIdentityKey,
}) => {
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatFingerprint = (fingerprint?: string) => {
    if (!fingerprint) return '---- ---- ---- ----';
    return fingerprint.match(/.{1,4}/g)?.join(' ') || fingerprint;
  };

  return (
    <aside className="w-80 bg-[var(--surface-1)] border-l border-[var(--border-subtle)] flex flex-col shrink-0 h-full overflow-y-auto font-sans">
      {/* Header Profile Section */}
      <div className="p-6 border-b border-[var(--border-subtle)] flex flex-col items-center text-center gap-3 bg-slate-950/20">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg font-bold text-slate-100 shadow-md">
            {getInitials(conversation.title)}
          </div>
          <div className="absolute bottom-0 right-0 p-1 bg-slate-900 rounded-full">
            <IconShield className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <h3 className="text-base font-bold text-slate-100 truncate font-sans">
            {conversation.title}
          </h3>
          <span className="text-xs text-slate-400">
            {conversation.type === 'group' ? 'Group Space' : 'Direct Contact'}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium flex items-center gap-1">
            <IconLock className="w-3 h-3" />
            <span>Signal E2EE</span>
          </span>
        </div>
      </div>

      {/* 1-to-1 Details & Verification */}
      {conversation.type === 'direct' && conversation.recipientUser && (
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col gap-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Identity & Verification
          </span>

          <div className="flex flex-col gap-2 p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Identity Status:</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <IconCheck className="w-3.5 h-3.5" />
                <span>{conversation.recipientUser.isVerified ? 'Verified' : 'Unverified'}</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Registration ID:</span>
              <span className="text-slate-200 font-mono font-bold">
                #{conversation.recipientUser.registrationId}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowSafetyNumber(!showSafetyNumber)}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              {showSafetyNumber ? 'Hide safety number' : 'Verify safety number'}
            </button>

            {showSafetyNumber && (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-3 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Safety Fingerprint
                </span>
                <p className="font-mono text-xs text-emerald-400 bg-slate-900 p-3 rounded-lg border border-slate-800 tracking-wider text-center leading-relaxed select-all">
                  {formatFingerprint(conversation.recipientUser.identityFingerprint)}
                </p>
                <button
                  onClick={onVerifyIdentityKey}
                  className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  Mark identity verified
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Group Encryption State */}
      {conversation.type === 'group' && conversation.groupMeta && (
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Group Encryption State
          </span>

          <div className="flex flex-col gap-2 p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Sender Key Version:</span>
              <span className="text-slate-200 font-mono font-bold">
                v{conversation.groupMeta.senderKeyVersion}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {onRotateGroupKey && (
              <button
                onClick={onRotateGroupKey}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                Rotate group keys
              </button>
            )}

            {onLeaveGroup && (
              <button
                onClick={onLeaveGroup}
                className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium rounded-xl transition-colors"
              >
                Leave group
              </button>
            )}
          </div>
        </div>
      )}

      {/* Group Members List (Equal Standing) */}
      {conversation.type === 'group' && (
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Group Members
            </span>
            <span className="text-xs font-mono text-slate-400">{members.length}</span>
          </div>

          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200 shrink-0">
                    {getInitials(m.name)}
                  </div>
                  <span className="font-semibold text-slate-200 truncate font-sans">
                    {m.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-md text-[10px] font-mono">
                  Member
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registered Devices List */}
      <div className="p-5 flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Registered Devices
        </span>

        <div className="flex flex-col gap-2">
          {devices.length === 0 ? (
            <span className="text-xs text-slate-500">No registered devices.</span>
          ) : (
            devices.map((d) => {
              const isMobile = d.deviceName.toLowerCase().includes('phone') || d.deviceName.toLowerCase().includes('ios') || d.deviceName.toLowerCase().includes('android');
              return (
                <div
                  key={d.id}
                  className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div className="text-slate-400 shrink-0">
                        {isMobile ? <IconMobile className="w-4 h-4" /> : <IconLaptop className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold text-slate-200 truncate">{d.deviceName}</span>
                    </div>
                    {d.isCurrentDevice && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                        This Device
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                    <span>ID: #{d.registrationId}</span>
                    <span>{d.lastActive}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};

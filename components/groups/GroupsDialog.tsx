'use client';

import React, { useEffect, useState } from 'react';
import { UserItem } from '../../types/ui';
import type { LookupOutcome } from '../../lib/people/lookup';
import { parseInviteCode } from '../../lib/community/invite';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { UsernameLookup } from '../people/UsernameLookup';

const inputClass =
  'w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] p-2.5 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60';

type Tab = 'group' | 'community' | 'join';

export interface GroupsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** An invite code from a link (?join=CODE): opens on the join tab. */
  initialCode?: string;
  contacts: UserItem[];
  currentUserId: string;
  blockedIds?: string[];
  onLookup: (raw: string) => Promise<LookupOutcome>;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<boolean>;
  /** Communities and invites need a connected account; omitted in demo mode. */
  onCreateCommunity?: (name: string, description: string) => Promise<boolean>;
  onJoin?: (code: string) => Promise<boolean>;
}

/** The "+" in the left rail: everything about groups in one place. */
export const GroupsDialog: React.FC<GroupsDialogProps> = ({
  isOpen,
  onClose,
  initialCode,
  contacts,
  currentUserId,
  blockedIds = [],
  onLookup,
  onCreateGroup,
  onCreateCommunity,
  onJoin,
}) => {
  const [tab, setTab] = useState<Tab>(initialCode ? 'join' : 'group');
  const [busy, setBusy] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [picked, setPicked] = useState<UserItem[]>([]);
  const [communityName, setCommunityName] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');
  const [code, setCode] = useState(initialCode ?? '');
  const [joinFailed, setJoinFailed] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setTab('join');
    }
  }, [initialCode]);

  const candidates = [...contacts, ...picked.filter((p) => !contacts.some((c) => c.id === p.id))].filter(
    (u) => u.id !== currentUserId && !blockedIds.includes(u.id)
  );
  const isPicked = (id: string) => picked.some((p) => p.id === id);
  const toggle = (u: UserItem) => setPicked((prev) => (prev.some((p) => p.id === u.id) ? prev.filter((p) => p.id !== u.id) : [...prev, u]));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'group', label: 'Create group' },
    ...(onCreateCommunity ? [{ id: 'community' as const, label: 'Create community' }] : []),
    { id: 'join', label: 'Join with invite' },
  ];

  const inviteCode = parseInviteCode(code);
  const canSubmit =
    tab === 'group' ? groupName.trim().length > 0 && picked.length > 0
    : tab === 'community' ? communityName.trim().length >= 2
    : !!onJoin && inviteCode.length >= 6;

  const reset = () => {
    setGroupName('');
    setPicked([]);
    setCommunityName('');
    setCommunityDescription('');
    setCode('');
    setJoinFailed(false);
  };

  const submit = async () => {
    setBusy(true);
    setJoinFailed(false);
    let ok = false;
    try {
      if (tab === 'group') ok = await onCreateGroup(groupName.trim(), picked.map((p) => p.id));
      else if (tab === 'community') ok = (await onCreateCommunity?.(communityName.trim(), communityDescription.trim())) ?? false;
      else {
        ok = (await onJoin?.(inviteCode)) ?? false;
        if (!ok) setJoinFailed(true);
      }
    } finally {
      setBusy(false);
    }
    if (ok) {
      reset();
      onClose();
    }
  };

  const submitLabel = tab === 'group' ? `Create group (${picked.length + 1} members)` : tab === 'community' ? 'Create community' : 'Join';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Groups"
      footerAction={
        <Button variant="primary" size="sm" loading={busy} disabled={!canSubmit} onClick={submit}>
          {submitLabel}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 font-sans">
        <div role="tablist" aria-label="Groups" className="flex flex-wrap gap-1 p-0.5 rounded-xl bg-[var(--surface-2)] w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold ${tab === t.id ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]' : 'text-[var(--text-secondary)]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'group' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="grp-name" className="text-xs font-semibold text-[var(--text-primary)]">Group name</label>
              <input id="grp-name" data-autofocus className={inputClass} maxLength={80} value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Core team" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">Add people</span>
              <UsernameLookup
                onLookup={onLookup}
                renderActions={(user, blocked) =>
                  blocked ? null : (
                    <Button variant={isPicked(user.id) ? 'secondary' : 'primary'} size="sm" onClick={() => toggle(user)}>
                      {isPicked(user.id) ? 'Added' : 'Add'}
                    </Button>
                  )
                }
              />
              {candidates.length > 0 && (
                <ul aria-label="People to add" className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                  {candidates.map((u) => (
                    <li key={u.id}>
                      <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface-2)] cursor-pointer">
                        <input type="checkbox" checked={isPicked(u.id)} onChange={() => toggle(u)} className="accent-emerald-500" />
                        <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-[var(--text-primary)] truncate">{u.name}</span>
                          {u.username && <span className="block text-[11px] text-[var(--text-muted)] font-mono truncate">@{u.username}</span>}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Group messages are end-to-end encrypted. You become the group owner.
            </p>
          </>
        )}

        {tab === 'community' && onCreateCommunity && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cm-name" className="text-xs font-semibold text-[var(--text-primary)]">Community name</label>
              <input id="cm-name" data-autofocus className={inputClass} maxLength={60} value={communityName} onChange={(e) => setCommunityName(e.target.value)} placeholder="e.g. Design team" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cm-desc" className="text-xs font-semibold text-[var(--text-primary)]">Description (optional)</label>
              <textarea id="cm-desc" rows={2} className={`${inputClass} resize-none`} maxLength={300} value={communityDescription} onChange={(e) => setCommunityDescription(e.target.value)} />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              A community has channels and invite links. You become the owner and get a #general channel. Every channel is end-to-end encrypted, so admins and the server cannot read messages.
            </p>
          </>
        )}

        {tab === 'join' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="join-code" className="text-xs font-semibold text-[var(--text-primary)]">Invite link or code</label>
            <input
              id="join-code"
              data-autofocus
              className={inputClass}
              value={code}
              disabled={!onJoin}
              onChange={(e) => {
                setCode(e.target.value);
                setJoinFailed(false);
              }}
              placeholder="Paste the invite link or enter the code"
            />
            {!onJoin ? (
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">Joining with an invite needs a signed-in account. It is not available in local demo mode.</p>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                After you join, an admin&apos;s device shares each channel&apos;s encryption key with you. Messages appear once an admin has the app open.
              </p>
            )}
            {joinFailed && (
              <p role="alert" className="text-xs text-[var(--danger-neutral)]">
                That invite did not work. It may be expired, used up, or mistyped. Ask for a new link.
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};

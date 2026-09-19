import React, { useEffect, useState } from 'react';
import { CommunityItem, CommunityMemberItem } from '../../types/ui';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { Badge, Switch } from '../ui/primitives';
import { ROLE_LABEL, isGroupManager, type GroupRole } from '../../lib/groups/roles';
import { toast } from '../../lib/ui/toastStore';
import { parseInviteCode } from '../../lib/community/invite';

const inputClass =
  'w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] p-2.5 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60';

export const CreateOrJoinDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onCreate: (name: string, description: string) => Promise<boolean>;
  onJoin: (code: string) => Promise<boolean>;
}> = ({ isOpen, onClose, initialCode, onCreate, onJoin }) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState(initialCode ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setTab('join');
    }
  }, [initialCode]);

  const submit = async () => {
    setBusy(true);
    const ok = tab === 'create' ? await onCreate(name.trim(), description.trim()) : await onJoin(parseInviteCode(code));
    setBusy(false);
    if (ok) {
      setName('');
      setDescription('');
      setCode('');
      onClose();
    }
  };

  const disabled = tab === 'create' ? name.trim().length < 2 : parseInviteCode(code).length < 6;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Communities"
      footerAction={
        <Button variant="primary" size="sm" loading={busy} disabled={disabled} onClick={submit}>
          {tab === 'create' ? 'Create community' : 'Join community'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div role="tablist" className="flex gap-1 p-0.5 rounded-xl bg-[var(--surface-2)] w-fit">
          {(['create', 'join'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold ${tab === t ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]' : 'text-[var(--text-secondary)]'}`}
            >
              {t === 'create' ? 'Create' : 'Join with invite'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cm-name" className="text-xs font-semibold text-[var(--text-primary)]">Community name</label>
              <input id="cm-name" data-autofocus className={inputClass} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design team" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cm-desc" className="text-xs font-semibold text-[var(--text-primary)]">Description (optional)</label>
              <textarea id="cm-desc" rows={2} className={`${inputClass} resize-none`} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              You become the owner and get a #general channel. Every channel is end-to-end encrypted, so admins and the server cannot read messages.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cm-code" className="text-xs font-semibold text-[var(--text-primary)]">Invite link or code</label>
            <input id="cm-code" data-autofocus className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the invite link or code" />
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              After you join, an admin&apos;s device shares each channel&apos;s encryption key with you. Messages appear once an admin has the app open.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export const CreateChannelDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  members: CommunityMemberItem[];
  currentUserId: string;
  onCreate: (name: string, isPrivate: boolean, memberIds: string[]) => Promise<boolean>;
}> = ({ isOpen, onClose, members, currentUserId, onCreate }) => {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const ok = await onCreate(name.trim(), isPrivate, picked);
    setBusy(false);
    if (ok) {
      setName('');
      setIsPrivate(false);
      setPicked([]);
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add a channel"
      footerAction={
        <Button variant="primary" size="sm" loading={busy} disabled={!name.trim()} onClick={submit}>
          Create channel
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ch-name" className="text-xs font-semibold text-[var(--text-primary)]">Channel name</label>
          <input id="ch-name" data-autofocus className={inputClass} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. announcements" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">Private channel</p>
            <p className="text-[11px] text-[var(--text-muted)]">Only the people you pick can see it.</p>
          </div>
          <Switch label="Private channel" checked={isPrivate} onChange={setIsPrivate} />
        </div>
        {isPrivate && (
          <fieldset className="flex flex-col gap-1 max-h-44 overflow-y-auto">
            <legend className="text-xs font-semibold text-[var(--text-primary)] mb-1">Who can join</legend>
            {members
              .filter((m) => m.userId !== currentUserId)
              .map((m) => (
                <label key={m.userId} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-xs text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={picked.includes(m.userId)}
                    onChange={(e) => setPicked((p) => (e.target.checked ? [...p, m.userId] : p.filter((id) => id !== m.userId)))}
                  />
                  <Avatar name={m.name} src={m.avatarUrl} size="xs" />
                  {m.name}
                </label>
              ))}
          </fieldset>
        )}
      </div>
    </Dialog>
  );
};

export const CommunitySettingsDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  community: CommunityItem;
  members: CommunityMemberItem[];
  currentUserId: string;
  onCreateInvite: () => Promise<string | null>;
  onSetRole: (userId: string, role: GroupRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onLeave: () => Promise<boolean>;
}> = ({ isOpen, onClose, community, members, currentUserId, onCreateInvite, onSetRole, onRemove, onLeave }) => {
  const [invite, setInvite] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isOwner = community.role === 'owner';
  const canInvite = isGroupManager(community.role);

  useEffect(() => {
    if (!isOpen) setInvite(null);
  }, [isOpen]);

  const link = invite && typeof window !== 'undefined' ? `${window.location.origin}/?join=${invite}` : '';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={community.name} hideCancel>
      <div className="flex flex-col gap-5">
        {community.description && <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{community.description}</p>}

        {canInvite && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Invite people</h3>
            {invite ? (
              <div className="flex items-center gap-2">
                <input readOnly aria-label="Invite link" value={link} onFocus={(e) => e.currentTarget.select()} className={inputClass} />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(link);
                    toast('Invite link copied', { kind: 'success' });
                  }}
                >
                  Copy
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="self-start"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  setInvite(await onCreateInvite());
                  setBusy(false);
                }}
              >
                Create invite link
              </Button>
            )}
            <p className="text-[11px] text-[var(--text-muted)]">Valid for 7 days, up to 50 people. The link is shown once; only a hash is stored.</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-[var(--text-primary)]">Members ({members.length})</h3>
          <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {members.map((m) => {
              const isSelf = m.userId === currentUserId;
              const canRemove = !isSelf && ((isOwner && m.role !== 'owner') || (community.role === 'admin' && m.role === 'member'));
              return (
                <li key={m.userId} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-[var(--surface-2)]">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-[var(--text-primary)] truncate">
                        {m.name}
                        {isSelf ? ' (you)' : ''}
                      </span>
                      <Badge tone={m.role === 'member' ? 'neutral' : 'accent'}>{ROLE_LABEL[m.role]}</Badge>
                    </span>
                  </span>
                  <span className="flex gap-1 shrink-0">
                    {isOwner && !isSelf && m.role === 'member' && (
                      <Button size="sm" variant="tertiary" onClick={() => onSetRole(m.userId, 'admin')}>Make admin</Button>
                    )}
                    {isOwner && !isSelf && m.role === 'admin' && (
                      <>
                        <Button size="sm" variant="tertiary" onClick={() => onSetRole(m.userId, 'member')}>Remove admin</Button>
                        <Button size="sm" variant="ghost" title="Transfer ownership" onClick={() => onSetRole(m.userId, 'owner')}>Make owner</Button>
                      </>
                    )}
                    {canRemove && (
                      <Button size="sm" variant="danger" onClick={() => onRemove(m.userId)}>Remove</Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (await onLeave()) onClose();
            }}
          >
            Leave community
          </Button>
          {isOwner && members.length > 1 && (
            <p className="text-[11px] text-[var(--text-muted)] mt-2">Owners must transfer ownership before leaving.</p>
          )}
        </div>
      </div>
    </Dialog>
  );
};

import React, { useEffect, useState } from 'react';
import { ConversationItem, MessageData, UserItem } from '../../types/ui';
import { IconFile, IconShield } from '../ui/icons';
import { Avatar } from '../ui/avatar';
import { Badge, SettingRow, Switch } from '../ui/primitives';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { technicalNote } from '../../lib/ui/errors';
import { ROLE_LABEL, canAddMembers, canChangeRole, canEditGroup, canRemoveMember, type GroupRole } from '../../lib/groups/roles';

export interface GroupSpaceViewProps {
  group: ConversationItem;
  members: UserItem[];
  currentUserId: string;
  availableUsersToAdd?: UserItem[];
  messages: MessageData[];
  onLeaveGroup?: (groupId: string) => void | Promise<void>;
  onOpenChat: (convId: string) => void;
  onAddMember?: (userId: string) => void | Promise<void>;
  onRemoveMember?: (userId: string) => void | Promise<void>;
  onSetRole?: (userId: string, role: GroupRole) => void | Promise<void>;
  onUpdateSettings?: (patch: { name?: string; description?: string; onlyAdminsPost?: boolean }) => Promise<boolean>;
}

type GroupTab = 'overview' | 'members' | 'files' | 'settings' | 'security';
const inputClass =
  'w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] p-2.5 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60';

export const GroupSpaceView: React.FC<GroupSpaceViewProps> = ({
  group,
  members,
  currentUserId,
  availableUsersToAdd = [],
  messages,
  onLeaveGroup,
  onOpenChat,
  onAddMember,
  onRemoveMember,
  onSetRole,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<GroupTab>('overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [name, setName] = useState(group.title);
  const [description, setDescription] = useState(group.groupMeta?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(group.title);
    setDescription(group.groupMeta?.description ?? '');
  }, [group.id, group.title, group.groupMeta?.description]);

  const roles = group.groupMeta?.roles;
  const rolesAvailable = !!roles;
  const roleOf = (id: string): GroupRole | undefined => (roles ? roles[id] ?? 'member' : undefined);
  const myRole = roleOf(currentUserId);
  const attachments = messages.flatMap((m) => m.attachments || []);

  // Before migration 013 there are no roles: keep the old behaviour of "everyone can manage".
  const mayAdd = rolesAvailable ? canAddMembers(myRole) : true;
  const mayEdit = rolesAvailable && canEditGroup(myRole);

  const tabs: { key: GroupTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: `Members (${members.length})` },
    { key: 'files', label: `Files (${attachments.length})` },
    ...(mayEdit ? [{ key: 'settings' as const, label: 'Settings' }] : []),
    { key: 'security', label: 'Encryption' },
  ];

  const saveSettings = async () => {
    if (!onUpdateSettings) return;
    setSaving(true);
    setSaved(false);
    const patch: { name?: string; description?: string } = {};
    if (name.trim() && name.trim() !== group.title) patch.name = name.trim();
    if (description.trim() !== (group.groupMeta?.description ?? '')) patch.description = description;
    const ok = Object.keys(patch).length === 0 ? true : await onUpdateSettings(patch);
    setSaving(false);
    setSaved(ok);
  };

  return (
    <div className="flex-1 bg-[var(--canvas-bg)] flex flex-col h-full overflow-hidden p-4 sm:p-8 gap-6 font-sans max-w-5xl mx-auto w-full">
      <div className="panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar name={group.title} size="lg" />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{group.title}</h2>
              {myRole && <Badge tone={myRole === 'member' ? 'neutral' : 'accent'}>{ROLE_LABEL[myRole]}</Badge>}
              {group.groupMeta?.onlyAdminsPost && <Badge tone="warning">Admins post only</Badge>}
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {group.groupMeta?.memberCount || members.length} members
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={() => onOpenChat(group.id)}>
            Open chat
          </Button>
          {onLeaveGroup && (
            <Button variant="danger" size="sm" onClick={() => setConfirmLeave(true)}>
              Leave group
            </Button>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Group sections" className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl shrink-0 transition-colors ${
              activeTab === t.key ? 'bg-[var(--surface-2)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" role="tabpanel">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="panel flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">About</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {group.groupMeta?.description || 'No description yet.'}
              </p>
            </div>
            <div className="panel flex flex-col gap-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Recent activity</h3>
              {messages.length === 0 ? (
                <span className="text-[var(--text-muted)]">No activity yet.</span>
              ) : (
                messages.filter((m) => !m.threadRootId).slice(-3).map((m) => (
                  <div key={m.id} className="p-3 bg-[var(--surface-2)] rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--text-primary)]">{m.senderName}</span>
                      <span className="block text-[var(--text-secondary)] truncate">{m.content}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">{m.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="flex flex-col gap-4 text-xs">
            {onAddMember && mayAdd && (
              <div className="flex flex-col gap-2">
                {!showAddMember ? (
                  <Button size="sm" variant="secondary" className="self-start" onClick={() => setShowAddMember(true)}>
                    + Add member
                  </Button>
                ) : (
                  <div className="p-3 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl flex flex-col gap-1">
                    {availableUsersToAdd.length === 0 ? (
                      <span className="text-[var(--text-muted)] py-2">Everyone discoverable is already in this group.</span>
                    ) : (
                      availableUsersToAdd.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          disabled={pendingMemberId === u.id}
                          onClick={async () => {
                            setPendingMemberId(u.id);
                            await onAddMember(u.id);
                            setPendingMemberId(null);
                          }}
                          className="flex items-center justify-between p-2 hover:bg-[var(--surface-2)] rounded-lg text-left disabled:opacity-50"
                        >
                          <span className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                            <Avatar name={u.name} src={u.avatarUrl} size="xs" />
                            {u.name}
                          </span>
                          <span className="text-[var(--accent-text)] text-[10px] font-semibold">{pendingMemberId === u.id ? 'Adding…' : 'Add'}</span>
                        </button>
                      ))
                    )}
                    <button type="button" onClick={() => setShowAddMember(false)} className="self-end text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] pt-1">
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((m) => {
                const role = roleOf(m.id);
                const isSelf = m.id === currentUserId;
                const removable = rolesAvailable ? canRemoveMember(myRole, role, isSelf) && !isSelf : !!onRemoveMember && !isSelf;
                const canPromote = rolesAvailable && !!onSetRole && canChangeRole(myRole, role, 'admin', isSelf);
                return (
                  <li key={m.id} className="p-4 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={m.name} src={m.avatarUrl} size="sm" presence={m.presence ?? 'offline'} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[var(--text-primary)] truncate">
                          {m.name}
                          {isSelf ? ' (you)' : ''}
                        </span>
                        {role && <span className="text-[10px] text-[var(--text-muted)]">{ROLE_LABEL[role]}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canPromote && role === 'member' && (
                        <Button size="sm" variant="tertiary" onClick={() => onSetRole?.(m.id, 'admin')}>
                          Make admin
                        </Button>
                      )}
                      {canPromote && role === 'admin' && (
                        <>
                          <Button size="sm" variant="tertiary" onClick={() => onSetRole?.(m.id, 'member')}>
                            Remove admin
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onSetRole?.(m.id, 'owner')} title="Transfer ownership to this person">
                            Make owner
                          </Button>
                        </>
                      )}
                      {removable && onRemoveMember && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={pendingMemberId === m.id}
                          onClick={async () => {
                            setPendingMemberId(m.id);
                            await onRemoveMember(m.id);
                            setPendingMemberId(null);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {!rolesAvailable && (
              <p className="text-[11px] text-[var(--text-muted)]">{technicalNote('Group roles turn on after the latest database update (migration 013) is applied.', 'Group roles are not available yet.')}</p>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex flex-col gap-2 text-xs">
            {attachments.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)]">No files shared in this group yet.</div>
            ) : (
              attachments.map((att) => (
                <div key={att.id} className="p-3.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-secondary)]">
                    <IconFile className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[var(--text-primary)] truncate">{att.fileName}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{att.fileSize} · encrypted</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && mayEdit && (
          <div className="panel flex flex-col gap-4 max-w-xl">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="grp-name" className="text-xs font-semibold text-[var(--text-primary)]">Group name</label>
              <input id="grp-name" className={inputClass} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="grp-desc" className="text-xs font-semibold text-[var(--text-primary)]">
                Description <span className="font-normal text-[var(--text-muted)]">({description.length}/500)</span>
              </label>
              <textarea id="grp-desc" rows={3} className={`${inputClass} resize-none`} value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="primary" loading={saving} onClick={saveSettings} disabled={!name.trim()}>
                Save changes
              </Button>
              {saved && <span role="status" className="text-xs text-[var(--accent-text)]">Saved</span>}
            </div>
            <SettingRow title="Only admins can post" description="Members can still read and react. Enforced by the database, not just the app.">
              <Switch
                label="Only admins can post"
                checked={!!group.groupMeta?.onlyAdminsPost}
                onChange={(v) => void onUpdateSettings?.({ onlyAdminsPost: v })}
              />
            </SettingRow>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="panel flex flex-col gap-3">
              <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <IconShield className="w-4 h-4 text-[var(--accent-text)]" />
                How this group is encrypted
              </span>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Messages are encrypted with a group key that is shared with each member&apos;s device. When someone leaves or is removed, an admin&apos;s device
                creates a new key, so the person who left cannot read new messages. Older messages they already had stay readable to them, and the app does
                not provide forward secrecy.
              </p>
            </div>
          </div>
        )}
      </div>

      <Dialog
        isOpen={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave this group?"
        footerAction={
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              setConfirmLeave(false);
              await onLeaveGroup?.(group.id);
            }}
          >
            Leave group
          </Button>
        }
      >
        <p className="text-[var(--text-secondary)]">
          You will stop receiving messages from {group.title}.
          {myRole === 'owner' ? ' Ownership passes to the longest-serving admin (or member).' : ''}
        </p>
      </Dialog>
    </div>
  );
};

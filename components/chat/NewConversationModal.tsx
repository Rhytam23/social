'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { UserItem } from '../../types/ui';
import { IconSearch, IconUsers, IconUser, IconCheck } from '../ui/icons';

export interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserItem[];
  currentUserId: string;
  onStartDirectChat: (user: UserItem) => void;
  onCreateGroupChat: (groupName: string, memberIds: string[]) => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onStartDirectChat,
  onCreateGroupChat,
}) => {
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<UserItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: UserItem[] = data.map((p: any) => ({
              id: p.id,
              name: p.display_name || p.username || 'Anonymous User',
              username: p.username,
              email: p.email,
              phoneNumber: p.phone_number,
              registrationId: Math.abs(parseInt(p.id.replace(/-/g, '').slice(0, 8), 16) % 90000) + 10000,
              role: p.is_admin ? 'admin' : 'member',
              deviceCount: 1,
              joinedAt: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active',
              identityFingerprint: (p.id.replace(/-/g, '').slice(0, 16) + '...').toUpperCase(),
              presence: 'online',
            }));
            setRemoteUsers(mapped);
          } else {
            setRemoteUsers([]);
          }
        }
      } catch {
        // Fallback to local store users
      } finally {
        setIsSearching(false);
      }
    };

    const timeout = setTimeout(fetchUsers, 200);
    return () => clearTimeout(timeout);
  }, [isOpen, searchQuery]);

  // Merge remote and local eligible users
  const baseUsers = remoteUsers.length > 0 ? remoteUsers : users;
  const eligibleUsers = baseUsers.filter((u) => u.id !== currentUserId);
  const filteredUsers = eligibleUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.includes(q)) ||
      u.registrationId.toString().includes(q)
    );
  });

  const toggleSelectMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleStartDirect = (u: UserItem) => {
    onStartDirectChat(u);
    onClose();
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMemberIds.length === 0) return;
    onCreateGroupChat(groupName.trim(), selectedMemberIds);
    setGroupName('');
    setSelectedMemberIds([]);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={tab === 'direct' ? 'New Direct Message' : 'Create New Group'}
      footerAction={
        tab === 'group' ? (
          <Button
            variant="primary"
            size="sm"
            disabled={!groupName.trim() || selectedMemberIds.length === 0}
            onClick={handleCreateGroup}
          >
            Create Group ({selectedMemberIds.length + 1} members)
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 font-sans">
        {/* Tab switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('direct')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === 'direct'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IconUser className="w-3.5 h-3.5" />
            Direct Message
          </button>
          <button
            type="button"
            onClick={() => setTab('group')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === 'group'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IconUsers className="w-3.5 h-3.5" />
            New Group Space
          </button>
        </div>

        {tab === 'group' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Group Name</label>
            <Input
              placeholder="e.g. Core Engineering, Security Team..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        )}

        {/* Search bar */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={
              tab === 'direct'
                ? 'Search by name, @username, email, or phone...'
                : 'Search participants by name or email...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* User list */}
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              {isSearching ? 'Searching...' : `No registered contacts found matching "${searchQuery}"`}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedMemberIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => (tab === 'direct' ? handleStartDirect(u) : toggleSelectMember(u.id))}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-950/40 border border-emerald-500/30'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100">{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {u.phoneNumber || u.email || `@${u.username || 'user'}`} • Reg ID: #{u.registrationId}
                      </span>
                    </div>
                  </div>

                  {tab === 'group' && (
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {isSelected && <IconCheck className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  {tab === 'direct' && (
                    <Button variant="ghost" size="sm">
                      Chat
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Dialog>
  );
};

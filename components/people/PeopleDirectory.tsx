import React, { useState } from 'react';
import { UserItem } from '../../types/ui';
import { IconPlus, IconSearch } from '../ui/icons';

export interface PeopleDirectoryProps {
  users: UserItem[];
  onStartDirectChat: (user: UserItem) => void;
  onCreateGroupWithUser?: (user: UserItem) => void;
}

export const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({
  users,
  onStartDirectChat,
  onCreateGroupWithUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.registrationId.toString().includes(searchQuery)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex-1 bg-[var(--canvas-bg)] flex flex-col h-full overflow-hidden p-6 sm:p-8 gap-6 font-sans max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
            People & Contacts
          </h2>
          <p className="text-xs text-slate-400">
            Verified members on your private Signal-encrypted network.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search network members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
          />
        </div>
      </div>

      {/* People Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-slate-500">
              No network members match your search query.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-xs group"
              >
                {/* Information */}
                <div className="flex items-center gap-3.5 truncate">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-100 shadow-xs">
                      {getInitials(u.name)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                  </div>

                  <div className="flex flex-col truncate gap-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100 truncate font-sans">
                        {u.name}
                      </h3>
                      {u.role === 'admin' && (
                        <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Reg ID: #{u.registrationId} • {u.deviceCount} {u.deviceCount === 1 ? 'device' : 'devices'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onStartDirectChat(u)}
                    className="py-2 px-3.5 bg-slate-100 hover:bg-white text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-xs"
                  >
                    Start chat
                  </button>
                  {onCreateGroupWithUser && (
                    <button
                      onClick={() => onCreateGroupWithUser(u)}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
                      title="Create group space"
                    >
                      <IconPlus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

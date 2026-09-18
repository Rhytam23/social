import React from 'react';
import { IconLock, IconSearch, IconShield } from '../ui/icons';

export interface HeaderProps {
  currentUserName: string;
  currentUserRegistrationId: number;
  userRole: 'admin' | 'member';
  onOpenMobileNav: () => void;
  onOpenMobileInspector?: () => void;
  onGlobalSearchTrigger: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUserName,
  currentUserRegistrationId,
  userRole,
  onOpenMobileNav,
  onOpenMobileInspector,
  onGlobalSearchTrigger,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-14 bg-[var(--surface-1)] border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between shrink-0 font-sans z-20">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="p-1.5 md:hidden text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
            <IconLock className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-100">
            Private Chat
          </span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
            Signal E2EE
          </span>
        </div>
      </div>

      {/* Global Search Bar Trigger */}
      <div className="hidden sm:flex items-center">
        <button
          onClick={onGlobalSearchTrigger}
          className="flex items-center gap-6 bg-slate-950/50 border border-slate-800 px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all rounded-xl shadow-xs"
        >
          <div className="flex items-center gap-2">
            <IconSearch className="w-3.5 h-3.5 text-slate-400" />
            <span>Search people or messages...</span>
          </div>
          <kbd className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* User Identity Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 bg-slate-950/30 p-1 pl-1.5 pr-3 rounded-full border border-slate-800/80">
          <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {getInitials(currentUserName)}
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-slate-200 leading-tight">{currentUserName}</span>
            <span className="text-[10px] font-mono text-slate-400">
              #{currentUserRegistrationId}
            </span>
          </div>

          {userRole === 'admin' && (
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold uppercase">
              Admin
            </span>
          )}
        </div>

        {onOpenMobileInspector && (
          <button
            className="p-1.5 lg:hidden text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            onClick={onOpenMobileInspector}
            aria-label="Open details"
          >
            <IconShield className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};

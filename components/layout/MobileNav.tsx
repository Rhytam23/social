import React from 'react';
import { ViewCategory } from '../../types/ui';
import { IconLock, IconSearch, IconSettings, IconUsers } from '../ui/icons';
import { CountBadge } from '../ui/primitives';

export interface MobileNavProps {
  activeCategory: ViewCategory;
  onSelectCategory: (cat: ViewCategory) => void;
  unreadTotal: number;
  userRole: 'admin' | 'member';
  onOpenSearch?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeCategory, onSelectCategory, unreadTotal, onOpenSearch }) => {
  const navItems: { key: ViewCategory; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'chats', label: 'Chats', icon: <IconLock className="w-5 h-5" />, badge: unreadTotal },
    { key: 'groups', label: 'Groups', icon: <IconUsers className="w-5 h-5" /> },
    { key: 'people', label: 'People', icon: <IconUsers className="w-5 h-5" /> },
    { key: 'settings', label: 'Settings', icon: <IconSettings className="w-5 h-5" /> },
  ];

  const itemClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors relative ${
      isActive ? 'text-[var(--accent-text)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 left-0 right-0 min-h-16 bg-[var(--surface-1)] border-t border-[var(--border-subtle)] flex items-center justify-around z-30 font-sans px-2 safe-bottom"
    >
      {navItems.map((item) => {
        const isActive = activeCategory === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelectCategory(item.key)}
            aria-current={isActive ? 'page' : undefined}
            className={itemClass(isActive)}
          >
            <span className="relative">
              {item.icon}
              {item.badge ? (
                <span className="absolute -top-1.5 -right-3">
                  <CountBadge count={item.badge} />
                </span>
              ) : null}
            </span>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
      {onOpenSearch && (
        <button onClick={onOpenSearch} className={itemClass(false)} aria-label="Search">
          <IconSearch className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Search</span>
        </button>
      )}
    </nav>
  );
};

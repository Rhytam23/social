import React from 'react';
import { ViewCategory } from '../../types/ui';
import { IconLock, IconShield, IconUser, IconUsers } from '../ui/icons';

export interface MobileNavProps {
  activeCategory: ViewCategory;
  onSelectCategory: (cat: ViewCategory) => void;
  unreadTotal: number;
  userRole: 'admin' | 'member';
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeCategory,
  onSelectCategory,
  unreadTotal,
}) => {
  const navItems: { key: ViewCategory; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: 'chats',
      label: 'Chats',
      icon: <IconLock className="w-5 h-5" />,
      badge: unreadTotal,
    },
    {
      key: 'groups',
      label: 'Groups',
      icon: <IconUsers className="w-5 h-5" />,
    },
    {
      key: 'people',
      label: 'People',
      icon: <IconUser className="w-5 h-5" />,
    },
    {
      key: 'settings',
      label: 'Security',
      icon: <IconShield className="w-5 h-5" />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around z-30 font-sans px-2">
      {navItems.map((item) => {
        const isActive = activeCategory === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelectCategory(item.key)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors relative ${
              isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950 flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

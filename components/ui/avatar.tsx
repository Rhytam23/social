import React from 'react';
import type { UserPresence } from '../../types/ui';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-24 h-24 text-3xl',
} as const;

const DOT_SIZES = { xs: 'w-2 h-2', sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-3.5 h-3.5', xl: 'w-5 h-5' } as const;

export const PRESENCE_COLOR: Record<UserPresence | 'meeting', string> = {
  online: 'var(--presence-online)',
  away: 'var(--presence-away)',
  dnd: 'var(--presence-dnd)',
  meeting: 'var(--presence-meeting)',
  offline: 'var(--presence-offline)',
};

export const PRESENCE_LABEL: Record<UserPresence, string> = {
  online: 'Active',
  away: 'Away',
  dnd: 'Do not disturb',
  meeting: 'In a meeting',
  offline: 'Offline',
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZES;
  presence?: UserPresence;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', presence, className = '' }) => (
  <span className={`relative inline-flex shrink-0 ${className}`}>
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${SIZES[size]} rounded-full object-cover bg-[var(--surface-2)]`} />
    ) : (
      <span
        aria-hidden="true"
        className={`${SIZES[size]} rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold flex items-center justify-center select-none`}
      >
        {initialsOf(name)}
      </span>
    )}
    {presence && (
      <span
        role="img"
        aria-label={PRESENCE_LABEL[presence]}
        className={`absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--surface-1)] ${DOT_SIZES[size]}`}
        style={{ background: PRESENCE_COLOR[presence] }}
      />
    )}
  </span>
);

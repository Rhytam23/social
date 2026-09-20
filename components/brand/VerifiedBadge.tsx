import React from 'react';
import { SITE_NAME } from '../../lib/site';

/**
 * The mark of a platform admin: a filled shield with a check, in the accent colour. It is drawn only from
 * the server-side flag (profiles.is_admin), never from anything a person types, and names that imitate it
 * are refused by the database (migration 025, guard_profile_names). Group admins do not get it: they have a
 * plain role label.
 */
export const VERIFIED_LABEL = `Verified administrator of ${SITE_NAME}`;

export function VerifiedBadge({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <span title={VERIFIED_LABEL} className="inline-flex shrink-0 text-[var(--accent-text)]">
      <svg className={className} viewBox="0 0 24 24" role="img" aria-label={VERIFIED_LABEL}>
        <path fill="currentColor" d="M12 2 4 5v6c0 5.05 3.4 9.25 8 10.5 4.6-1.25 8-5.45 8-10.5V5l-8-3Z" />
        <path fill="none" stroke="var(--canvas-bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
    </span>
  );
}

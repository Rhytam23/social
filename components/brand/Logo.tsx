import React from 'react';
import { SITE_NAME } from '../../lib/site';

/**
 * The Nook mark: a speech bubble with a keyhole cut out of it. One colour (currentColor), drawn on a 32 unit
 * grid so it stays legible at 16 px. The same paths are used for the favicon, the app icon and the preview
 * image (app/icon.svg, app/apple-icon.tsx, app/opengraph-image.tsx): change all of them together.
 *
 * Rules: keep clear space of one quarter of the mark's height around it, do not go below 16 px, do not
 * recolour it outside the palette in app/globals.css, do not stretch, rotate or add effects.
 */
export const MARK_BUBBLE = 'M10 4H22A7 7 0 0 1 29 11V17A7 7 0 0 1 22 24H15L9 29V24H10A7 7 0 0 1 3 17V11A7 7 0 0 1 10 4Z';
export const MARK_KEYHOLE_HEAD = 'M16 10.2a2.9 2.9 0 1 1 0 5.8a2.9 2.9 0 0 1 0-5.8Z';
export const MARK_KEYHOLE_SLOT = 'M14.6 15.6h2.8l.9 5.2h-4.6Z';

export function LogoMark({ className = 'w-7 h-7', title }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="currentColor">
      <path fillRule="evenodd" d={`${MARK_BUBBLE}${MARK_KEYHOLE_HEAD}${MARK_KEYHOLE_SLOT}`} />
    </svg>
  );
}

/** Mark plus the lowercase wordmark. The wordmark is text in the product font so it stays sharp and translatable. */
export function Logo({ className = '', markClassName = 'w-7 h-7', wordmark = true }: { className?: string; markClassName?: string; wordmark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={`${markClassName} text-[var(--accent-text)]`} title={wordmark ? undefined : SITE_NAME} />
      {wordmark && <span className="text-[1.05rem] font-semibold leading-none tracking-[-0.02em] text-[var(--text-primary)]">nook</span>}
    </span>
  );
}

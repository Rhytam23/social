'use client';

import { Analytics } from '@vercel/analytics/next';
import { scrubAnalyticsEvent } from '../../lib/analytics';

/**
 * Vercel Web Analytics: anonymous page-view counts, no cookies, no message content.
 * Runs only in production builds served by Vercel (its script does not exist anywhere else, and
 * loading it would only produce console errors; development also loads a debug script from another
 * origin that the Content-Security-Policy blocks). It only ever sees the path, never the query string
 * or fragment (see lib/analytics.ts). It needs Analytics switched on in the Vercel dashboard.
 * `enabled` is decided on the server (see app/layout.tsx).
 */
export function WebAnalytics({ enabled }: { enabled: boolean }) {
  if (!enabled || process.env.NODE_ENV !== 'production') return null;
  return <Analytics beforeSend={scrubAnalyticsEvent} />;
}

'use client';

import { Analytics } from '@vercel/analytics/next';
import { scrubAnalyticsEvent } from '../../lib/analytics';

/**
 * Vercel Web Analytics: anonymous page-view counts, no cookies, no message content.
 * Runs only in production builds (development would load a debug script from another origin that
 * the Content-Security-Policy blocks), and only ever sees the path, never the query string or
 * fragment (see lib/analytics.ts). It needs Analytics switched on in the Vercel dashboard.
 */
export function WebAnalytics() {
  if (process.env.NODE_ENV !== 'production') return null;
  return <Analytics beforeSend={scrubAnalyticsEvent} />;
}

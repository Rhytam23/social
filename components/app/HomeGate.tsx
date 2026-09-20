'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { isDemoModeAllowed, isSupabaseConfigured } from '../../lib/supabase/env';

function Loading() {
  return (
    <div role="status" className="fixed inset-0 z-[60] bg-[var(--canvas-bg)] flex flex-col items-center justify-center gap-4 font-sans">
      <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      <span className="text-xs font-semibold text-[var(--text-secondary)]">Loading your conversations</span>
    </div>
  );
}

// The chat application (crypto, realtime, every screen) is its own chunk. Visitors without a session never download it.
const AppRoot = dynamic(() => import('./AppRoot').then((m) => m.AppRoot), { ssr: false, loading: () => <Loading /> });

/**
 * Decides what the home page is. The landing page is rendered on the server, so it is real HTML for search
 * engines and loads instantly. The application only loads when there is reason to expect a session: a sign-in
 * cookie (the pre-paint script in lib/ui/themeScript.ts sets data-session), an invite link, or local demo mode.
 * A stale cookie is harmless: the application checks the session with the server and falls back to the landing page.
 */
export function HomeGate({ landing }: { landing: React.ReactNode }) {
  const [loadApp, setLoadApp] = useState(false);

  useEffect(() => {
    const hasSession = document.documentElement.getAttribute('data-session') === '1';
    const hasInvite = new URLSearchParams(window.location.search).has('join');
    const isDemo = !isSupabaseConfigured() && isDemoModeAllowed();
    if (hasSession || hasInvite || isDemo) setLoadApp(true);
  }, []);

  if (!loadApp) return <>{landing}</>;
  return <AppRoot landing={landing} />;
}

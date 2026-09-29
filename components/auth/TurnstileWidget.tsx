'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { TURNSTILE_ORIGIN, TURNSTILE_SITE_KEY, captchaEnabled } from '../../lib/captcha';

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileHandle {
  reset: () => void;
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `${TURNSTILE_ORIGIN}/turnstile/v0/api.js?render=explicit`;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('The security check could not be loaded.'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * The bot check. `onToken` receives a one-time token (or null when it expires or fails). A token can be
 * used once, so the form calls reset() after each attempt.
 */
export const TurnstileWidget = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void; onUnavailable?: () => void }>(function TurnstileWidget(
  { onToken, onUnavailable },
  ref
) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    if (!captchaEnabled() || !box.current) return;
    let cancelled = false;
    const el = box.current;
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetId.current = window.turnstile.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'auto',
          callback: (t: string) => onToken(t),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        });
      })
      .catch(() => onUnavailable?.());
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
    // The callbacks are stable enough for a widget that is created once per form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={box} className="min-h-[65px]" />;
});

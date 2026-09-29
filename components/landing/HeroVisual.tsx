'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { readSignals, shouldRender3D } from './capability';

// three.js is its own chunk. It is requested only after the page has loaded, only on computers.
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

/**
 * The still picture is part of the server HTML on computers (no layout shift, and a poster while the scene
 * loads): two devices, a lock between them, readable lines on the left and scrambled ones after the lock.
 * It is abstract on purpose. The 3D scene fades in over it when the device can take it.
 */
function Poster() {
  const line = 'fill-[var(--text-secondary)]';
  return (
    <svg viewBox="0 0 500 400" className="absolute inset-0 w-full h-full" role="img" aria-label="A message is readable on one device, scrambled after it passes a lock, and readable again on the other device.">
      <g>
        <rect x="34" y="96" width="128" height="208" rx="14" className="fill-[var(--surface-1)] stroke-[var(--border-strong)]" strokeWidth="1.5" />
        {[128, 152, 176, 200, 224].map((y, i) => (
          <rect key={y} x="52" y={y} width={i % 2 ? 70 : 92} height="8" rx="4" className={line} opacity="0.75" />
        ))}
      </g>
      <g>
        <rect x="338" y="96" width="128" height="208" rx="14" className="fill-[var(--surface-1)] stroke-[var(--border-strong)]" strokeWidth="1.5" />
        {[128, 152, 176, 200, 224].map((y, i) => (
          <rect key={y} x="356" y={y} width={i % 2 ? 70 : 92} height="8" rx="4" className={line} opacity="0.75" />
        ))}
      </g>
      <g>
        {[0, 1, 2].map((i) => (
          <rect key={`p${i}`} x={182 + i * 14} y={186 + (i % 2) * 14} width="10" height="8" rx="2" className="fill-[var(--text-primary)]" opacity="0.8" />
        ))}
        {[0, 1, 2].map((i) => (
          <rect key={`c${i}`} x={286 + i * 14} y={192 - (i % 2) * 14} width="10" height="8" rx="2" transform={`rotate(${i * 25 - 20} ${291 + i * 14} 196)`} className="fill-[var(--accent-primary)]" opacity="0.9" />
        ))}
        <path d="M235 196v-14a15 15 0 0 1 30 0v14" fill="none" className="stroke-[var(--accent-primary)]" strokeWidth="5" strokeLinecap="round" />
        <rect x="225" y="196" width="50" height="40" rx="9" className="fill-[var(--accent-primary)]" />
      </g>
    </svg>
  );
}

export function HeroVisual() {
  const [show3D, setShow3D] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // After the page is idle: the scene must never compete with the first paint.
    const start = () => setShow3D(shouldRender3D(readSignals()));
    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = setTimeout(start, 800);
    return () => clearTimeout(handle);
  }, []);

  const fail = useCallback(() => {
    setShow3D(false);
    setReady(false);
  }, []);

  return (
    <div aria-hidden={show3D && ready ? true : undefined} className="hidden lg:block relative w-full aspect-[5/4] max-h-[480px]">
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}>
        <Poster />
      </div>
      {show3D && <HeroScene onReady={() => setReady(true)} onError={fail} />}
    </div>
  );
}

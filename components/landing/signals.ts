'use client';

import { useSyncExternalStore } from 'react';
import type { RenderSignals } from './sceneMath';

const QUERY = '(prefers-reduced-motion: reduce)';

/** True when the OS asks for less motion. Updates live if the setting changes. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** What this browser and device can comfortably do. Call in an effect, never during render. */
export function readRenderSignals(reducedMotion: boolean): RenderSignals {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    reducedMotion,
    webgl: hasWebGL(),
    saveData: nav.connection?.saveData === true,
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
  };
}

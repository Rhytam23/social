import { CHAPTER_COUNT, type Pose } from './sceneContent';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Ease in and out, so cards settle into each chapter instead of sliding at constant speed. */
export const smoothstep = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/** Which chapter a scroll position (0 to 1) belongs to. */
export function chapterAt(progress: number): number {
  return Math.min(CHAPTER_COUNT - 1, Math.floor(clamp01(progress) * CHAPTER_COUNT));
}

/** The pose of one card at a scroll position, blended between two chapters. */
export function poseAt(poses: Pose[], progress: number): Pose {
  const pos = clamp01(progress) * (CHAPTER_COUNT - 1);
  const i = Math.min(CHAPTER_COUNT - 2, Math.floor(pos));
  // Hold each chapter for the first part of its span, then move.
  const t = smoothstep((pos - i - 0.25) / 0.6);
  const a = poses[i];
  const b = poses[i + 1];
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    p: [mix(a.p[0], b.p[0]), mix(a.p[1], b.p[1]), mix(a.p[2], b.p[2])],
    r: [mix(a.r[0], b.r[0]), mix(a.r[1], b.r[1]), mix(a.r[2], b.r[2])],
    s: mix(a.s, b.s),
    o: mix(a.o, b.o),
  };
}

export interface RenderSignals {
  reducedMotion: boolean;
  webgl: boolean;
  saveData?: boolean;
  deviceMemory?: number;
  cores?: number;
}

/**
 * Whether to draw the WebGL scene. It is an enhancement: anyone who asks for
 * less motion or data, or whose device is weak, gets the same story as stills.
 */
export function shouldRender3D(s: RenderSignals): boolean {
  if (s.reducedMotion || !s.webgl || s.saveData) return false;
  if (s.deviceMemory !== undefined && s.deviceMemory <= 2) return false;
  if (s.cores !== undefined && s.cores <= 2) return false;
  return true;
}

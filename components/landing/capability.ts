/**
 * Whether the landing page may show its 3D hero. It is for computers only: a wide screen and a mouse. Phones
 * and tablets, people who ask for reduced motion or a data saver, and weak devices get the plain page, and
 * never download the 3D code. Pure so it can be tested; the browser values are gathered by readSignals().
 */

export interface RenderSignals {
  width: number;
  finePointer: boolean;
  canHover: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** navigator.deviceMemory in GB, when the browser reports it. */
  memoryGb: number | undefined;
  cores: number | undefined;
  webgl: boolean;
}

const MIN_WIDTH_PX = 1024;

export function shouldRender3D(s: RenderSignals): boolean {
  if (s.width < MIN_WIDTH_PX) return false;
  if (!s.finePointer || !s.canHover) return false; // touch devices, including large tablets
  if (s.reducedMotion || s.saveData) return false;
  if (!s.webgl) return false;
  if (s.memoryGb !== undefined && s.memoryGb < 4) return false;
  if (s.cores !== undefined && s.cores < 4) return false;
  return true;
}

export function readSignals(): RenderSignals {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  let webgl = false;
  try {
    const canvas = document.createElement('canvas');
    webgl = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webgl = false;
  }
  return {
    width: window.innerWidth,
    finePointer: window.matchMedia('(pointer: fine)').matches,
    canHover: window.matchMedia('(hover: hover)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: nav.connection?.saveData === true,
    memoryGb: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
    webgl,
  };
}

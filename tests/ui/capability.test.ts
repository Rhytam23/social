import { describe, it, expect } from 'vitest';
import { shouldRender3D, type RenderSignals } from '../../components/landing/capability';

const desktop: RenderSignals = { width: 1440, finePointer: true, canHover: true, reducedMotion: false, saveData: false, memoryGb: 8, cores: 8, webgl: true };

describe('the 3D hero is for computers only', () => {
  it('runs on a capable desktop', () => {
    expect(shouldRender3D(desktop)).toBe(true);
  });

  it('never runs on phones or tablets: narrow screens', () => {
    expect(shouldRender3D({ ...desktop, width: 390 })).toBe(false);
    expect(shouldRender3D({ ...desktop, width: 1023 })).toBe(false);
    expect(shouldRender3D({ ...desktop, width: 1024 })).toBe(true);
  });

  it('never runs on touch devices, even large ones (no mouse)', () => {
    expect(shouldRender3D({ ...desktop, finePointer: false })).toBe(false);
    expect(shouldRender3D({ ...desktop, canHover: false })).toBe(false);
    expect(shouldRender3D({ ...desktop, width: 1366, finePointer: false, canHover: false })).toBe(false);
  });

  it('respects reduced motion and data saver', () => {
    expect(shouldRender3D({ ...desktop, reducedMotion: true })).toBe(false);
    expect(shouldRender3D({ ...desktop, saveData: true })).toBe(false);
  });

  it('needs WebGL and a machine that can take it', () => {
    expect(shouldRender3D({ ...desktop, webgl: false })).toBe(false);
    expect(shouldRender3D({ ...desktop, memoryGb: 2 })).toBe(false);
    expect(shouldRender3D({ ...desktop, cores: 2 })).toBe(false);
  });

  it('does not block when the browser does not report memory or cores', () => {
    expect(shouldRender3D({ ...desktop, memoryGb: undefined, cores: undefined })).toBe(true);
  });
});

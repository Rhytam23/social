'use client';

import React, { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  TorusGeometry,
  WebGLRenderer,
} from 'three';

/**
 * The 3D hero, for computers only (HeroVisual decides). It shows how a message travels: readable blocks
 * leave one device, are scrambled as they pass the lock, and become readable again on the other device.
 * Abstract shapes only: no people, chats or screenshots. It is careful with the machine: it renders only
 * while visible, caps the pixel ratio, measures its own frame time and hands over to the still picture if
 * it cannot keep up (or if WebGL is lost).
 */

const BLOCKS = 16;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function cssColor(name: string, fallback: string): Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  try {
    return new Color(value || fallback);
  } catch {
    return new Color(fallback);
  }
}

export default function HeroScene({ onReady, onError }: { onReady: () => void; onError: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      onError();
      return;
    }

    let disposed = false;
    let raf = 0;
    let running = false;
    let visible = true;
    let reportedReady = false;
    let pixelRatioCap = 1.5;
    let frames = 0;
    let frameSum = 0;
    let last = 0;

    const canvas = renderer.domElement;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 60);
    camera.position.set(0, 0, 12.6);
    scene.add(new AmbientLight(0xffffff, 1.15));
    const key = new DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 5, 6);
    scene.add(key);

    const colors = {
      surface: cssColor('--surface-2', '#181b20'),
      line: cssColor('--text-secondary', '#9aa1ad'),
      accent: cssColor('--accent-primary', '#4ba3d3'),
      plain: cssColor('--text-primary', '#e9ebef'),
    };
    const frameMat = new MeshStandardMaterial({ color: colors.surface, roughness: 0.7, metalness: 0.05 });
    const lineMat = new MeshStandardMaterial({ color: colors.line, roughness: 0.8 });
    const accentMat = new MeshStandardMaterial({ color: colors.accent, roughness: 0.45, metalness: 0.2 });
    const blockMat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });

    const geometries: Array<{ dispose(): void }> = [];
    const geo = <T extends { dispose(): void }>(g: T): T => (geometries.push(g), g);

    const device = (x: number, rotationY: number) => {
      const g = new Group();
      g.add(new Mesh(geo(new BoxGeometry(2.3, 3.5, 0.14)), frameMat));
      for (let i = 0; i < 5; i++) {
        const w = i % 2 ? 1.2 : 1.6;
        const line = new Mesh(geo(new BoxGeometry(w, 0.1, 0.05)), lineMat);
        line.position.set((w - 1.6) / 2 - 0.05, 0.95 - i * 0.42, 0.1);
        g.add(line);
      }
      g.position.set(x, 0, 0);
      g.rotation.y = rotationY;
      return g;
    };
    scene.add(device(-3.05, 0.38), device(3.05, -0.38));

    const lock = new Group();
    const lockBody = new Mesh(geo(new BoxGeometry(0.95, 0.78, 0.36)), accentMat);
    lockBody.position.y = -0.2;
    const shackle = new Mesh(geo(new TorusGeometry(0.32, 0.075, 12, 28, Math.PI)), accentMat);
    shackle.position.y = 0.2;
    lock.add(lockBody, shackle);
    scene.add(lock);

    const blocks = new InstancedMesh(geo(new BoxGeometry(0.42, 0.16, 0.1)), blockMat, BLOCKS);
    blocks.instanceMatrix.setUsage(DynamicDrawUsage);
    scene.add(blocks);
    const dummy = new Object3D();
    const tint = new Color();

    const applyTheme = () => {
      colors.surface.copy(cssColor('--surface-2', '#181b20'));
      colors.line.copy(cssColor('--text-secondary', '#9aa1ad'));
      colors.accent.copy(cssColor('--accent-primary', '#4ba3d3'));
      colors.plain.copy(cssColor('--text-primary', '#e9ebef'));
      frameMat.color.copy(colors.surface);
      lineMat.color.copy(colors.line);
      accentMat.color.copy(colors.accent);
    };
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const scheme = window.matchMedia('(prefers-color-scheme: light)');
    scheme.addEventListener('change', applyTheme);

    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const teardown = () => {
      if (disposed) return;
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      scheme.removeEventListener('change', applyTheme);
      window.removeEventListener('pointermove', onPointer);
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      geometries.forEach((g) => g.dispose());
      [frameMat, lineMat, accentMat, blockMat].forEach((m) => m.dispose());
      blocks.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };

    const fail = () => {
      teardown();
      onError();
    };
    const onContextLost = (e: Event) => {
      e.preventDefault();
      fail();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const tick = (now: number) => {
      if (disposed || !running) return;
      raf = requestAnimationFrame(tick);

      // Measure our own cost: lower the resolution once, then give up if it is still slow.
      if (last) {
        frameSum += now - last;
        frames++;
        if (frames === 90) {
          const avg = frameSum / frames;
          if (avg > 50 && pixelRatioCap === 1) return fail();
          if (avg > 38 && pixelRatioCap > 1) {
            pixelRatioCap = 1;
            resize();
          }
          frames = 0;
          frameSum = 0;
        }
      }
      last = now;

      const time = now;
      for (let i = 0; i < BLOCKS; i++) {
        const t = (time * 0.00012 + i / BLOCKS) % 1;
        const cipher = smooth(0.4, 0.52, t) * (1 - smooth(0.8, 0.92, t));
        const squash = 1 - 0.35 * Math.exp(-(((t - 0.46) / 0.05) ** 2));
        dummy.position.set(-1.75 + t * 3.5, Math.sin(t * 6.283 + i) * 0.12 + ((i % 4) - 1.5) * 0.3, 0.25 * Math.sin(t * Math.PI));
        dummy.rotation.set(cipher * time * 0.0015 * (1 + (i % 3)), cipher * time * 0.0012 * (1 + (i % 2)), 0);
        dummy.scale.setScalar(squash);
        dummy.updateMatrix();
        blocks.setMatrixAt(i, dummy.matrix);
        blocks.setColorAt(i, tint.copy(colors.plain).lerp(colors.accent, cipher));
      }
      blocks.instanceMatrix.needsUpdate = true;
      if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;

      lock.rotation.y = Math.sin(time * 0.0007) * 0.35;
      lock.position.y = Math.sin(time * 0.0011) * 0.06;

      // Pointer and scroll move the camera a little.
      camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.05;
      camera.position.y += (-pointer.y * 0.35 - Math.min(window.scrollY, 600) * 0.002 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      if (!reportedReady) {
        reportedReady = true;
        onReady();
      }
    };

    const start = () => {
      if (running || disposed || !visible || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    visibility.observe(host);
    const onVisibilityChange = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibilityChange);

    start();
    return teardown;
    // The callbacks are stable in HeroVisual; the scene is created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className="absolute inset-0" />;
}

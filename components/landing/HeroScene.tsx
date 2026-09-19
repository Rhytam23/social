'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CARDS } from './sceneContent';
import { poseAt } from './sceneMath';
import { paintCard } from './paintCards';

export interface HeroSceneProps {
  /** Scroll position through the story, 0 to 1. Written by the page, read every frame. */
  progressRef: React.MutableRefObject<number>;
  /** Pointer position, -1 to 1 on both axes. */
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  onReady: () => void;
  onError: () => void;
}

const DEPTH = 0.08;
const damp = (current: number, target: number, rate: number, dt: number) => current + (target - current) * (1 - Math.exp(-rate * dt));

/**
 * The landing scene: the product's own objects (messages, a profile, a
 * channel list, an envelope that shows what the server really stores)
 * floating in soft light. Plain three.js, loaded only on the landing page.
 */
export default function HeroScene({ progressRef, pointerRef, onReady, onError }: HeroSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      onError();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 1, 0.1, 60);
    camera.position.set(0, 0.6, 9.2);
    camera.lookAt(0, -0.1, 0);

    // Light from above-left, a cool rim from behind, and a little fill. No colour beyond that.
    scene.add(new HemisphereLight(0xb7c4d6, 0x0a0b0d, 0.9));
    scene.add(new AmbientLight(0xffffff, 0.15));
    const key = new DirectionalLight(0xffffff, 2.1);
    key.position.set(-4, 7, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(768, 768);
    key.shadow.bias = -0.0004;
    Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 26 });
    scene.add(key);
    const rim = new PointLight(0x7cc3e8, 14, 22, 2);
    rim.position.set(4, 2, -5);
    scene.add(rim);

    const root = new Group();
    scene.add(root);

    const floor = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ opacity: 0.38 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.1;
    floor.receiveShadow = true;
    root.add(floor);

    const font =
      getComputedStyle(document.documentElement).getPropertyValue('--font-geist-sans').trim() ||
      'ui-sans-serif, system-ui, sans-serif';
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const disposables: Array<{ dispose: () => void }> = [renderer, floor.geometry, floor.material as ShadowMaterial];

    const texture = (canvas: HTMLCanvasElement) => {
      const t = new CanvasTexture(canvas);
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = Math.min(8, maxAniso);
      disposables.push(t);
      return t;
    };

    interface Item {
      group: Group;
      mats: Array<MeshStandardMaterial | MeshBasicMaterial>;
      index: number;
      cur: { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; o: number };
    }
    const items: Item[] = [];

    const build = () => {
      CARDS.forEach((spec, index) => {
        const group = new Group();
        const slabGeo = new RoundedBoxGeometry(spec.w, spec.h, DEPTH, 3, 0.14);
        const slabMat = new MeshStandardMaterial({ color: 0x1b2027, roughness: 0.5, metalness: 0.25, transparent: true });
        const slab = new Mesh(slabGeo, slabMat);
        slab.castShadow = true;
        group.add(slab);

        const faceGeo = new PlaneGeometry(spec.w, spec.h);
        const faceMat = new MeshBasicMaterial({ map: texture(paintCard(spec, font)), transparent: true, toneMapped: false });
        const face = new Mesh(faceGeo, faceMat);
        face.position.z = DEPTH / 2 + 0.002;
        group.add(face);
        const mats: Item['mats'] = [slabMat, faceMat];

        if (spec.kind === 'envelope') {
          const backMat = new MeshBasicMaterial({ map: texture(paintCard(spec, font, true)), transparent: true, toneMapped: false, side: DoubleSide });
          const back = new Mesh(faceGeo, backMat);
          back.position.z = -DEPTH / 2 - 0.002;
          back.rotation.y = Math.PI;
          group.add(back);
          mats.push(backMat);
          disposables.push(backMat);
        }

        disposables.push(slabGeo, slabMat, faceGeo, faceMat);
        const start = spec.poses[0];
        const item: Item = {
          group,
          mats,
          index,
          cur: { x: start.p[0], y: start.p[1], z: start.p[2], rx: start.r[0], ry: start.r[1], rz: start.r[2], s: start.s, o: start.o },
        };
        root.add(group);
        items.push(item);
      });
    };
    build();

    // Fit the scene to the window: to the right of the text on wide screens, above it on phones.
    const layout = { scale: 0.8, x: 1.7, y: 0 };
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const a = w / h;
      if (a >= 1.2) {
        layout.scale = 0.74;
        layout.x = (1.35 * Math.min(a, 1.9)) / 1.78;
        layout.y = 0;
      } else {
        layout.scale = Math.min(0.62, Math.max(0.36, a * 0.9));
        layout.x = 0;
        layout.y = 1.15;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 });
    io.observe(host);

    const rootState = { yaw: 0, pitch: 0, progress: progressRef.current };
    const v = new Vector3();
    let last = performance.now();
    let announced = false;

    // Quality governor: if frames are slow, drop shadows and resolution first, and if that is not
    // enough hand over to the still version. A smooth page matters more than the scene.
    let warm = 0;
    let samples = 0;
    let total = 0;
    let tier = 0;
    const degrade = () => {
      tier = 1;
      renderer.setPixelRatio(1);
      renderer.setSize(host.clientWidth || 1, host.clientHeight || 1, false);
      renderer.shadowMap.enabled = false;
      key.castShadow = false;
      floor.visible = false;
      items.forEach((it) => it.mats.forEach((m) => (m.needsUpdate = true)));
    };

    const frame = (now: number) => {
      const raw = (now - last) / 1000;
      const dt = Math.min(0.05, raw);
      last = now;
      if (!visible || document.hidden) {
        warm = 0;
        return;
      }
      if (raw < 0.25 && ++warm > 24) {
        total += raw;
        if (++samples === 60) {
          const avg = total / samples;
          if (avg > 0.05 && tier === 1) {
            if (process.env.NODE_ENV !== 'production') console.info(`landing scene: ${Math.round(avg * 1000)}ms per frame, showing the still version`);
            onError();
            return;
          }
          if (avg > 0.034 && tier === 0) {
            if (process.env.NODE_ENV !== 'production') console.info(`landing scene: ${Math.round(avg * 1000)}ms per frame, reducing quality`);
            degrade();
          }
          samples = 0;
          total = 0;
        }
      }
      const t = now / 1000;
      const px = pointerRef.current.x;
      const py = pointerRef.current.y;

      rootState.progress = damp(rootState.progress, progressRef.current, 5, dt);
      rootState.yaw = damp(rootState.yaw, px * 0.1, 3, dt);
      rootState.pitch = damp(rootState.pitch, -py * 0.05, 3, dt);
      root.rotation.set(rootState.pitch, rootState.yaw, 0);
      root.position.set(layout.x, layout.y, 0);
      root.scale.setScalar(layout.scale);

      for (const item of items) {
        const spec = CARDS[item.index];
        const pose = poseAt(spec.poses, rootState.progress);

        // The card nearest the pointer lifts a little toward the viewer.
        v.set(pose.p[0], pose.p[1], pose.p[2]).applyMatrix4(root.matrixWorld).project(camera);
        const near = Math.max(0, 1 - Math.hypot(v.x - px, v.y - py) / 0.45);
        const float = Math.sin(t * 0.7 + item.index * 1.7) * 0.07;

        const c = item.cur;
        c.x = damp(c.x, pose.p[0] + px * (pose.p[2] + 3) * 0.05, 6, dt);
        c.y = damp(c.y, pose.p[1] + float, 6, dt);
        c.z = damp(c.z, pose.p[2] + near * 0.35, 6, dt);
        c.rx = damp(c.rx, pose.r[0] - py * 0.03, 6, dt);
        c.ry = damp(c.ry, pose.r[1] + px * 0.06, 6, dt);
        c.rz = damp(c.rz, pose.r[2], 6, dt);
        c.s = damp(c.s, pose.s * (1 + near * 0.035), 6, dt);
        c.o = damp(c.o, pose.o, 6, dt);

        item.group.visible = c.o > 0.02;
        if (!item.group.visible) continue;
        item.group.position.set(c.x, c.y, c.z);
        item.group.rotation.set(c.rx, c.ry, c.rz);
        item.group.scale.setScalar(Math.max(0.001, c.s));
        for (const m of item.mats) m.opacity = c.o;
      }

      renderer.render(scene, camera);
      if (!announced) {
        announced = true;
        onReady();
      }
    };
    renderer.setAnimationLoop(frame);

    const onLost = (e: Event) => {
      e.preventDefault();
      onError();
    };
    renderer.domElement.addEventListener('webglcontextlost', onLost);

    return () => {
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      ro.disconnect();
      io.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // The refs are stable; the callbacks are only invoked, never re-subscribed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className="absolute inset-0" />;
}

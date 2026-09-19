import { describe, it, expect } from 'vitest';
import { CARDS, CHAPTERS, CHAPTER_COUNT } from '../../components/landing/sceneContent';
import { chapterAt, poseAt, shouldRender3D, smoothstep } from '../../components/landing/sceneMath';

describe('scene content', () => {
  it('gives every card exactly one pose per chapter', () => {
    for (const card of CARDS) expect(card.poses, card.id).toHaveLength(CHAPTER_COUNT);
  });

  it('has unique card ids and positive sizes', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    for (const c of CARDS) {
      expect(c.w).toBeGreaterThan(0);
      expect(c.h).toBeGreaterThan(0);
    }
  });

  it('shows something in every chapter', () => {
    for (let i = 0; i < CHAPTER_COUNT; i++) expect(CARDS.some((c) => c.poses[i].o > 0), `chapter ${i}`).toBe(true);
  });

  it('has copy for every chapter', () => {
    expect(CHAPTERS).toHaveLength(CHAPTER_COUNT);
    for (const c of CHAPTERS) expect(c.title.length).toBeGreaterThan(0);
  });
});

describe('chapterAt', () => {
  it('maps scroll progress onto chapters and clamps', () => {
    expect(chapterAt(-1)).toBe(0);
    expect(chapterAt(0)).toBe(0);
    expect(chapterAt(0.5)).toBe(Math.floor(0.5 * CHAPTER_COUNT));
    expect(chapterAt(1)).toBe(CHAPTER_COUNT - 1);
    expect(chapterAt(5)).toBe(CHAPTER_COUNT - 1);
  });
});

describe('poseAt', () => {
  const card = CARDS[0];

  it('starts on the first pose and ends on the last', () => {
    const same = (a: ReturnType<typeof poseAt>, b: (typeof card.poses)[number]) => {
      a.p.forEach((n, i) => expect(n).toBeCloseTo(b.p[i], 9));
      a.r.forEach((n, i) => expect(n).toBeCloseTo(b.r[i], 9));
      expect(a.s).toBeCloseTo(b.s, 9);
      expect(a.o).toBeCloseTo(b.o, 9);
    };
    same(poseAt(card.poses, 0), card.poses[0]);
    same(poseAt(card.poses, 1), card.poses[CHAPTER_COUNT - 1]);
  });

  it('holds a chapter before moving on', () => {
    const p = poseAt(card.poses, 0.02);
    expect(p.p[0]).toBeCloseTo(card.poses[0].p[0], 5);
  });

  it('blends between two chapters', () => {
    const mid = poseAt(card.poses, 0.375);
    const a = card.poses[1];
    const b = card.poses[2];
    const lo = Math.min(a.s, b.s);
    const hi = Math.max(a.s, b.s);
    expect(mid.s).toBeGreaterThanOrEqual(lo - 1e-9);
    expect(mid.s).toBeLessThanOrEqual(hi + 1e-9);
  });

  it('never returns an opacity outside 0 to 1', () => {
    for (const c of CARDS) for (let i = 0; i <= 20; i++) {
      const o = poseAt(c.poses, i / 20).o;
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThanOrEqual(1);
    }
  });
});

describe('smoothstep', () => {
  it('eases between 0 and 1', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(0.25)).toBeLessThan(0.25);
  });
});

describe('shouldRender3D', () => {
  const good = { reducedMotion: false, webgl: true, deviceMemory: 8, cores: 8 };

  it('renders on a capable device', () => {
    expect(shouldRender3D(good)).toBe(true);
  });

  it('respects reduced motion', () => {
    expect(shouldRender3D({ ...good, reducedMotion: true })).toBe(false);
  });

  it('needs WebGL', () => {
    expect(shouldRender3D({ ...good, webgl: false })).toBe(false);
  });

  it('respects data saver and weak devices', () => {
    expect(shouldRender3D({ ...good, saveData: true })).toBe(false);
    expect(shouldRender3D({ ...good, deviceMemory: 2 })).toBe(false);
    expect(shouldRender3D({ ...good, cores: 2 })).toBe(false);
  });

  it('does not block when the browser does not report memory or cores', () => {
    expect(shouldRender3D({ reducedMotion: false, webgl: true })).toBe(true);
  });
});

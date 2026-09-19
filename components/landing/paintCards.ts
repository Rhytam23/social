import type { CardSpec } from './sceneContent';
import { avatarTone } from '../ui/avatar';

/**
 * Paints a card's face onto a 2D canvas so WebGL can wrap it around a slab.
 * The DOM version of the same cards lives in SceneCards.tsx; keep them alike.
 * 1 unit = 100 logical px, drawn at 2x for sharpness.
 */

const SCALE = 2;
const C = {
  card: '#14171c',
  cardSelf: '#0f202b',
  border: 'rgba(255,255,255,0.10)',
  borderSelf: 'rgba(75,163,211,0.38)',
  text: '#e9ebef',
  muted: '#7e8794',
  accent: '#7cc3e8',
  accentBg: 'rgba(75,163,211,0.16)',
  chip: '#1e232a',
  success: '#4cb98f',
  danger: '#ea5a5f',
};
const RADIUS = 14;

type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function lock(ctx: Ctx, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.13);
  const bw = size * 0.78;
  const bh = size * 0.52;
  const bx = x + (size - bw) / 2;
  const by = y + size * 0.44;
  roundRect(ctx, bx, by, bw, bh, size * 0.1);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + size / 2, by, size * 0.24, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}

function avatar(ctx: Ctx, name: string, cx: number, cy: number, r: number, font: string) {
  // avatarTone returns Tailwind classes such as "bg-[#3b4a5c] text-[#d3deea]": pull the two colours out.
  const [bg, fg] = avatarTone(name).match(/#[0-9a-f]{6}/gi) ?? ['#3b4a5c', '#d3deea'];
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  ctx.fillStyle = fg;
  ctx.font = `600 ${Math.round(r * 0.72)}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, cx, cy + 0.5);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function base(ctx: Ctx, w: number, h: number, self = false, alt = false) {
  ctx.clearRect(0, 0, w, h);
  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, RADIUS);
  ctx.fillStyle = alt ? '#0d1216' : self ? C.cardSelf : C.card;
  ctx.fill();
  // A faint sheen from above, the way a lit glass edge would read.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0.055)');
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = self || alt ? C.borderSelf : C.border;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function pill(ctx: Ctx, text: string, right: number, cy: number, font: string, tone: 'accent' | 'neutral', withLock = false) {
  ctx.font = `600 10.5px ${font}`;
  const tw = ctx.measureText(text).width;
  const padX = 8;
  const w = tw + padX * 2 + (withLock ? 12 : 0);
  const h = 20;
  const x = right - w;
  roundRect(ctx, x, cy - h / 2, w, h, 6);
  ctx.fillStyle = tone === 'accent' ? C.accentBg : C.chip;
  ctx.fill();
  ctx.fillStyle = tone === 'accent' ? C.accent : C.muted;
  if (withLock) lock(ctx, x + padX - 1, cy - 5, 10, ctx.fillStyle as string);
  ctx.fillText(text, x + padX + (withLock ? 12 : 0), cy + 3.6);
}

function message(ctx: Ctx, s: CardSpec, w: number, h: number, font: string) {
  base(ctx, w, h, !!s.self);
  avatar(ctx, s.name ?? '?', 25, 27, 13, font);
  ctx.fillStyle = C.text;
  ctx.font = `600 13px ${font}`;
  ctx.fillText(s.name ?? '', 47, 25);
  ctx.fillStyle = C.muted;
  ctx.font = `400 11px ${font}`;
  ctx.fillText(s.time ?? '', 47, 39);
  lock(ctx, w - 24, 14, 11, C.muted);
  ctx.fillStyle = C.text;
  ctx.font = `400 14px ${font}`;
  wrap(ctx, s.text ?? '', w - 34, 2).forEach((line, i) => ctx.fillText(line, 17, 64 + i * 19));
  if (s.reaction) pill(ctx, s.reaction, w - 12, h - 16, font, 'neutral');
}

function profile(ctx: Ctx, s: CardSpec, w: number, h: number, font: string) {
  base(ctx, w, h);
  avatar(ctx, s.name ?? '?', w / 2, 56, 30, font);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.text;
  ctx.font = `600 16px ${font}`;
  ctx.fillText(s.name ?? '', w / 2, 110);
  ctx.fillStyle = C.muted;
  ctx.font = `400 12px ${font}`;
  ctx.fillText(`@${s.handle ?? ''}`, w / 2, 128);
  ctx.fillStyle = '#b3bac5';
  ctx.font = `400 12.5px ${font}`;
  wrap(ctx, s.text ?? '', w - 40, 2).forEach((line, i) => ctx.fillText(line, w / 2, 156 + i * 17));
  ctx.textAlign = 'left';
  const label = s.tag ?? '';
  ctx.font = `600 10.5px ${font}`;
  const tw = ctx.measureText(label).width + 30;
  roundRect(ctx, (w - tw) / 2, h - 38, tw, 22, 7);
  ctx.fillStyle = C.accentBg;
  ctx.fill();
  ctx.fillStyle = C.accent;
  lock(ctx, (w - tw) / 2 + 8, h - 33, 11, C.accent);
  ctx.fillText(label, (w - tw) / 2 + 22, h - 23.5);
}

function channels(ctx: Ctx, s: CardSpec, w: number, h: number, font: string) {
  base(ctx, w, h);
  avatar(ctx, s.name ?? '?', 26, 28, 12, font);
  ctx.fillStyle = C.text;
  ctx.font = `600 14px ${font}`;
  ctx.fillText(s.name ?? '', 46, 33);
  ctx.strokeStyle = C.border;
  ctx.beginPath();
  ctx.moveTo(0, 54.5);
  ctx.lineTo(w, 54.5);
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = `600 10px ${font}`;
  ctx.fillText('CHANNELS', 16, 76);
  (s.lines ?? []).forEach((row, i) => {
    const [label, unread] = row.split('|');
    const y = 96 + i * 38;
    if (i === 0) {
      roundRect(ctx, 8, y - 4, w - 16, 32, 8);
      ctx.fillStyle = '#20262d';
      ctx.fill();
    }
    const isLock = label.startsWith('lock ');
    ctx.fillStyle = i === 0 ? C.text : '#a4abb6';
    ctx.font = `${unread ? 600 : 400} 13.5px ${font}`;
    if (isLock) {
      lock(ctx, 16, y + 3, 12, '#8b93a0');
      ctx.fillText(label.slice(5), 34, y + 17);
    } else {
      ctx.fillStyle = C.muted;
      ctx.fillText('#', 17, y + 17);
      ctx.fillStyle = i === 0 ? C.text : '#a4abb6';
      ctx.fillText(label.slice(2), 32, y + 17);
    }
    if (unread) {
      roundRect(ctx, w - 42, y + 3, 26, 18, 9);
      ctx.fillStyle = '#4ba3d3';
      ctx.fill();
      ctx.fillStyle = '#061219';
      ctx.font = `700 10.5px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText(unread, w - 29, y + 15.5);
      ctx.textAlign = 'left';
    }
  });
}

function file(ctx: Ctx, s: CardSpec, w: number, h: number, font: string) {
  base(ctx, w, h);
  roundRect(ctx, 16, 16, 46, 46, 10);
  ctx.fillStyle = C.accentBg;
  ctx.fill();
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, 28);
  ctx.lineTo(42, 28);
  ctx.lineTo(48, 34);
  ctx.lineTo(48, 50);
  ctx.lineTo(30, 50);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.font = `600 13px ${font}`;
  ctx.fillText(s.name ?? '', 74, 34);
  ctx.fillStyle = C.muted;
  ctx.font = `400 11.5px ${font}`;
  ctx.fillText(s.text ?? '', 74, 52);
  pill(ctx, s.tag ?? '', w - 12, h - 18, font, 'accent', true);
}

function call(ctx: Ctx, s: CardSpec, w: number, h: number, font: string) {
  base(ctx, w, h);
  ctx.fillStyle = C.success;
  ctx.beginPath();
  ctx.arc(24, h / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.text;
  ctx.font = `600 13px ${font}`;
  ctx.fillText(s.name ?? '', 40, h / 2 - 2);
  ctx.fillStyle = C.muted;
  ctx.font = `400 11.5px ${font}`;
  ctx.fillText(s.text ?? '', 40, h / 2 + 15);
  ctx.beginPath();
  ctx.arc(w - 28, h / 2, 14, 0, Math.PI * 2);
  ctx.fillStyle = C.danger;
  ctx.fill();
  ctx.fillStyle = '#fff';
  roundRect(ctx, w - 35, h / 2 - 1.5, 14, 3, 1.5);
  ctx.fill();
}

function envelopeFront(ctx: Ctx, s: CardSpec, w: number, h: number, font: string) {
  base(ctx, w, h);
  lock(ctx, 16, 12, 13, C.accent);
  ctx.fillStyle = C.muted;
  ctx.font = `500 11px ${font}`;
  ctx.fillText(`${s.name}  ·  on your device`, 36, 24);
  ctx.fillStyle = C.text;
  ctx.font = `500 19px ${font}`;
  wrap(ctx, s.text ?? '', w - 34, 2).forEach((line, i) => ctx.fillText(line, 17, 58 + i * 25));
}

function envelopeBack(ctx: Ctx, s: CardSpec, w: number, h: number, font: string) {
  base(ctx, w, h, false, true);
  lock(ctx, 16, 12, 13, C.accent);
  ctx.fillStyle = C.accent;
  ctx.font = `500 11px ${font}`;
  ctx.fillText('What the server stores', 36, 24);
  ctx.fillStyle = 'rgba(124,195,232,0.72)';
  ctx.font = `400 13px ui-monospace, Menlo, Consolas, monospace`;
  (s.lines ?? []).forEach((line, i) => ctx.fillText(line, 17, 52 + i * 15));
}

function post(ctx: Ctx, s: CardSpec, w: number, h: number, font: string) {
  base(ctx, w, h);
  const isPrivate = s.tag === 'Private';
  ctx.fillStyle = C.text;
  ctx.font = `600 13px ${font}`;
  if (isPrivate) {
    lock(ctx, 15, 14, 12, C.muted);
    ctx.fillText(s.name ?? '', 32, 28);
  } else {
    ctx.fillStyle = C.muted;
    ctx.fillText('#', 16, 28);
    ctx.fillStyle = C.text;
    ctx.fillText((s.name ?? '').replace('# ', ''), 30, 28);
  }
  pill(ctx, s.tag ?? '', w - 12, 24, font, isPrivate ? 'neutral' : 'accent', isPrivate);
  ctx.fillStyle = '#b3bac5';
  ctx.font = `400 13.5px ${font}`;
  wrap(ctx, s.text ?? '', w - 32, 2).forEach((line, i) => ctx.fillText(line, 16, 56 + i * 18));
}

const PAINTERS: Record<string, (ctx: Ctx, s: CardSpec, w: number, h: number, font: string) => void> = {
  message,
  profile,
  channels,
  file,
  call,
  post,
  envelope: envelopeFront,
};

/** Paints the front (and, for the envelope, back) of a card. */
export function paintCard(spec: CardSpec, font: string, back = false): HTMLCanvasElement {
  const w = Math.round(spec.w * 100);
  const h = Math.round(spec.h * 100);
  const canvas = document.createElement('canvas');
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(SCALE, SCALE);
  (back ? envelopeBack : PAINTERS[spec.kind])(ctx, spec, w, h, font);
  return canvas;
}

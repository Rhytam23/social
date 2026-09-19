/**
 * What the landing page shows, as data. One list of "objects" (a message, a
 * profile, a channel list...) drives all three renderings so they never
 * drift apart: the WebGL scene (painted onto textures), the DOM stack shown
 * to people without WebGL or who prefer reduced motion, and the per-chapter
 * stills. Everything here is sample content, not real accounts.
 *
 * Units: 1 unit = 100 px of card face. A pose places a card in 3D for one
 * chapter of the story (x right, y up, z toward the viewer, radians).
 */

export type CardKind = 'message' | 'profile' | 'channels' | 'file' | 'call' | 'envelope' | 'post';

export interface Pose {
  p: [number, number, number];
  r: [number, number, number];
  s: number;
  /** 0 hides the card in this chapter. */
  o: number;
}

export interface CardSpec {
  id: string;
  kind: CardKind;
  w: number;
  h: number;
  poses: Pose[];
  name?: string;
  handle?: string;
  time?: string;
  text?: string;
  self?: boolean;
  reaction?: string;
  lines?: string[];
  tag?: string;
}

export const CHAPTERS = [
  {
    id: 'hero',
    eyebrow: 'End-to-end encrypted',
    title: 'Conversations that stay yours.',
    body: 'Private Chat encrypts every message on your device before it leaves. The server only ever holds ciphertext, so what you say stays between you and the people you say it to.',
  },
  {
    id: 'direct',
    eyebrow: 'Direct messages',
    title: 'Say it once, privately.',
    body: 'Messages, voice notes, files and one-to-one calls, with read receipts, reactions and a security code you can check with the person on the other end.',
  },
  {
    id: 'threads',
    eyebrow: 'Groups and threads',
    title: 'Room for busy conversations.',
    body: 'Threads keep long discussions readable. Owners and admins decide who can post, add people and remove them, and the group key changes when members leave.',
  },
  {
    id: 'communities',
    eyebrow: 'Communities',
    title: 'Build a place, not just a chat.',
    body: 'Communities have public and private channels, invite links and roles. Every channel is end-to-end encrypted, so admins and the server cannot read it either.',
  },
  {
    id: 'enter',
    eyebrow: 'Ready when you are',
    title: 'Step inside.',
    body: 'Sign in and pick up where you left off, or create an account in a minute.',
  },
] as const;

const hide = (p: [number, number, number], s = 0.6): Pose => ({ p, r: [0, 0, 0], s, o: 0 });

export const CARDS: CardSpec[] = [
  {
    id: 'env',
    kind: 'envelope',
    w: 2.7,
    h: 1.05,
    name: 'You to Maya',
    text: 'Are we still on for tonight?',
    lines: ['9f3a c1e0 7b44 d2a8', '51ee 08bc a370 4f19', 'c6d2 9e13 b8f7 0a65', '3d80 e5a1 72cc 94fb'],
    poses: [
      { p: [0.2, 0.15, 0.2], r: [0.08, -0.32, 0.03], s: 1.12, o: 1 },
      { p: [-2.6, 1.7, -2.4], r: [0.1, Math.PI + 0.35, 0], s: 0.7, o: 0.9 },
      hide([-3, 2, -3], 0.5),
      hide([-3, 2, -3], 0.5),
      { p: [0, 0.1, 1.2], r: [0, 0, 0], s: 1.3, o: 1 },
    ],
  },
  {
    id: 'm1',
    kind: 'message',
    w: 2.5,
    h: 0.95,
    name: 'Maya Okafor',
    time: '7:42 PM',
    text: 'Are we still on for tonight?',
    poses: [
      { p: [-3.1, 1.55, -1.1], r: [0.04, 0.38, 0.05], s: 1, o: 1 },
      { p: [-1.0, 1.35, 0], r: [0, 0.16, 0], s: 1, o: 1 },
      { p: [-0.6, 1.6, 0], r: [0, 0.12, 0], s: 1.05, o: 1 },
      hide([-2.5, 1.5, -2]),
      { p: [-3.6, 1.8, -3], r: [0.05, 0.4, 0.05], s: 0.85, o: 0.55 },
    ],
  },
  {
    id: 'm2',
    kind: 'message',
    w: 2.4,
    h: 0.95,
    name: 'You',
    time: '7:43 PM',
    text: 'Yes. Bringing the drawings.',
    self: true,
    reaction: '+1',
    poses: [
      { p: [2.9, -1.35, 0.6], r: [-0.04, -0.4, -0.04], s: 1, o: 1 },
      { p: [1.0, 0.2, 0.2], r: [0, -0.16, 0], s: 1, o: 1 },
      { p: [3, -1, -2.6], r: [0, -0.3, 0], s: 0.85, o: 0.5 },
      hide([2.5, -1, -2]),
      { p: [3.7, -1.6, -3], r: [-0.04, -0.4, -0.04], s: 0.85, o: 0.55 },
    ],
  },
  {
    id: 'm3',
    kind: 'message',
    w: 2.6,
    h: 0.95,
    name: 'Maya Okafor',
    time: '7:43 PM',
    text: 'Perfect. I will set up the channel.',
    poses: [
      { p: [-2.7, -1.75, 0.9], r: [0.03, 0.34, -0.03], s: 1, o: 1 },
      { p: [-1.0, -0.95, 0], r: [0, 0.16, 0], s: 1, o: 1 },
      { p: [-3.4, -1.4, -2.6], r: [0, 0.3, 0], s: 0.85, o: 0.4 },
      hide([-2.5, -1.5, -2]),
      { p: [-3.8, -1.7, -3], r: [0.03, 0.34, -0.03], s: 0.85, o: 0.55 },
    ],
  },
  {
    id: 'profile',
    kind: 'profile',
    w: 1.75,
    h: 2.2,
    name: 'Maya Okafor',
    handle: 'maya_o',
    text: 'Product designer. Coffee first.',
    tag: 'Security code verified',
    poses: [
      { p: [3.2, 1.35, -1.7], r: [0, -0.5, 0.06], s: 1, o: 1 },
      { p: [3.0, 1.0, -0.8], r: [0, -0.4, 0.04], s: 0.85, o: 1 },
      hide([3, 1, -2]),
      { p: [3.4, 1.7, -1.5], r: [0, -0.45, 0.04], s: 0.72, o: 0.9 },
      { p: [3.9, 1.5, -3], r: [0, -0.5, 0.06], s: 0.8, o: 0.5 },
    ],
  },
  {
    id: 'file',
    kind: 'file',
    w: 2.1,
    h: 0.78,
    name: 'review-notes.pdf',
    text: '2.4 MB',
    tag: 'Encrypted',
    poses: [
      { p: [0.5, -2.35, 1.5], r: [0.12, -0.12, 0.02], s: 1, o: 1 },
      { p: [0.2, -2.3, 0.8], r: [0.1, -0.1, 0], s: 0.95, o: 1 },
      hide([0, -2, -1]),
      hide([0, -2, -1]),
      hide([0, -2, -1]),
    ],
  },
  {
    id: 'call',
    kind: 'call',
    w: 1.9,
    h: 0.66,
    name: 'Voice call',
    text: '04:21',
    poses: [
      { p: [-0.7, 2.35, 0.5], r: [-0.1, 0.1, 0], s: 1, o: 1 },
      { p: [1.4, 2.3, 0.4], r: [-0.08, -0.08, 0], s: 0.95, o: 1 },
      hide([0, 2, -1]),
      hide([0, 2, -1]),
      hide([0, 2, -1]),
    ],
  },
  {
    id: 't1',
    kind: 'message',
    w: 2.3,
    h: 0.95,
    name: 'Jonas Weber',
    time: '7:51 PM',
    text: 'Attached the latest version.',
    poses: [
      hide([0.6, 0.6, -1]),
      hide([0.6, 0.6, -1]),
      { p: [0.9, 0.35, -0.5], r: [0, 0.14, 0], s: 1, o: 1 },
      hide([0.6, 0.6, -1]),
      hide([0.6, 0.6, -1]),
    ],
  },
  {
    id: 't2',
    kind: 'message',
    w: 2.2,
    h: 0.95,
    name: 'You',
    time: '7:53 PM',
    text: 'Looks right to me.',
    self: true,
    poses: [
      hide([1.4, -0.6, -1]),
      hide([1.4, -0.6, -1]),
      { p: [1.7, -0.75, -1.3], r: [0, 0.14, 0], s: 1, o: 1 },
      hide([1.4, -0.6, -1]),
      hide([1.4, -0.6, -1]),
    ],
  },
  {
    id: 'channels',
    kind: 'channels',
    w: 1.7,
    h: 2.6,
    name: 'Design team',
    lines: ['# general|3', '# announcements|', '# studio|12', 'lock leads|'],
    poses: [
      hide([-2, 0, -1]),
      hide([-2, 0, -1]),
      hide([-2, 0, -1]),
      { p: [-2.5, 0.1, 0], r: [0, 0.22, 0], s: 1, o: 1 },
      hide([-2, 0, -2], 0.5),
    ],
  },
  {
    id: 'pa',
    kind: 'post',
    w: 2.2,
    h: 0.9,
    name: '# general',
    text: 'Kickoff notes are pinned.',
    tag: '3 new',
    poses: [
      hide([0.8, 1, -1]),
      hide([0.8, 1, -1]),
      hide([0.8, 1, -1]),
      { p: [0.5, 1.4, 0], r: [0, -0.16, 0], s: 1, o: 1 },
      hide([0.8, 1, -2], 0.5),
    ],
  },
  {
    id: 'pb',
    kind: 'post',
    w: 2.2,
    h: 0.9,
    name: '# studio',
    text: 'New mocks are up for review.',
    tag: '12 new',
    poses: [
      hide([1, 0, -1]),
      hide([1, 0, -1]),
      hide([1, 0, -1]),
      { p: [1.0, 0.1, -0.7], r: [0, -0.16, 0], s: 1, o: 1 },
      hide([1, 0, -2], 0.5),
    ],
  },
  {
    id: 'pc',
    kind: 'post',
    w: 2.2,
    h: 0.9,
    name: 'leads',
    text: 'Private channel for the leads.',
    tag: 'Private',
    poses: [
      hide([0.8, -1, -1]),
      hide([0.8, -1, -1]),
      hide([0.8, -1, -1]),
      { p: [0.6, -1.25, 0.3], r: [0, -0.16, 0], s: 1, o: 1 },
      hide([0.8, -1, -2], 0.5),
    ],
  },
];

export const CHAPTER_COUNT = CHAPTERS.length;

/**
 * Every limit that protects cost and load, in one place. Both the browser (to refuse early, with a clear
 * message) and the server (the real enforcement) read these numbers.
 *
 * NEXT_PUBLIC_STORAGE_MAX_FILE_MB is the largest single file the deployment accepts. It must not be higher
 * than what the Supabase plan allows (the free plan caps a file at 50 MB); raise it after upgrading.
 */

export const MB = 1024 * 1024;

export type UploadKind = 'image' | 'video' | 'file';

const DEFAULT_CEILING_MB = 50;

/** The largest single file, in MB, after applying the deployment setting. */
export function storageCeilingMb(raw: string | undefined = process.env.NEXT_PUBLIC_STORAGE_MAX_FILE_MB): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 && n <= 5000 ? Math.floor(n) : DEFAULT_CEILING_MB;
}

export const UPLOAD_LIMITS = {
  imageMb: 10,
  videoMb: 100,
  fileMb: 25,
  /** Sign-in requests to start an upload: bursts and sustained use, per account. */
  perMinute: 6,
  perHour: 30,
  /** Total bytes one account may upload per rolling day. */
  dailyMb: 500,
  /** Profile photos. */
  avatarMb: 2,
} as const;

export function uploadKindFor(mimeType: string): UploadKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
}

export function isUploadKind(v: unknown): v is UploadKind {
  return v === 'image' || v === 'video' || v === 'file';
}

/** Largest allowed size in bytes for a kind of file, never above the deployment ceiling. */
export function maxUploadBytes(kind: UploadKind, ceilingMb: number = storageCeilingMb()): number {
  const mb = kind === 'image' ? UPLOAD_LIMITS.imageMb : kind === 'video' ? UPLOAD_LIMITS.videoMb : UPLOAD_LIMITS.fileMb;
  return Math.min(mb, ceilingMb) * MB;
}

const KIND_LABEL: Record<UploadKind, string> = { image: 'Images', video: 'Videos', file: 'Files' };

/** A sentence for the person: which limit applies and what to do. */
export function uploadLimitMessage(kind: UploadKind, sizeBytes: number, ceilingMb: number = storageCeilingMb()): string {
  const limitMb = maxUploadBytes(kind, ceilingMb) / MB;
  return `${KIND_LABEL[kind]} can be up to ${limitMb} MB. This one is ${(sizeBytes / MB).toFixed(1)} MB.`;
}

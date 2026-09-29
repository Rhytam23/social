import { describe, it, expect } from 'vitest';
import { MB, maxUploadBytes, storageCeilingMb, uploadKindFor, uploadLimitMessage } from '../../lib/limits';

describe('upload limits', () => {
  it('classifies files by their type', () => {
    expect(uploadKindFor('image/png')).toBe('image');
    expect(uploadKindFor('video/mp4')).toBe('video');
    expect(uploadKindFor('application/pdf')).toBe('file');
    expect(uploadKindFor('')).toBe('file');
  });

  it('applies the per-kind limits under a high ceiling', () => {
    expect(maxUploadBytes('image', 500)).toBe(10 * MB);
    expect(maxUploadBytes('video', 500)).toBe(100 * MB);
    expect(maxUploadBytes('file', 500)).toBe(25 * MB);
  });

  it('never lets the deployment ceiling be exceeded', () => {
    expect(maxUploadBytes('video', 50)).toBe(50 * MB);
    expect(maxUploadBytes('image', 5)).toBe(5 * MB);
  });

  it('reads the ceiling from the setting and ignores nonsense', () => {
    expect(storageCeilingMb('100')).toBe(100);
    expect(storageCeilingMb('')).toBe(50);
    expect(storageCeilingMb('abc')).toBe(50);
    expect(storageCeilingMb('0')).toBe(50);
    expect(storageCeilingMb('99999')).toBe(50);
  });

  it('explains which limit applies', () => {
    expect(uploadLimitMessage('image', 12 * MB, 50)).toBe('Images can be up to 10 MB. This one is 12.0 MB.');
  });
});

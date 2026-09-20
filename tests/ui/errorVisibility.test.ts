import { describe, it, expect, beforeEach } from 'vitest';
import { GENERIC_ERROR, UserMessageError, adminDetail, errorDetail, setErrorViewer, technicalNote, userError } from '../../lib/ui/errors';

const DB_ERROR = { message: 'new row violates row-level security policy for table "messages"', code: '42501' };

describe('who sees how much of an error', () => {
  beforeEach(() => setErrorViewer(false));

  describe('an ordinary user', () => {
    it('never sees the technical detail', () => {
      const shown = userError(DB_ERROR, 'Could not send the message.');
      expect(shown).toBe('Could not send the message.');
      expect(shown).not.toMatch(/row-level|policy|messages|42501/);
    });

    it('gets the generic message when none is given', () => {
      expect(userError(new Error('relation "communities" does not exist'))).toBe(GENERIC_ERROR);
    });

    it('does not see migration hints', () => {
      const shown = technicalNote('Blocking needs the latest database update (migration 015).', 'Blocking is not available right now.');
      expect(shown).toBe('Blocking is not available right now.');
      expect(shown).not.toMatch(/migration/i);
    });

    it('does not see why a message could not be decrypted', () => {
      expect(adminDetail(new Error('bad nonce length'), 'this message could not be read on this device')).toBe('this message could not be read on this device');
    });

    it('still sees messages that were written for people', () => {
      expect(userError(new UserMessageError('That username or phone number is already taken.'), 'x')).toBe('That username or phone number is already taken.');
    });
  });

  describe('an admin', () => {
    beforeEach(() => setErrorViewer(true));

    it('sees the friendly message and the technical detail', () => {
      const shown = userError(DB_ERROR, 'Could not send the message.');
      expect(shown).toContain('Could not send the message.');
      expect(shown).toContain('new row violates row-level security policy');
    });

    it('sees migration hints and decrypt reasons', () => {
      expect(technicalNote('needs migration 015', 'Blocking is not available right now.')).toContain('needs migration 015');
      expect(adminDetail(new Error('bad nonce length'), 'fallback')).toBe('bad nonce length');
    });

    it('does not repeat the friendly text when there is no extra detail', () => {
      expect(userError(new Error(''), 'Could not send the message.')).toBe('Could not send the message.');
    });

    it('caps very long detail', () => {
      expect(userError(new Error('x'.repeat(5000)), 'Failed.').length).toBeLessThan(400);
    });
  });

  it('signing out (or a non-admin profile) turns detail off again', () => {
    setErrorViewer(true);
    expect(userError(new Error('secret table name'), 'Failed.')).toContain('secret table name');
    setErrorViewer(false);
    expect(userError(new Error('secret table name'), 'Failed.')).toBe('Failed.');
  });

  it('reads the message out of errors, strings and plain error objects', () => {
    expect(errorDetail(new Error('a'))).toBe('a');
    expect(errorDetail('b')).toBe('b');
    expect(errorDetail({ message: 'c' })).toBe('c');
    expect(errorDetail(42)).toBe('');
  });
});

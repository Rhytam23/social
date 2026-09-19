import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { buildIceServers } from '../../lib/calls/iceConfig';

describe('buildIceServers', () => {
  it('uses public STUN and reports no relay when TURN is not configured', () => {
    const res = buildIceServers({}, 'u1', 1000);
    expect(res.relayAvailable).toBe(false);
    expect(res.iceServers).toHaveLength(1);
    expect(JSON.stringify(res.iceServers)).toContain('stun:');
  });

  it('mints short-lived credentials from a shared secret', () => {
    const res = buildIceServers({ TURN_URLS: 'turn:t.example.com:3478', TURN_SHARED_SECRET: 's3cret' }, 'u1', 1000, 600);
    const turn = res.iceServers[1];
    expect(res.relayAvailable).toBe(true);
    expect(turn.username).toBe('1600:u1');
    expect(turn.credential).toBe(createHmac('sha1', 's3cret').update('1600:u1').digest('base64'));
  });

  it('never leaks the shared secret', () => {
    const res = buildIceServers({ TURN_URLS: 'turn:t.example.com', TURN_SHARED_SECRET: 's3cret' }, 'u1', 1000);
    expect(JSON.stringify(res)).not.toContain('s3cret');
  });

  it('supports a fixed username and credential', () => {
    const res = buildIceServers({ TURN_URLS: 'turn:a,turns:b', TURN_USERNAME: 'me', TURN_CREDENTIAL: 'pw' }, 'u1', 1000);
    expect(res.iceServers[1]).toEqual({ urls: ['turn:a', 'turns:b'], username: 'me', credential: 'pw' });
  });

  it('ignores TURN URLs that have no credentials', () => {
    expect(buildIceServers({ TURN_URLS: 'turn:a' }, 'u1', 1000).relayAvailable).toBe(false);
  });

  it('honours a STUN override', () => {
    expect(buildIceServers({ STUN_URLS: 'stun:one,stun:two' }, 'u1', 1000).iceServers[0].urls).toEqual(['stun:one', 'stun:two']);
  });
});

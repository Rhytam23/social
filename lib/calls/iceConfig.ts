import { createHmac } from 'node:crypto';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const DEFAULT_STUN = ['stun:stun.l.google.com:19302'];

function list(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Builds the ICE server list handed to browsers (server side only: it reads secrets).
 *
 * STUN alone works on most home networks. Strict NATs and many corporate or
 * mobile networks need a TURN relay, configured with environment variables:
 *
 *   TURN_URLS             comma separated, e.g. turn:turn.example.com:3478,turns:turn.example.com:5349
 *   TURN_SHARED_SECRET    coturn "use-auth-secret" mode: short-lived credentials are minted per user
 *   TURN_USERNAME / TURN_CREDENTIAL   or a fixed account (some hosted providers)
 *   STUN_URLS             optional override for the STUN servers
 *
 * A TURN relay only ever sees encrypted media (DTLS-SRTP); it cannot listen in.
 */
export function buildIceServers(
  env: Record<string, string | undefined>,
  userId: string,
  nowSec: number = Math.floor(Date.now() / 1000),
  ttlSec = 3600
): { iceServers: IceServer[]; relayAvailable: boolean } {
  const stun = list(env.STUN_URLS);
  const iceServers: IceServer[] = [{ urls: stun.length > 0 ? stun : DEFAULT_STUN }];

  const turnUrls = list(env.TURN_URLS);
  if (turnUrls.length === 0) return { iceServers, relayAvailable: false };

  if (env.TURN_SHARED_SECRET) {
    const username = `${nowSec + ttlSec}:${userId}`;
    const credential = createHmac('sha1', env.TURN_SHARED_SECRET).update(username).digest('base64');
    iceServers.push({ urls: turnUrls, username, credential });
    return { iceServers, relayAvailable: true };
  }

  if (env.TURN_USERNAME && env.TURN_CREDENTIAL) {
    iceServers.push({ urls: turnUrls, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL });
    return { iceServers, relayAvailable: true };
  }

  return { iceServers, relayAvailable: false };
}

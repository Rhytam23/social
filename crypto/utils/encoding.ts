// Environment-agnostic byte/text/base64 helpers. Deliberately avoid Node's
// `Buffer` global here: everything in `crypto/` must run in the browser
// (see docs/20_E2EE_SPEC.md for why), and `Buffer` is not available there
// without a bundler polyfill.

export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  // Node fallback (used only by the vitest suite, never shipped to the browser).
  return Buffer.from(binary, 'binary').toString('base64');
}

export function base64ToBytes(b64: string): Uint8Array {
  let binary: string;
  if (typeof atob === 'function') {
    binary = atob(b64);
  } else {
    binary = Buffer.from(b64, 'base64').toString('binary');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

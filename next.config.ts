import path from "node:path";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/** The Supabase project origin (REST, auth, storage) and its realtime websocket, from the public URL only. */
function supabaseOrigins(): { https: string; wss: string } | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    if (url.hostname.includes("placeholder")) return null;
    return { https: url.origin, wss: `wss://${url.host}` };
  } catch {
    return null;
  }
}

/**
 * Content Security Policy. Scripts must come from this site: no third-party
 * script can run, which is the main protection for keys held in the browser.
 * 'unsafe-inline' is required by Next.js's own bootstrap scripts and the
 * theme script (a nonce-based policy would need per-request rendering);
 * 'wasm-unsafe-eval' is required by libsodium and Argon2 (WebAssembly).
 */
function contentSecurityPolicy(): string {
  const supa = supabaseOrigins();
  const connect = ["'self'", ...(supa ? [supa.https, supa.wss] : []), ...(isProd ? [] : ["ws:", "http://localhost:*"])];
  // Profile photos come from Supabase Storage or Google sign-in only, never from arbitrary hosts.
  const img = ["'self'", "data:", "blob:", ...(supa ? [supa.https] : []), "https://*.googleusercontent.com"];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", ...(isProd ? [] : ["'unsafe-eval'"])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": img,
    "font-src": ["'self'", "data:"],
    "connect-src": connect,
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
  };
  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (isProd) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

const nextConfig: NextConfig = {
  // Pin the project root so a lockfile elsewhere on the machine is never picked as the workspace root.
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy() },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        // API responses carry per-user data: never cache them in a browser or shared cache.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;

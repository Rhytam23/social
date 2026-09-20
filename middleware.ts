import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured, isDemoModeAllowed } from "@/lib/supabase/env";
import { limitByIp } from "@/lib/api/security";

// First line of defence against floods: runs before any Supabase call, so junk traffic never costs
// an auth lookup. Limits are per address and generous for real use; the per-route and per-account
// limits sit behind this. Volumetric attacks still need an edge firewall (see SECURITY_AUDIT.md).
const MAX_API_BODY_BYTES = 2 * 1024 * 1024;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/") || pathname.startsWith("/auth/");

  // The component preview pages exist for development only: a real 404 in production, not a page that says so.
  if (process.env.NODE_ENV === "production" && pathname.startsWith("/design-system")) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (isApi && Number(request.headers.get("content-length") || 0) > MAX_API_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  // Sign-in, sign-up, password reset and email-link pages are the ones bots hammer: a tighter per-address limit.
  // (The sign-in requests themselves go to Supabase Auth, which the optional bot check in lib/captcha.ts protects.)
  const isAuthEntry = /^\/(login|signup|register|forgot-password|reset-password|auth\/)/.test(pathname);
  const limited = await limitByIp(
    request,
    isAuthEntry ? "mw-auth" : isApi ? "mw-api" : "mw-page",
    isAuthEntry ? { limit: 60, windowMs: 60_000 } : isApi ? { limit: 300, windowMs: 60_000 } : { limit: 600, windowMs: 60_000 }
  );
  if (limited) return limited;

  // Only screens that depend on who you are pay for a session check (a network call to Supabase Auth
  // when a cookie is present). Public pages and the API skip it: every API route verifies the caller
  // itself, and the browser keeps its own session fresh.
  const isProtectedUserRoute =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/people") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/settings");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const needsSession = isProtectedUserRoute || isAdminRoute || isAuthRoute;

  const { supabase, user, supabaseResponse } = needsSession
    ? await updateSession(request)
    : { supabase: null, user: null, supabaseResponse: NextResponse.next({ request }) };

  // Set standard security headers on response
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );

  if (!isSupabaseConfigured()) {
    // Only ever bypass auth gating in local development. A production
    // deployment with missing/placeholder env vars is a misconfiguration and
    // must fail loudly, not silently grant unauthenticated access to every
    // route (this was previously a real security hole).
    if (isDemoModeAllowed()) {
      return supabaseResponse;
    }
    return new NextResponse(
      "Server misconfiguration: Supabase environment variables are not set.",
      { status: 500 }
    );
  }

  // When the redirect URL we asked for is not in Supabase's allow-list,
  // Supabase falls back to the bare Site URL and appends ?code= (or ?error=)
  // there. The home page would ignore it and show the landing page as if the
  // sign-in never happened, so hand those params to the callback route.
  if (pathname === "/" && (request.nextUrl.searchParams.has("code") || request.nextUrl.searchParams.has("error") || request.nextUrl.searchParams.has("error_code"))) {
    const callbackUrl = new URL("/auth/confirm", request.url);
    request.nextUrl.searchParams.forEach((value, key) => callbackUrl.searchParams.set(key, value));
    if (!callbackUrl.searchParams.has("next")) callbackUrl.searchParams.set("next", "/");
    return NextResponse.redirect(callbackUrl);
  }

  if (isProtectedUserRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authoritative Admin Check: verified against server-controlled profiles.is_admin
    const { data: profile } = await supabase!
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.is_admin === true;
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
  }

  // Redirect authenticated user away from auth pages (login/register) to /
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

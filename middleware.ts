import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured, isDemoModeAllowed } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

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

  // Protected user routes
  const isProtectedUserRoute =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/people") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/settings");

  // Protected admin routes
  const isAdminRoute = pathname.startsWith("/admin");

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
    const { data: profile } = await supabase
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
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

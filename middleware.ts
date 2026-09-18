import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Set standard security headers on response
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set(
    "Permissions-Policy",
    "microphone=(self), camera=(), geolocation=()"
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isPlaceholderDev = !supabaseUrl || supabaseUrl.includes("placeholder");

  // In local dev/prototype mode with placeholder credentials, bypass auth redirects
  if (isPlaceholderDev) {
    return supabaseResponse;
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

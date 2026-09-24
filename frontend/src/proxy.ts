import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/webSession";
import { isMigratedPath } from "@/lib/locale";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Locale rewrite/redirect (runs before auth — none of these paths are
  //    protected routes) ──
  // A literal /hi/... URL should never be indexable (it'd duplicate the bare
  // Hindi page), so bounce it to the bare equivalent.
  // Note: Only redirect actual external browser requests, NOT internal rewrites!
  if ((pathname === "/hi" || pathname.startsWith("/hi/")) && !request.headers.get("x-locale-rewrite")) {
    const bare = pathname === "/hi" ? "/" : pathname.slice("/hi".length);
    return NextResponse.redirect(new URL(bare, request.url));
  }
  // A bare path that has a migrated app/[locale] route gets internally rewritten
  // to /hi/... so it resolves there — the browser URL stays bare.
  if (isMigratedPath(pathname)) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = pathname === "/" ? "/hi" : `/hi${pathname}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale-rewrite", "1");
    return NextResponse.rewrite(nextUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // ── Auth / route protection (unchanged from the previous middleware.ts) ──
  const token = request.cookies.get("astro_session_token")?.value;
  const session = await verifySessionToken(token);

  const isAuthenticated = Boolean(session && session.userId);
  const role = session?.role;

  // 1. Protect Admin routes: Strictly only verified ADMIN / SUPER_ADMIN permitted (§14.16)
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      const redirectUrl = new URL("/login?error=admin_only", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Protect User Dashboard & Console routes: Authentication required (§8.1)
  const isProtectedUserRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/api-keys" || pathname.startsWith("/api-keys/") ||
    pathname === "/usage" || pathname.startsWith("/usage/") ||
    pathname === "/pdf-reports" || pathname.startsWith("/pdf-reports/") ||
    pathname === "/branding" || pathname.startsWith("/branding/") ||
    pathname === "/billing" || pathname.startsWith("/billing/") ||
    pathname === "/invoices" || pathname.startsWith("/invoices/") ||
    pathname === "/team" || pathname.startsWith("/team/") ||
    pathname === "/support" || pathname.startsWith("/support/") ||
    pathname === "/profile" || pathname.startsWith("/profile/") ||
    pathname === "/settings" || pathname.startsWith("/settings/");

  if (isProtectedUserRoute) {
    if (!isAuthenticated) {
      const redirectUrl = new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 3. If already logged in, redirect away from /login to their respective panel
  if (pathname === "/login" && isAuthenticated) {
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Auth-protected routes (unchanged list from the previous middleware.ts)
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/api-keys",
    "/api-keys/:path*",
    "/usage",
    "/usage/:path*",
    "/pdf-reports",
    "/pdf-reports/:path*",
    "/branding",
    "/branding/:path*",
    "/billing",
    "/billing/:path*",
    "/team",
    "/team/:path*",
    "/support",
    "/support/:path*",
    "/settings",
    "/settings/:path*",
    "/profile",
    "/profile/:path*",
    "/login",
    // Locale-aware routes. This runs on every /calculators/* request, but the
    // proxy function itself only rewrites ones in MIGRATED_LOCALE_PATHS (see
    // src/lib/locale.ts) — everything else just falls through unchanged.
    "/",
    "/hi",
    "/hi/:path*",
    "/en",
    "/en/:path*",
    "/calculators/:path*",
  ],
};

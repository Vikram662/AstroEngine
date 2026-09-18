import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("astro_session_role")?.value;
  const email = request.cookies.get("astro_session_email")?.value;

  const isAuthenticated = Boolean(email && role);

  // 1. Protect Admin routes: Strictly only ADMIN / SUPER_ADMIN permitted (§14.16)
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
    "/login"
  ],
};


import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isFrontofficeProtectedRoute, matchesRoutePrefix } from "@/lib/frontoffice-routes";

const frontofficeAuthRoutes = new Set(["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"]);
const backofficeLoginRoute = "/backoffice/login";
const backofficeProtectedRoutePrefixes = ["/backoffice/dashboard"];

function getSafeRedirectTarget(request: NextRequest, fallback: string, expectedPrefix?: string) {
  const redirect = request.nextUrl.searchParams.get("redirect");

  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return fallback;
  }

  if (expectedPrefix && !redirect.startsWith(expectedPrefix)) {
    return fallback;
  }

  return redirect;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasFrontofficeToken = !!request.cookies.get("arcetis_token")?.value;
  const hasBackofficeToken = !!request.cookies.get("arcetis_backoffice_token")?.value;

  if (pathname.startsWith("/backoffice")) {
    const isProtectedBackofficeRoute = backofficeProtectedRoutePrefixes.some((prefix) =>
      matchesRoutePrefix(pathname, prefix)
    );

    if (!hasBackofficeToken && isProtectedBackofficeRoute && pathname !== backofficeLoginRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = backofficeLoginRoute;
      loginUrl.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const isProtectedFrontofficeRoute = isFrontofficeProtectedRoute(pathname);

  if (!hasFrontofficeToken && isProtectedFrontofficeRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (hasFrontofficeToken && frontofficeAuthRoutes.has(pathname)) {
    const target = getSafeRedirectTarget(request, "/");
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
    "/tasks/:path*",
    "/spin/:path*",
    "/giveaways/:path*",
    "/rewards/:path*",
    "/requests/:path*",
    "/referrals/:path*",
    "/profile/:path*",
    "/backoffice/:path*"
  ]
};

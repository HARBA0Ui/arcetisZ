export const frontofficeProtectedRoutePrefixes = [
  "/dashboard",
  "/tasks",
  "/spin",
  "/giveaways",
  "/rewards",
  "/requests",
  "/referrals",
  "/profile"
] as const;

export const frontofficeProtectedRouteMatchers = frontofficeProtectedRoutePrefixes.map(
  (prefix) => `${prefix}/:path*`
);

export function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isFrontofficeProtectedRoute(pathname: string) {
  return frontofficeProtectedRoutePrefixes.some((prefix) => matchesRoutePrefix(pathname, prefix));
}

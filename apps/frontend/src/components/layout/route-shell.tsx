"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedShellLoading } from "@/components/layout/protected-shell-loading";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { useAuthToken } from "@/hooks/use-auth-token";
import { isFrontofficeProtectedRoute } from "@/lib/frontoffice-routes";
import { getSafeRedirectPath } from "@/lib/navigation";

function subscribeToHydration() {
  return () => undefined;
}

export function RouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const token = useAuthToken();
  const isProtectedRoute = isFrontofficeProtectedRoute(pathname);
  const hasToken = mounted ? !!token : false;

  useEffect(() => {
    if (!mounted || !isProtectedRoute || hasToken) return;

    const redirectPath = getSafeRedirectPath(
      `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`,
      "/"
    );
    const target = `/login?redirect=${encodeURIComponent(redirectPath)}`;
    startNavigation(target);
    router.replace(target);
  }, [hasToken, isProtectedRoute, mounted, pathname, router, startNavigation]);

  if (!isProtectedRoute) {
    return <>{children}</>;
  }

  if (!mounted || !hasToken) {
    return (
      <ProtectedShellLoading
        message={!mounted || hasToken ? "Opening your Arcetis workspace..." : "Redirecting to sign in..."}
      />
    );
  }

  return <AppShell>{children}</AppShell>;
}

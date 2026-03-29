"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BackofficeRouteLoading } from "@/backoffice/components/backoffice/route-loading";
import { useBackofficeAuthToken } from "@/backoffice/hooks/use-auth-token";
import { useMe } from "@/backoffice/hooks/useAuth";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSessionError } from "@/backoffice/lib/api";

export function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const token = useBackofficeAuthToken();
  const { data: user, isLoading, isError, error } = useMe();
  const shouldRedirect = !token || (!isLoading && !user && (!isError || isSessionError(error, { includeNotFound: true })));

  useEffect(() => {
    if (shouldRedirect) {
      const target = "/backoffice/login";
      startNavigation(target);

      if (typeof window !== "undefined") {
        window.location.replace(target);
        return;
      }

      router.replace(target);
    }
  }, [router, shouldRedirect, startNavigation]);

  if (!token || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <BackofficeRouteLoading label={!token ? "Redirecting to backoffice login..." : "Loading Arcetis backoffice..."} />
      </div>
    );
  }

  if (!user) {
    if (isError && !isSessionError(error, { includeNotFound: true })) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-10">
          <BackofficeRouteLoading label="We could not verify the admin session right now." />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <BackofficeRouteLoading label="Finishing your admin session..." />
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This backoffice is restricted to admin accounts.
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoLoader } from "@/components/common/logo-loader";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { useAuthToken } from "@/hooks/use-auth-token";
import { isSessionError } from "@/lib/api";
import { useMe } from "@/hooks/useAuth";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const { data: user, isLoading, isError, error } = useMe();
  const hasToken = !!useAuthToken();
  const shouldRedirect = !hasToken || (!isLoading && !user && (!isError || isSessionError(error, { includeNotFound: true })));

  useEffect(() => {
    if (shouldRedirect) {
      startNavigation("/login");
      router.replace("/login");
    }
  }, [router, shouldRedirect, startNavigation]);

  if (!hasToken) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LogoLoader message="Redirecting to sign in..." compact />
      </div>
    );
  }

  if (isLoading && !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LogoLoader message="Loading your Arcetis workspace..." compact />
      </div>
    );
  }

  if (!user) {
    if (isError && !isSessionError(error, { includeNotFound: true })) {
      return (
        <div className="mx-auto max-w-6xl px-4 py-10">
          <LogoLoader message="We could not verify your session right now. Please refresh." compact />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LogoLoader message="Redirecting to sign in..." compact />
      </div>
    );
  }

  return <>{children}</>;
}

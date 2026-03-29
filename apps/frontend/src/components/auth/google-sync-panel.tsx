"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArcetisLogo } from "@/components/common/arcetis-logo";
import { Spinner } from "@/components/common/spinner";
import { useLanguage, type AppLanguage } from "@/components/i18n/language-provider";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearToken, setPendingLevelUp, setStoredUser, setToken } from "@/lib/auth";
import { levelFromXp } from "@/lib/level";
import { getSafeRedirectPath } from "@/lib/navigation";
import type { User } from "@/lib/types";

type AuthResponse = {
  user: User;
  loginBonus?: {
    awardedXp: number;
    awardedPoints: number;
    streakUpdated: boolean;
  };
};

function getGoogleSyncCopy(language: AppLanguage) {
  if (language === "ar") {
    return {
      checkingSession: "جارٍ التحقق من جلسة Google...",
      signingIn: "جارٍ تسجيل دخولك...",
      signInFailed: "فشل تسجيل الدخول عبر Google",
      title: "تسجيل الدخول عبر Google",
      description: "جارٍ مزامنة حسابك في Arcetis."
    };
  }

  return {
    checkingSession: "Checking your Google session...",
    signingIn: "Signing you in...",
    signInFailed: "Google sign-in failed",
    title: "Google sign-in",
    description: "Syncing your Arcetis account."
  };
}

async function exchangeGoogleSession(fallbackMessage: string) {
  const response = await fetch("/api/auth/google/exchange", {
    method: "POST",
    credentials: "include",
    headers: {
      "x-arcetis-auth-scope": "frontoffice"
    }
  });

  const payload = (await response.json().catch(() => ({}))) as AuthResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? fallbackMessage);
  }

  return payload;
}

export function GoogleSyncPanel() {
  const { language } = useLanguage();
  const copy = useMemo(() => getGoogleSyncCopy(language), [language]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigationProgress();
  const { status } = useSession();
  const [message, setMessage] = useState(copy.checkingSession);
  const hasStarted = useRef(false);
  const redirectParam = searchParams.get("redirect");
  const redirectPath = getSafeRedirectPath(redirectParam, "/");
  const signInPath = `/login?redirect=${encodeURIComponent(redirectPath)}`;

  useEffect(() => {
    if (!hasStarted.current) {
      setMessage(copy.checkingSession);
    }
  }, [copy.checkingSession]);

  useEffect(() => {
    if (status === "unauthenticated") {
      startNavigation(signInPath);
      router.replace(signInPath);
      return;
    }

    if (status !== "authenticated" || hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    setMessage(copy.signingIn);

    void exchangeGoogleSession(copy.signInFailed)
      .then((result) => {
        setToken();
        setStoredUser(result.user);
        if (result.loginBonus?.awardedXp) {
          const previousXp = Math.max(result.user.xp - result.loginBonus.awardedXp, 0);
          const previousLevel = levelFromXp(previousXp);

          if (result.user.level > previousLevel) {
            setPendingLevelUp({
              previousLevel,
              currentLevel: result.user.level,
              awardedXp: result.loginBonus.awardedXp,
              awardedPoints: result.loginBonus.awardedPoints,
              source: "daily-login"
            });
          }
        }
        startNavigation(redirectPath);
        router.replace(redirectPath);
      })
      .catch(async (error) => {
        clearToken();
        setMessage(error instanceof Error ? error.message : copy.signInFailed);
        await signOut({ redirect: false });
        startNavigation(signInPath);
        router.replace(signInPath);
      });
  }, [copy.signInFailed, copy.signingIn, redirectPath, router, signInPath, startNavigation, status]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <ArcetisLogo className="h-20 md:h-24" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

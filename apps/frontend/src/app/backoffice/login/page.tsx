"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArcetisLogo } from "@/components/common/arcetis-logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useToast } from "@/components/common/toast-center";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useMe, useVerifyTwoFactor } from "@/backoffice/hooks/useAuth";
import { getLoginErrorMessage, getTwoFactorErrorMessage } from "@/lib/auth-feedback";
import { getSafeBackofficeRedirectPath } from "@/lib/navigation";
import type { TwoFactorSetup } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigationProgress();
  const login = useLogin();
  const verifyTwoFactor = useVerifyTwoFactor();
  const { data: me } = useMe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const toast = useToast();
  const redirectPath = getSafeBackofficeRedirectPath(
    searchParams.get("redirect")
  );

  useEffect(() => {
    if (me?.role === "ADMIN" && !setup && !requiresTwoFactor && recoveryCodes.length === 0) {
      startNavigation(redirectPath);
      router.replace(redirectPath);
    }
  }, [me, recoveryCodes.length, redirectPath, requiresTwoFactor, router, setup, startNavigation]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const result = await login.mutateAsync({ email, password });

      if (result.requiresTwoFactorSetup && result.setup) {
        setSetup(result.setup);
        setRequiresTwoFactor(false);
        setTwoFactorCode("");
        setRecoveryCodes([]);
        toast.success(
          "Set up your authenticator",
          "Scan the QR code, add it to Google Authenticator, then enter the 6-digit code."
        );
        return;
      }

      if (result.requiresTwoFactor) {
        setSetup(null);
        setRequiresTwoFactor(true);
        setTwoFactorCode("");
        setRecoveryCodes([]);
        toast.success("Check your authenticator", "Enter the 2FA code to finish signing in.");
        return;
      }

      toast.success("Signed in", "Welcome to Arcetis backoffice");
      startNavigation(redirectPath);
      router.replace(redirectPath);
    } catch (err) {
      toast.error("Sign in failed", getLoginErrorMessage(err, { scope: "backoffice" }));
    }
  };

  const onVerifyTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const result = await verifyTwoFactor.mutateAsync({ code: twoFactorCode });

      if (result.recoveryCodes?.length) {
        setRecoveryCodes(result.recoveryCodes);
        setSetup(null);
        setRequiresTwoFactor(false);
        setTwoFactorCode("");
        toast.success("2FA enabled", "Save these recovery codes before you continue.");
        return;
      }

      toast.success("2FA verified", "Welcome to Arcetis backoffice");
      startNavigation(redirectPath);
      router.replace(redirectPath);
    } catch (err) {
      toast.error("Verification failed", getTwoFactorErrorMessage(err));
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <ArcetisLogo className="h-16 md:h-20" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Backoffice Sign in</CardTitle>
            <CardDescription>
              {recoveryCodes.length
                ? "Store these recovery codes somewhere safe. Each one works once if your authenticator is unavailable."
                : setup
                  ? "Scan the QR code with Google Authenticator, then enter the 6-digit code to finish setup."
                  : requiresTwoFactor
                ? "Enter your authenticator code or a recovery code."
                : "Admin workspace for users, quests, products, and reviews."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recoveryCodes.length ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                  <p className="text-sm font-medium">Recovery codes</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {recoveryCodes.map((code) => (
                      <div
                        key={code}
                        className="rounded-lg border border-border/70 bg-card/60 px-3 py-2 font-mono text-sm"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    startNavigation(redirectPath);
                    router.replace(redirectPath);
                  }}
                >
                  Continue to backoffice
                </Button>
              </div>
            ) : setup ? (
              <form onSubmit={onVerifyTwoFactor} className="space-y-4">
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <img src={setup.qrCodeDataUrl} alt="2FA QR code" className="rounded-xl border border-border/70 bg-white p-3" />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Manual setup secret</Label>
                      <div className="rounded-lg border border-border/70 bg-card/60 px-3 py-2 font-mono text-sm">
                        {setup.secret}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="setup-two-factor-code">Authenticator code</Label>
                      <Input
                        id="setup-two-factor-code"
                        value={twoFactorCode}
                        onChange={(event) => setTwoFactorCode(event.target.value)}
                        placeholder="123456"
                        autoComplete="one-time-code"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full" disabled={verifyTwoFactor.isPending}>
                  {verifyTwoFactor.isPending ? "Enabling 2FA..." : "Enable 2FA and continue"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSetup(null);
                    setTwoFactorCode("");
                  }}
                >
                  Back
                </Button>
              </form>
            ) : requiresTwoFactor ? (
              <form onSubmit={onVerifyTwoFactor} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="two-factor-code">Authenticator code</Label>
                  <Input
                    id="two-factor-code"
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value)}
                    placeholder="123456 or recovery code"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <Button className="w-full" disabled={verifyTwoFactor.isPending}>
                  {verifyTwoFactor.isPending ? "Verifying..." : "Verify and continue"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setRequiresTwoFactor(false);
                    setSetup(null);
                    setTwoFactorCode("");
                  }}
                >
                  Back
                </Button>
              </form>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@arcetis.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                </div>

                <Button className="w-full" disabled={login.isPending}>
                  {login.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            )}

            <p className="mt-4 text-sm text-muted-foreground">
              Need user-facing app?{" "}
              <Link href="/" className="font-medium text-foreground underline">
                Open frontoffice
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

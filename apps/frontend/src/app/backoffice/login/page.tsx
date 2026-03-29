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
import { useLogin, useMe, useResendLoginCode, useVerifyTwoFactor } from "@/backoffice/hooks/useAuth";
import { getLoginErrorMessage, getTwoFactorErrorMessage } from "@/lib/auth-feedback";
import { getSafeBackofficeRedirectPath } from "@/lib/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigationProgress();
  const login = useLogin();
  const verifyTwoFactor = useVerifyTwoFactor();
  const resendLoginCode = useResendLoginCode();
  const { data: me } = useMe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [delivery, setDelivery] = useState<"smtp" | "preview" | null>(null);
  const [previewCode, setPreviewCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const toast = useToast();
  const redirectPath = getSafeBackofficeRedirectPath(
    searchParams.get("redirect")
  );

  useEffect(() => {
    if (me?.role === "ADMIN" && !requiresTwoFactor) {
      startNavigation(redirectPath);
      router.replace(redirectPath);
    }
  }, [me, redirectPath, requiresTwoFactor, router, startNavigation]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const result = await login.mutateAsync({ email, password });

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTwoFactorCode("");
        setDelivery(result.delivery ?? null);
        setPreviewCode(result.previewCode ?? "");
        setVerificationEmail(result.user.email);
        toast.success(
          result.delivery === "preview" ? "Use the local preview code" : "Check your email",
          result.delivery === "preview"
            ? "SMTP is not configured locally, so the admin login code is shown on screen."
            : "We sent a 6-digit verification code to your admin email."
        );
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
      await verifyTwoFactor.mutateAsync({ code: twoFactorCode });
      toast.success("Code verified", "Welcome to Arcetis backoffice");
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
              {requiresTwoFactor
                ? "Enter the 6-digit code sent to your admin email to finish signing in."
                : "Admin workspace for users, quests, products, and reviews."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requiresTwoFactor ? (
              <form onSubmit={onVerifyTwoFactor} className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-background/55 p-4 text-sm text-muted-foreground">
                  <p>
                    Delivery:{" "}
                    <span className="font-medium text-foreground">
                      {delivery === "preview" ? "Local preview" : "Email"}
                    </span>
                  </p>
                  <p className="mt-2">
                    Sent to: <span className="font-medium text-foreground">{verificationEmail}</span>
                  </p>
                </div>

                {delivery === "preview" && previewCode ? (
                  <div className="rounded-xl border border-[hsl(var(--arcetis-ember))]/30 bg-[rgba(255,122,24,0.06)] p-4">
                    <p className="text-sm font-medium">Local verification preview</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      SMTP is not configured locally, so the current admin login code is shown here instead of being emailed.
                    </p>
                    <div className="mt-4 rounded-lg border border-border/70 bg-card/70 px-3 py-3 font-mono text-2xl tracking-[0.35em]">
                      {previewCode}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="two-factor-code">Verification code</Label>
                  <Input
                    id="two-factor-code"
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value)}
                    placeholder="123456"
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
                  disabled={resendLoginCode.isPending}
                  onClick={async () => {
                    try {
                      const result = await resendLoginCode.mutateAsync();
                      setDelivery(result.delivery);
                      setPreviewCode(result.previewCode ?? "");
                      toast.success(
                        result.delivery === "preview" ? "Preview code refreshed" : "New code sent",
                        result.delivery === "preview"
                          ? "A fresh admin code is now shown on screen."
                          : "We sent a new verification code to your admin email."
                      );
                    } catch (error) {
                      toast.error("Resend failed", getTwoFactorErrorMessage(error));
                    }
                  }}
                >
                  {resendLoginCode.isPending ? "Sending..." : "Send a new code"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setRequiresTwoFactor(false);
                    setTwoFactorCode("");
                    setDelivery(null);
                    setPreviewCode("");
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

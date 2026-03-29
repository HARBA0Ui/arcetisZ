"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArcetisLogo } from "@/components/common/arcetis-logo";
import { Spinner } from "@/components/common/spinner";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useToast } from "@/components/common/toast-center";
import { useLanguage } from "@/components/i18n/language-provider";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useResendVerification, useVerifyEmail } from "@/hooks/useAuth";
import { getEmailVerificationErrorMessage } from "@/lib/auth-feedback";
import { getPostAuthRedirectPath } from "@/lib/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigationProgress();
  const token = useAuthToken();
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();
  const initialPreviewCode = searchParams.get("devPreview") === "1" ? (searchParams.get("code") ?? "") : "";
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState(initialPreviewCode);
  const [previewCode, setPreviewCode] = useState(initialPreviewCode);
  const toast = useToast();
  const { language } = useLanguage();
  const isSubmitting = verifyEmail.isPending;
  const isResending = resendVerification.isPending;
  const copy =
    language === "ar"
      ? {
          verified: "تم تأكيد البريد الإلكتروني",
          verifiedHint: "حسابك جاهز الآن",
          failed: "فشل التأكيد",
          resent: "تم إرسال رمز جديد",
          resentHint: "تحقق من بريدك مرة أخرى",
          resendFailed: "تعذر إعادة الإرسال",
          title: "تأكيد البريد الإلكتروني",
          description: "أدخل الرمز المكوّن من 6 أرقام الذي وصل إلى بريدك الإلكتروني",
          email: "البريد الإلكتروني",
          code: "رمز التحقق",
          codePlaceholder: "123456",
          verify: "تأكيد البريد",
          verifying: "جارٍ التأكيد...",
          resend: "إرسال رمز جديد",
          resending: "جارٍ الإرسال...",
          backToLogin: "العودة إلى تسجيل الدخول"
        }
      : {
          verified: "Email verified",
          verifiedHint: "Your account is ready",
          failed: "Verification failed",
          resent: "New code sent",
          resentHint: "Check your inbox again",
          resendFailed: "Couldn't resend code",
          title: "Verify your email",
          description: "Enter the 6-digit code we sent to your email address",
          email: "Email",
          code: "Verification code",
          codePlaceholder: "123456",
          verify: "Verify email",
          verifying: "Verifying...",
          resend: "Send a new code",
          resending: "Sending...",
          backToLogin: "Back to sign in"
        };
  const postAuthRedirectPath = getPostAuthRedirectPath(searchParams.get("redirect"), "/");
  const previewTitle =
    language === "ar" ? "Local verification preview" : "Local verification preview";
  const previewDescription =
    language === "ar"
      ? "SMTP is not configured in this local environment, so the current verification code is shown here instead of being emailed."
      : "SMTP is not configured in this local environment, so the current verification code is shown here instead of being emailed.";
  const previewResentHint =
    language === "ar"
      ? "A fresh local preview code is ready below."
      : "A fresh local preview code is ready below.";

  useEffect(() => {
    if (!token) {
      return;
    }

    startNavigation(postAuthRedirectPath);
    router.replace(postAuthRedirectPath);
  }, [postAuthRedirectPath, router, startNavigation, token]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    try {
      await verifyEmail.mutateAsync({
        email,
        code
      });

      toast.success(copy.verified, copy.verifiedHint);
      startNavigation(postAuthRedirectPath);
      router.replace(postAuthRedirectPath);
    } catch (error) {
      toast.error(copy.failed, getEmailVerificationErrorMessage(error, language));
    }
  };

  const onResend = async () => {
    if (!email || isResending) {
      return;
    }

    try {
      const result = await resendVerification.mutateAsync({ email });

      if (result.delivery === "preview" && result.previewCode) {
        setPreviewCode(result.previewCode);
        setCode(result.previewCode);
        toast.success(copy.resent, previewResentHint);
        return;
      }

      setPreviewCode("");
      toast.success(copy.resent, copy.resentHint);
    } catch (error) {
      toast.error(copy.resendFailed, getEmailVerificationErrorMessage(error, language));
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <ArcetisLogo className="h-20 md:h-24" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewCode ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-foreground">{previewTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{previewDescription}</p>
                <div className="mt-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 font-mono text-2xl font-semibold tracking-[0.35em] text-foreground">
                  {previewCode}
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{copy.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">{copy.code}</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D+/g, "").slice(0, 6))}
                  placeholder={copy.codePlaceholder}
                  required
                />
              </div>

              <Button className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4 shrink-0" />
                    {copy.verifying}
                  </span>
                ) : (
                  copy.verify
                )}
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void onResend()}
              disabled={!email || isResending}
            >
              {isResending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4 shrink-0" />
                  {copy.resending}
                </span>
              ) : (
                copy.resend
              )}
            </Button>

            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-foreground underline">
                {copy.backToLogin}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

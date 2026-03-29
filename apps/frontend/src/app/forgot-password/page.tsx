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
import { useForgotPassword } from "@/hooks/useAuth";
import { getForgotPasswordErrorMessage } from "@/lib/auth-feedback";
import { getPostAuthRedirectPath } from "@/lib/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigationProgress();
  const token = useAuthToken();
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const toast = useToast();
  const { language } = useLanguage();
  const isSubmitting = forgotPassword.isPending;
  const copy =
    language === "ar"
      ? {
          sent: "تم إرسال رابط إعادة التعيين",
          sentHint: "إذا كان الحساب موجودًا، ستصلك رسالة بريد إلكتروني قريبًا",
          failed: "تعذر إرسال الرابط",
          title: "نسيت كلمة المرور",
          description: "أدخل بريدك الإلكتروني وسنرسل لك رابطًا لاختيار كلمة مرور جديدة",
          email: "البريد الإلكتروني",
          send: "إرسال رابط إعادة التعيين",
          sending: "جارٍ الإرسال...",
          backToLogin: "العودة إلى تسجيل الدخول"
        }
      : {
          sent: "Reset link sent",
          sentHint: "If an account exists for that email, you'll receive a message shortly",
          failed: "Couldn't send reset link",
          title: "Forgot password",
          description: "Enter your email and we'll send you a link to choose a new password",
          email: "Email",
          send: "Send reset link",
          sending: "Sending...",
          backToLogin: "Back to sign in"
        };
  const postAuthRedirectPath = getPostAuthRedirectPath(searchParams.get("redirect"), "/");
  const previewTitle = language === "ar" ? "Local reset preview" : "Local reset preview";
  const previewDescription =
    language === "ar"
      ? "SMTP is not configured in this local environment, so the reset link is shown here instead of being emailed."
      : "SMTP is not configured in this local environment, so the reset link is shown here instead of being emailed.";
  const previewHint =
    language === "ar"
      ? "A local reset link is ready below."
      : "A local reset link is ready below.";

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
      const result = await forgotPassword.mutateAsync({ email });

      if (result.delivery === "preview" && result.previewUrl) {
        setPreviewUrl(result.previewUrl);
        toast.success(copy.sent, previewHint);
        return;
      }

      setPreviewUrl("");
      toast.success(copy.sent, copy.sentHint);
    } catch (error) {
      toast.error(copy.failed, getForgotPasswordErrorMessage(error, language));
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
            {previewUrl ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-foreground">{previewTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{previewDescription}</p>
                <Link
                  href={previewUrl}
                  className="mt-3 block break-all rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm font-medium text-foreground underline"
                >
                  {previewUrl}
                </Link>
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

              <Button className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4 shrink-0" />
                    {copy.sending}
                  </span>
                ) : (
                  copy.send
                )}
              </Button>
            </form>

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

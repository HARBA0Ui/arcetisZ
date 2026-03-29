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
import { useResetPassword } from "@/hooks/useAuth";
import { getResetPasswordErrorMessage } from "@/lib/auth-feedback";
import { getPostAuthRedirectPath } from "@/lib/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigationProgress();
  const token = useAuthToken();
  const resetPassword = useResetPassword();
  const resetToken = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const toast = useToast();
  const { language } = useLanguage();
  const isSubmitting = resetPassword.isPending;
  const copy =
    language === "ar"
      ? {
          updated: "تم تحديث كلمة المرور",
          updatedHint: "أنت الآن داخل حسابك",
          failed: "تعذر إعادة التعيين",
          mismatch: "كلمتا المرور غير متطابقتين",
          mismatchHint: "أدخل نفس كلمة المرور في الحقلين",
          title: "إعادة تعيين كلمة المرور",
          description: "اختر كلمة مرور جديدة لحسابك",
          password: "كلمة المرور الجديدة",
          confirmPassword: "تأكيد كلمة المرور",
          passwordPlaceholder: "اختر كلمة مرور جديدة",
          confirmPlaceholder: "أعد كتابة كلمة المرور",
          submit: "حفظ كلمة المرور الجديدة",
          submitting: "جارٍ الحفظ...",
          invalidLink: "هذا الرابط غير صالح. اطلب رابطًا جديدًا من صفحة نسيت كلمة المرور.",
          requestNewLink: "طلب رابط جديد"
        }
      : {
          updated: "Password updated",
          updatedHint: "You're signed in now",
          failed: "Couldn't reset password",
          mismatch: "Passwords do not match",
          mismatchHint: "Enter the same password in both fields",
          title: "Reset password",
          description: "Choose a new password for your account",
          password: "New password",
          confirmPassword: "Confirm password",
          passwordPlaceholder: "Choose a new password",
          confirmPlaceholder: "Repeat your new password",
          submit: "Save new password",
          submitting: "Saving...",
          invalidLink: "This link is invalid. Request a new one from the forgot password page.",
          requestNewLink: "Request a new link"
        };
  const postAuthRedirectPath = getPostAuthRedirectPath(searchParams.get("redirect"), "/");

  useEffect(() => {
    if (!token) {
      return;
    }

    startNavigation(postAuthRedirectPath);
    router.replace(postAuthRedirectPath);
  }, [postAuthRedirectPath, router, startNavigation, token]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !resetToken) return;

    if (password !== confirmPassword) {
      toast.error(copy.mismatch, copy.mismatchHint);
      return;
    }

    try {
      await resetPassword.mutateAsync({
        token: resetToken,
        password
      });

      toast.success(copy.updated, copy.updatedHint);
      startNavigation(postAuthRedirectPath);
      router.replace(postAuthRedirectPath);
    } catch (error) {
      toast.error(copy.failed, getResetPasswordErrorMessage(error, language));
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
            {resetToken ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{copy.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={copy.passwordPlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{copy.confirmPassword}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={copy.confirmPlaceholder}
                    required
                  />
                </div>

                <Button className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="h-4 w-4 shrink-0" />
                      {copy.submitting}
                    </span>
                  ) : (
                    copy.submit
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>{copy.invalidLink}</p>
                <Link href="/forgot-password" className="font-medium text-foreground underline">
                  {copy.requestNewLink}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
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
import { useLogin } from "@/hooks/useAuth";
import { getLoginErrorMessage, isEmailVerificationRequiredError } from "@/lib/auth-feedback";
import { getPostAuthRedirectPath } from "@/lib/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigationProgress();
  const token = useAuthToken();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const toast = useToast();
  const { language } = useLanguage();
  const isSubmitting = login.isPending;
  const copy =
    language === "ar"
      ? {
          signedIn: "تم تسجيل الدخول",
          welcome: "أهلًا بعودتك إلى Arcetis",
          failed: "فشل تسجيل الدخول",
          verifyRequiredTitle: "تأكيد البريد مطلوب",
          title: "تسجيل الدخول",
          description: "ادخل إلى حساب المكافآت الخاص بك",
          email: "البريد الإلكتروني",
          password: "كلمة المرور",
          passwordPlaceholder: "كلمة المرور",
          signingIn: "جارٍ تسجيل الدخول...",
          signIn: "دخول",
          or: "أو",
          google: "المتابعة عبر Google",
          forgot: "نسيت كلمة المرور؟",
          noAccount: "ليس لديك حساب؟",
          create: "إنشاء حساب"
        }
      : {
          signedIn: "Signed in",
          welcome: "Welcome back to arcetis",
          failed: "Sign in failed",
          verifyRequiredTitle: "Email verification required",
          title: "Sign in",
          description: "Access your Arcetis rewards account",
          email: "Email",
          password: "Password",
          passwordPlaceholder: "Your password",
          signingIn: "Signing in...",
          signIn: "Sign in",
          or: "Or",
          google: "Continue with Google",
          forgot: "Forgot password?",
          noAccount: "No account yet?",
          create: "Create one"
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
    if (isSubmitting) return;

    try {
      await login.mutateAsync({ email, password });
      toast.success(copy.signedIn, copy.welcome);
      startNavigation(postAuthRedirectPath);
      router.replace(postAuthRedirectPath);
    } catch (error) {
      const message = getLoginErrorMessage(error, { scope: "frontoffice", language });

      if (isEmailVerificationRequiredError(error)) {
        toast.info(copy.verifyRequiredTitle, message);
        const verifyPath = `/verify-email?email=${encodeURIComponent(email.trim())}&redirect=${encodeURIComponent(postAuthRedirectPath)}`;
        startNavigation(verifyPath);
        router.replace(verifyPath);
        return;
      }

      toast.error(copy.failed, message);
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
          <CardContent>
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

              <div className="flex justify-end">
                <Link
                  href={`/forgot-password?redirect=${encodeURIComponent(postAuthRedirectPath)}`}
                  className="text-sm font-medium text-foreground underline underline-offset-4"
                >
                  {copy.forgot}
                </Link>
              </div>

              <Button className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4 shrink-0" />
                    {copy.signingIn}
                  </span>
                ) : (
                  copy.signIn
                )}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>{copy.or}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <GoogleAuthButton
              callbackUrl={`/auth/google/sync?redirect=${encodeURIComponent(postAuthRedirectPath)}`}
              label={copy.google}
            />

            <p className="mt-4 text-sm text-muted-foreground">
              {copy.noAccount}{" "}
              <Link href="/register" className="font-medium text-foreground underline">
                {copy.create}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

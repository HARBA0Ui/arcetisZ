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
import { useRegister } from "@/hooks/useAuth";
import { getRegisterErrorMessage } from "@/lib/auth-feedback";
import { getPostAuthRedirectPath } from "@/lib/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigationProgress();
  const token = useAuthToken();
  const register = useRegister();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const toast = useToast();
  const { language } = useLanguage();
  const isSubmitting = register.isPending;
  const copy =
    language === "ar"
      ? {
          created: "تم إرسال رمز التأكيد",
          welcome: "تحقق من بريدك لإكمال إنشاء الحساب",
          failed: "فشل التسجيل",
          title: "إنشاء حساب",
          description: "أنشئ حسابك ثم أكد بريدك الإلكتروني بالرمز الذي سنرسله لك",
          email: "البريد الإلكتروني",
          username: "اسم المستخدم",
          password: "كلمة المرور",
          passwordPlaceholder: "أنشئ كلمة مرور آمنة",
          referral: "كود الإحالة (اختياري)",
          creating: "جارٍ إنشاء الحساب...",
          create: "إنشاء حساب",
          or: "أو",
          google: "التسجيل عبر Google",
          haveAccount: "لديك حساب بالفعل؟",
          signIn: "تسجيل الدخول"
        }
      : {
          created: "Verification code sent",
          welcome: "Check your inbox to finish creating your account",
          failed: "Registration failed",
          title: "Create account",
          description: "Create your account, then verify your email with the code we send you",
          email: "Email",
          username: "Username",
          password: "Password",
          passwordPlaceholder: "Create a secure password",
          referral: "Referral code (optional)",
          creating: "Creating account...",
          create: "Create account",
          or: "Or",
          google: "Sign up with Google",
          haveAccount: "Already have an account?",
          signIn: "Sign in"
        };
  const postAuthRedirectPath = getPostAuthRedirectPath(searchParams.get("redirect"), "/");
  const previewWelcome =
    language === "ar"
      ? "Local email delivery is not configured, so the verification code will be shown on the next screen."
      : "SMTP is not configured locally, so we will show the code on the next screen.";

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
      const result = await register.mutateAsync({
        email,
        username,
        password,
        referralCode: referralCode || undefined
      });

      toast.success(copy.created, result.delivery === "preview" ? previewWelcome : copy.welcome);
      const previewQuery =
        result.delivery === "preview" && result.previewCode
          ? `&devPreview=1&code=${encodeURIComponent(result.previewCode)}`
          : "";
      const verifyPath = `/verify-email?email=${encodeURIComponent(result.email)}&redirect=${encodeURIComponent(postAuthRedirectPath)}${previewQuery}`;
      startNavigation(verifyPath);
      router.replace(verifyPath);
    } catch (error) {
      toast.error(copy.failed, getRegisterErrorMessage(error, language));
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
                <Label htmlFor="username">{copy.username}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="arcetis_hunter"
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

              <div className="space-y-2">
                <Label htmlFor="referral">{copy.referral}</Label>
                <Input
                  id="referral"
                  value={referralCode}
                  onChange={(event) => setReferralCode(event.target.value)}
                  placeholder="ARCDEMO"
                />
              </div>

              <Button className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4 shrink-0" />
                    {copy.creating}
                  </span>
                ) : (
                  copy.create
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
              {copy.haveAccount}{" "}
              <Link href="/login" className="font-medium text-foreground underline">
                {copy.signIn}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

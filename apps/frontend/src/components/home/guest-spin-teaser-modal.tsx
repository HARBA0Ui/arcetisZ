"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useLanguage, type AppLanguage } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SpinItem } from "@/lib/types";

const GuestWheelPreview = dynamic(
  () => import("@/components/spin/prize-wheel-display").then((module) => module.PrizeWheelDisplay),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[19rem] w-full max-w-[19rem] items-center justify-center rounded-[2rem] border border-white/10 bg-black/18 text-sm text-white/60">
        Loading wheel preview...
      </div>
    )
  }
);

const teaserItems: SpinItem[] = [
  { id: "guest-spin-1", label: "250 Points", points: 250, xp: 0, weight: 18, icon: "Coins" },
  { id: "guest-spin-2", label: "120 XP", points: 0, xp: 120, weight: 14, icon: "Zap" },
  { id: "guest-spin-3", label: "Bonus Reward", points: 160, xp: 45, weight: 10, icon: "Gift" },
  { id: "guest-spin-4", label: "Lucky Boost", points: 210, xp: 30, weight: 12, icon: "Sparkles" },
  { id: "guest-spin-5", label: "Starter Drop", points: 90, xp: 60, weight: 16, icon: "Star" },
  { id: "guest-spin-6", label: "Hot Streak", points: 180, xp: 80, weight: 11, icon: "Crown" }
];

function getModalCopy(language: AppLanguage) {
  if (language === "ar") {
    return {
      badge: "عجلة ترحيبية",
      title: "سجل الدخول أولًا لتفتح عجلة Arcetis الحقيقية.",
      description:
        "هذه مجرد معاينة لشكل العجلة داخل المنصة. لا يوجد دوران أو جائزة للحسابات غير المسجلة، لذلك سجّل الدخول أولًا ثم افتح العجلة من الداخل.",
      spinNow: "لف الآن",
      close: "إغلاق",
      createAccount: "إنشاء حساب",
      wheelLabel: "عرض مسبق للعجلة قبل تسجيل الدخول"
    };
  }

  return {
    badge: "Welcome spin",
    title: "Sign in first to unlock the real Arcetis wheel.",
    description:
      "This is only a visual preview of the wheel inside the platform. Guests cannot spin or earn rewards here, so sign in first and unlock the real spin from inside your account.",
    spinNow: "Spin now",
    close: "Close",
    createAccount: "Create account",
    wheelLabel: "Wheel preview before sign-in"
  };
}

export function GuestSpinTeaserModal() {
  const { language } = useLanguage();
  const copy = getModalCopy(language);
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} aria-hidden="true" />
      <div className="relative z-[1] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(8,8,8,0.96),rgba(19,19,19,0.98)_52%,rgba(64,36,11,0.92))] text-white shadow-[0_40px_130px_-48px_rgba(0,0,0,0.95)]">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label={copy.close}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/80 transition-colors hover:bg-white/12 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(300px,0.78fr)] lg:items-center">
          <div>
            <Badge className="border-white/10 bg-white/12 text-white hover:bg-white/12">
              {copy.badge}
            </Badge>
            <h2 className="mt-5 max-w-[14ch] text-4xl font-semibold tracking-tight sm:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">{copy.description}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/login?redirect=%2Fspin">
                  {copy.spinNow}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/12 bg-white/6 px-7 text-white hover:bg-white/12 hover:text-white"
              >
                <Link href="/register?redirect=%2Fspin">{copy.createAccount}</Link>
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute inset-x-10 top-8 h-44 rounded-full bg-[radial-gradient(circle,rgba(255,146,64,0.3),rgba(255,146,64,0))] blur-3xl" />
            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-black/18 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Arcetis</p>
                  <p className="text-xs text-white/58">{copy.wheelLabel}</p>
                </div>
                <Sparkles className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
              </div>

              <GuestWheelPreview items={teaserItems} size="compact" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

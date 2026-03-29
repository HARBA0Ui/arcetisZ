"use client";

import type { PrizeWheelRef } from "@mertercelik/react-prize-wheel";
import { useRef, useState } from "react";
import { Coins, Crown, Gem, Gift, Orbit, ShieldCheck, Sparkles, Star, Target, Zap } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { useLanguage } from "@/components/i18n/language-provider";
import { Spinner } from "@/components/common/spinner";
import { PrizeWheelDisplay } from "@/components/spin/prize-wheel-display";
import { SyncBanner } from "@/components/common/sync-banner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountdown } from "@/hooks/use-countdown";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { usePlaySpin, useSpinStatus, useUserStats } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const iconByName = {
  Sparkles,
  Coins,
  Star,
  Zap,
  Gem,
  Crown,
  Gift,
  ShieldCheck
} as const;

export default function SpinPage() {
  const toast = useToast();
  const spinStatus = useSpinStatus();
  const playSpin = usePlaySpin();
  const stats = useUserStats();
  const { language } = useLanguage();
  const copy =
    language === "ar"
      ? {
          title: "العجلة اليومية",
          subtitle: "دورة واحدة كل 24 ساعة. النتائج موزونة ويتم تحديدها من الخادم.",
          secure: "عجلة آمنة",
          refreshing: "جارٍ تحديث العجلة...",
          wheel: "العجلة",
          minLevel: "الحد الأدنى للمستوى",
          cooldown: "الانتظار",
          todaySpins: "دورات اليوم",
          nextSpin: "الدورة القادمة بعد",
          locking: "جارٍ تثبيت النتيجة...",
          spinning: "جارٍ الدوران...",
          spinNow: "لف الآن",
          rewardsOdds: "الجوائز والاحتمالات",
          lastResult: "آخر نتيجة",
          awarded: "تم الحصول على",
          cap: "تم تطبيق الحد اليومي. تم تقليل المكافأة حسب قواعد المنصة.",
          spinFailed: "فشل الدوران",
          spinComplete: "اكتمل الدوران"
        }
      : {
          title: "Daily Spin",
          subtitle: "One spin every 24 hours. Rewards are server-side and weighted.",
          secure: "Secure Spin Wheel",
          refreshing: "Refreshing spin wheel...",
          wheel: "Wheel",
          minLevel: "Min level",
          cooldown: "Cooldown",
          todaySpins: "Today spins",
          nextSpin: "Next spin in",
          locking: "Locking your result...",
          spinning: "Spinning...",
          spinNow: "Spin Now",
          rewardsOdds: "Rewards & Odds",
          lastResult: "Last result",
          awarded: "Awarded",
          cap: "Daily cap applied. Reward was limited by platform rules.",
          spinFailed: "Spin failed",
          spinComplete: "Spin complete"
        };
  const hasSpinData = !!spinStatus.data || !!stats.data;
  const showSyncBanner = useSmoothBusy(hasSpinData && (spinStatus.isFetching || stats.isFetching));

  const [spinPhase, setSpinPhase] = useState<"idle" | "requesting" | "spinning">("idle");
  const [lastResult, setLastResult] = useState<{
    label: string;
    points: number;
    xp: number;
    capped: boolean;
  } | null>(null);
  const prizeWheelRef = useRef<PrizeWheelRef>(null);
  const pendingResultRef = useRef<Awaited<ReturnType<typeof playSpin.mutateAsync>> | null>(null);

  const items = spinStatus.data?.items ?? [];
  const canRenderWheel = items.length >= 2 && items.length <= 24;
  const isSpinBusy = spinPhase !== "idle" || playSpin.isPending;
  const nextSpinCountdown = useCountdown(spinStatus.data?.nextAvailableAt);

  const handleSpin = async () => {
    if (!items.length || !canRenderWheel || isSpinBusy) {
      return;
    }

    setSpinPhase("requesting");

    try {
      const result = await playSpin.mutateAsync();
      const wheel = prizeWheelRef.current;

      if (!wheel) {
        throw new Error("Spin wheel is still loading. Please try again.");
      }

      pendingResultRef.current = result;
      setSpinPhase("spinning");
      wheel.spin(result.item.id);
    } catch (error) {
      pendingResultRef.current = null;
      setSpinPhase("idle");
      toast.error(copy.spinFailed, getApiError(error));
    }
  };

  const handleSpinStart = () => {
    setSpinPhase("spinning");
  };

  const handleSpinEnd = () => {
    const result = pendingResultRef.current;
    pendingResultRef.current = null;
    setSpinPhase("idle");

    if (!result) {
      return;
    }

    const spinSummary = {
      label: result.item.label,
      points: result.awardedPoints,
      xp: result.awardedXp,
      capped: result.capped
    };

    setLastResult(spinSummary);
    toast.success(copy.spinComplete, `${spinSummary.label} - +${spinSummary.points} pts, +${spinSummary.xp} XP`);
  };

  return (
    <>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        right={
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {copy.secure}
          </Badge>
        }
      />

      {showSyncBanner ? <SyncBanner message={copy.refreshing} /> : null}

      {spinStatus.data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Orbit className="h-5 w-5 text-muted-foreground" />
                {copy.wheel}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4">
              <div className="flex justify-center">
                <PrizeWheelDisplay
                  items={items}
                  prizeWheelRef={prizeWheelRef}
                  onSpinStart={handleSpinStart}
                  onSpinEnd={handleSpinEnd}
                  spinPhase={spinPhase}
                />
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  {copy.minLevel}: {spinStatus.data.minLevel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Orbit className="h-4 w-4" />
                  {copy.cooldown}: {spinStatus.data.cooldownHours}h
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Target className="h-4 w-4" />
                  {copy.todaySpins}: {spinStatus.data.spinCountToday}
                </span>
              </div>

              {spinStatus.data.nextAvailableAt ? (
                <p className="text-sm text-muted-foreground">
                  {copy.nextSpin}{" "}
                  <span className="font-medium text-foreground" title={nextSpinCountdown.longLabel}>
                    {nextSpinCountdown.shortLabel || formatDateTime(spinStatus.data.nextAvailableAt)}
                  </span>
                </p>
              ) : null}

              <Button
                className="h-11 w-full"
                disabled={
                  isSpinBusy ||
                  !canRenderWheel ||
                  !spinStatus.data.canSpin ||
                  (stats.data?.user.level ?? 1) < spinStatus.data.minLevel
                }
                onClick={handleSpin}
              >
                {spinPhase === "requesting" ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    {copy.locking}
                  </span>
                ) : spinPhase === "spinning" ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    {copy.spinning}
                  </span>
                ) : (
                  copy.spinNow
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                {copy.rewardsOdds}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-2 text-sm">
              {items.map((item) => {
                const Icon = iconByName[item.icon as keyof typeof iconByName] ?? Gift;

                return (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/40">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-muted-foreground">
                          +{item.points} pts / +{item.xp} XP
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">w: {item.weight}</Badge>
                  </div>
                );
              })}

              {lastResult ? (
                <div className="mt-4 rounded-md border border-border bg-card/70 p-3">
                  <p className="flex items-center gap-2 font-medium">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    {copy.lastResult}: {lastResult.label}
                  </p>
                  <p className="text-muted-foreground">
                    {copy.awarded}: +{lastResult.points} pts / +{lastResult.xp} XP
                  </p>
                  {lastResult.capped ? (
                    <p className="text-xs text-muted-foreground">
                      {copy.cap}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : spinStatus.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Orbit className="h-5 w-5 text-muted-foreground" />
                {copy.wheel}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4">
              <div className="flex justify-center">
                <Skeleton className="h-72 w-72 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                {copy.rewardsOdds}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-14" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

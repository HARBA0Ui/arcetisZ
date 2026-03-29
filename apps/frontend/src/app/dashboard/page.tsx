"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useMemo } from "react";
import { DeferredSection } from "@/components/common/deferred-section";
import { PageHeader } from "@/components/common/page-header";
import { Spinner } from "@/components/common/spinner";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { SyncBanner } from "@/components/common/sync-banner";
import { useToast } from "@/components/common/toast-center";
import { useLanguage, type AppLanguage } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useCompleteQuest, useQuests, useRewards, useUserStats } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";

function completedToday(lastCompletedAt?: string | null) {
  if (!lastCompletedAt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(lastCompletedAt) >= today;
}

function getDashboardCopy(language: AppLanguage) {
  if (language === "ar") {
    return {
      title: "لوحة الحساب",
      subtitle: "تابع تقدم المستوى والمهام النشطة واستعدادك للمنتجات",
      refreshing: "جارٍ تحديث لوحة الحساب...",
      level: "المستوى",
      levelValue: (level: number) => `المستوى ${level}`,
      points: "النقاط",
      pointsHint: "استخدمها في متجر المنتجات",
      xp: "الخبرة",
      xpHint: "الخبرة تؤثر على الترقية فقط",
      streak: "سلسلة الدخول",
      streakValue: (days: number) => `${days} يوم`,
      statsUnavailable: "إحصاءات لوحة الحساب غير متاحة الآن.",
      levelProgression: "تقدم المستوى",
      levelProgressionDesc: (level: number, xp: number, nextXp: number) => `المستوى ${level} | XP ${xp} / ${nextXp}`,
      dailyXpEarned: (value: number) => `الخبرة اليومية المكتسبة: ${value}`,
      dailyPointsEarned: (value: number) => `النقاط اليومية المكتسبة: ${value}`,
      tasksCompleted: (value: number) => `المهام المكتملة: ${value}`,
      ordersMade: (value: number) => `الطلبات المنجزة: ${value}`,
      levelProgressUnavailable: "بيانات تقدم المستوى غير متاحة الآن.",
      topProducts: "أفضل المنتجات",
      topProductsHint: "منتجات شائعة متاحة الآن",
      cost: (points: number) => `السعر: ${points} نقطة`,
      requiredLevel: (level: number) => `المستوى: ${level}+`,
      viewDetails: "عرض التفاصيل",
      noProducts: "لا توجد منتجات متاحة الآن.",
      spinLive: "العجلة اليومية متاحة الآن. دورة واحدة آمنة كل 24 ساعة.",
      openSpinWheel: "افتح عجلة الحظ",
      dailyTasks: "المهام اليومية",
      sponsoredTasks: "المهام الممولة",
      available: "متاحة",
      completedToday: "مكتملة اليوم",
      complete: "إكمال",
      completed: "مكتملة",
      processing: "جارٍ التنفيذ...",
      taskCompleted: "تم إكمال المهمة",
      taskFailed: "تعذر إكمال المهمة",
      noDailyTasks: "لا توجد مهام يومية متاحة.",
      dailyTasksUnavailable: "المهام اليومية غير متاحة الآن.",
      status: "الحالة",
      notSubmitted: "لم يتم الإرسال",
      openTask: "افتح المهمة",
      noSponsoredTasks: "لا توجد مهام ممولة متاحة.",
      sponsoredUnavailable: "المهام الممولة غير متاحة الآن.",
      approved: "مقبولة",
      rejected: "مرفوضة",
      pending: "قيد المراجعة"
    };
  }

  return {
    title: "Dashboard",
    subtitle: "Track level progression, active tasks, and product readiness",
    refreshing: "Refreshing dashboard...",
    level: "Level",
    levelValue: (level: number) => `Level ${level}`,
    points: "Points",
    pointsHint: "Use them in the products store",
    xp: "XP",
    xpHint: "XP only affects leveling",
    streak: "Daily streak",
    streakValue: (days: number) => `${days} day${days === 1 ? "" : "s"}`,
    statsUnavailable: "Dashboard stats are not available right now.",
    levelProgression: "Level progression",
    levelProgressionDesc: (level: number, xp: number, nextXp: number) => `Level ${level} | XP ${xp} / ${nextXp}`,
    dailyXpEarned: (value: number) => `Daily XP earned: ${value}`,
    dailyPointsEarned: (value: number) => `Daily points earned: ${value}`,
    tasksCompleted: (value: number) => `Tasks completed: ${value}`,
    ordersMade: (value: number) => `Orders made: ${value}`,
    levelProgressUnavailable: "Level progression is not available right now.",
    topProducts: "Top products",
    topProductsHint: "Popular products available right now",
    cost: (points: number) => `Cost: ${points} points`,
    requiredLevel: (level: number) => `Level: ${level}+`,
    viewDetails: "View details",
    noProducts: "No products available.",
    spinLive: "Daily Spin is live. One secure spin every 24 hours.",
    openSpinWheel: "Open Spin Wheel",
    dailyTasks: "Daily tasks",
    sponsoredTasks: "Sponsored tasks",
    available: "Available",
    completedToday: "Completed today",
    complete: "Complete",
    completed: "Completed",
    processing: "Processing...",
    taskCompleted: "Task completed",
    taskFailed: "Task failed",
    noDailyTasks: "No daily tasks available.",
    dailyTasksUnavailable: "Daily tasks are not available right now.",
    status: "Status",
    notSubmitted: "Not submitted",
    openTask: "Open task",
    noSponsoredTasks: "No sponsored tasks available.",
    sponsoredUnavailable: "Sponsored tasks are not available right now.",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending"
  };
}

function formatSubmissionStatus(status: string | undefined, copy: ReturnType<typeof getDashboardCopy>) {
  if (status === "approved") return copy.approved;
  if (status === "rejected") return copy.rejected;
  if (status === "pending") return copy.pending;
  return copy.notSubmitted;
}

export default function DashboardPage() {
  const { language } = useLanguage();
  const copy = useMemo(() => getDashboardCopy(language), [language]);
  const stats = useUserStats();
  const quests = useQuests();
  const rewards = useRewards();
  const completeQuest = useCompleteQuest();
  const toast = useToast();
  const hasCachedData = !!stats.data || !!quests.data || !!rewards.data;
  const showSyncBanner = useSmoothBusy(
    hasCachedData && (stats.isFetching || quests.isFetching || rewards.isFetching)
  );
  const activeQuestId = completeQuest.isPending ? completeQuest.variables : null;

  const progressPercent = useMemo(() => {
    if (!stats.data || stats.data.requiredForNext <= 0) return 0;
    return (stats.data.progressInLevel / stats.data.requiredForNext) * 100;
  }, [stats.data]);

  const dailyTasks = (quests.data ?? []).filter((quest) => quest.category === "DAILY").slice(0, 3);
  const sponsoredTasks = (quests.data ?? [])
    .filter((quest) => quest.category === "SPONSORED")
    .slice(0, 3);
  const isStatsBootstrapping = stats.isLoading && !stats.data;
  const dashboardSecondaryFallback = (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{copy.dailyTasks}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="mt-3 h-3 w-32" />
              <Skeleton className="mt-4 h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.sponsoredTasks}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-md border border-border p-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-3 w-32" />
              <Skeleton className="mt-2 h-3 w-24" />
              <Skeleton className="mt-4 h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        right={<Badge variant="secondary">Arcetis Core</Badge>}
      />

      {showSyncBanner ? <SyncBanner className="mb-6" message={copy.refreshing} /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        {stats.data ? (
          <>
            <StatCard label={copy.level} value={copy.levelValue(stats.data.user.level)} />
            <StatCard label={copy.points} value={`${stats.data.user.points}`} hint={copy.pointsHint} />
            <StatCard label={copy.xp} value={`${stats.data.user.xp}`} hint={copy.xpHint} />
            <StatCard label={copy.streak} value={copy.streakValue(stats.data.user.loginStreak)} />
          </>
        ) : isStatsBootstrapping ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton hint />
            <StatCardSkeleton hint />
            <StatCardSkeleton />
          </>
        ) : (
          <Card className="md:col-span-4">
            <CardContent className="p-5 text-sm text-muted-foreground">
              {copy.statsUnavailable}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{copy.levelProgression}</CardTitle>
            <CardDescription>
              {copy.levelProgressionDesc(stats.data?.level ?? 1, stats.data?.user.xp ?? 0, stats.data?.nextLevelXp ?? 0)}
            </CardDescription>
          </CardHeader>
          {stats.data ? (
            <CardContent className="space-y-4">
              <Progress value={progressPercent} />
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>{copy.dailyXpEarned(stats.data.dailyEarned.xp)}</p>
                <p>{copy.dailyPointsEarned(stats.data.dailyEarned.points)}</p>
                <p>{copy.tasksCompleted(stats.data.completedQuests)}</p>
                <p>{copy.ordersMade(stats.data.redemptions)}</p>
              </div>
            </CardContent>
          ) : isStatsBootstrapping ? (
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          ) : (
            <CardContent className="text-sm text-muted-foreground">
              {copy.levelProgressUnavailable}
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.topProducts}</CardTitle>
            <CardDescription>{copy.topProductsHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {rewards.data ? (
              <>
                {rewards.data.slice(0, 4).map((reward) => (
                  <div key={reward.id} className="rounded-md border border-border p-3">
                    <p className="font-medium">{reward.title}</p>
                    <p className="text-muted-foreground">{copy.cost(reward.pointsCost)}</p>
                    <p className="text-muted-foreground">{copy.requiredLevel(reward.minLevel)}</p>
                    <Button asChild size="sm" variant="outline" className="mt-2">
                      <Link href={`/rewards/${reward.id}`}>{copy.viewDetails}</Link>
                    </Button>
                  </div>
                ))}
                {!rewards.data.length ? <p className="text-muted-foreground">{copy.noProducts}</p> : null}
              </>
            ) : rewards.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-md border border-border p-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-24" />
                  <Skeleton className="mt-2 h-3 w-20" />
                  <Skeleton className="mt-3 h-8 w-24" />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">{copy.noProducts}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{copy.spinLive}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/spin">{copy.openSpinWheel}</Link>
          </Button>
        </CardContent>
      </Card>

      <DeferredSection fallback={dashboardSecondaryFallback}>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{copy.dailyTasks}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quests.data ? (
                <>
                  {dailyTasks.map((quest) => {
                    const doneToday = completedToday(quest.lastCompletedAt);
                    return (
                      <div key={quest.id} className="flex h-full flex-col rounded-md border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{quest.title}</p>
                          <Badge variant={doneToday ? "default" : "outline"}>
                            {doneToday ? copy.completedToday : copy.available}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          +{quest.pointsReward} pts, +{quest.xpReward} XP
                        </p>
                        <Button
                          size="sm"
                          className="mt-auto h-10 w-full"
                          disabled={completeQuest.isPending || doneToday}
                          onClick={async () => {
                            try {
                              await completeQuest.mutateAsync(quest.id);
                              toast.success(copy.taskCompleted, quest.title);
                            } catch (error) {
                              toast.error(copy.taskFailed, getApiError(error));
                            }
                          }}
                        >
                          {completeQuest.isPending && activeQuestId === quest.id ? (
                            <span className="inline-flex items-center gap-2">
                              <Spinner /> {copy.processing}
                            </span>
                          ) : doneToday ? (
                            copy.completed
                          ) : (
                            copy.complete
                          )}
                        </Button>
                      </div>
                    );
                  })}
                  {!dailyTasks.length ? (
                    <p className="text-sm text-muted-foreground">{copy.noDailyTasks}</p>
                  ) : null}
                </>
              ) : quests.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="mt-3 h-3 w-32" />
                    <Skeleton className="mt-4 h-10 w-full" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{copy.dailyTasksUnavailable}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.sponsoredTasks}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quests.data ? (
                <>
                  {sponsoredTasks.map((quest) => (
                    <div key={quest.id} className="flex h-full flex-col rounded-md border border-border p-3">
                      <p className="font-medium">{quest.title}</p>
                      <p className="text-xs text-muted-foreground">
                        +{quest.pointsReward} pts, +{quest.xpReward} XP
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {copy.status}: {formatSubmissionStatus(quest.latestSubmission?.status, copy)}
                      </p>
                      <Button size="sm" className="mt-auto h-10 w-full" asChild>
                        <Link href={`/tasks/${quest.id}`}>{copy.openTask}</Link>
                      </Button>
                    </div>
                  ))}
                  {!sponsoredTasks.length ? (
                    <p className="text-sm text-muted-foreground">{copy.noSponsoredTasks}</p>
                  ) : null}
                </>
              ) : quests.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-md border border-border p-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-3 w-32" />
                    <Skeleton className="mt-2 h-3 w-24" />
                    <Skeleton className="mt-4 h-10 w-full" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{copy.sponsoredUnavailable}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DeferredSection>
    </>
  );
}

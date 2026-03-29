"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Gem,
  Orbit,
  PartyPopper,
  Sparkles,
  Star,
  Target,
  X
} from "lucide-react";
import { DeferredSection } from "@/components/common/deferred-section";
import { SyncBanner } from "@/components/common/sync-banner";
import { LatestProductsCarousel, type HomeCarouselIntroSlide } from "@/components/home/latest-products-carousel";
import { useLanguage } from "@/components/i18n/language-provider";
import { useToast } from "@/components/common/toast-center";
import { RewardThumbnail } from "@/components/rewards/reward-thumbnail";
import { PrizeWheelDisplay } from "@/components/spin/prize-wheel-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountdown } from "@/hooks/use-countdown";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useCompleteQuest, useGiveaways, useQuests, useRewards, useSpinStatus, useUserStats } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { clearPendingLevelUp, getPendingLevelUp } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import {
  completedToday,
  DAILY_LOGIN_POINTS_REWARD,
  DAILY_LOGIN_XP_REWARD,
  isDailyLoginQuest
} from "@/lib/quests";
import { getNextRewardTarget, type RewardTarget } from "@/lib/rewards";

type LevelUpState = {
  previousLevel: number;
  currentLevel: number;
  awardedXp: number;
  awardedPoints: number;
  source: "daily-login" | "quest" | "system";
};

function formatCompactNumber(value: number) {
  return formatNumber(value);
}

function podiumIcon(rank: number) {
  if (rank === 1) {
    return {
      Icon: Crown,
      wrapperClassName: "border-amber-500/30 bg-amber-500/12 text-amber-200",
      iconClassName: "text-amber-300"
    };
  }

  if (rank === 2) {
    return {
      Icon: Gem,
      wrapperClassName: "border-slate-400/30 bg-slate-400/10 text-slate-200",
      iconClassName: "text-slate-200"
    };
  }

  return {
    Icon: Star,
    wrapperClassName: "border-orange-500/30 bg-orange-500/10 text-orange-200",
    iconClassName: "text-orange-300"
  };
}

function getSeenLevelStorageKey(userId: string) {
  return `arcetis_seen_level_${userId}`;
}

function getHomeCopy(language: "en" | "ar") {
  if (language === "ar") {
    return {
      checking: "جارٍ التحقق",
      unavailable: "غير متاح",
      claimed: "تم اليوم",
      ready: "جاهز",
      syncingDailyLogin: "جارٍ مزامنة اختصار تسجيل الدخول اليومي.",
      dailyLoginUnavailable: "مهمة تسجيل الدخول اليومي غير متاحة الآن.",
      dailyLoginClaimed: `لقد حصلت اليوم بالفعل على +${DAILY_LOGIN_POINTS_REWARD} نقطة و +${DAILY_LOGIN_XP_REWARD} خبرة.`,
      dailyLoginReady: `احصل على +${DAILY_LOGIN_POINTS_REWARD} نقطة و +${DAILY_LOGIN_XP_REWARD} خبرة قبل إعادة ضبط المؤقت اليومي.`,
      spinChecking: "جارٍ التحقق من نافذة عجلة اليوم.",
      spinReady: "جاهز",
      spinCooling: "تبريد",
      unlocksAtLevel: (level: number) => `تفتح عند المستوى ${level}.`,
      nextSpinIn: (value: string) => `الدورة التالية بعد ${value}`,
      dailySpinReady: "عجلة اليوم جاهزة.",
      dailySpinCooling: "العجلة ما زالت في فترة التبريد.",
      dailySpinUnlocked: "تم فتح العجلة اليومية",
      dailySpinUnlockedDescription: (hours: number) =>
        `أصبحت عجلة الحظ متاحة من الصفحة الرئيسية وتُعاد كل ${hours} ساعة.`,
      openSpin: "افتح العجلة",
      newTaskUnlocked: "تم فتح مهمة جديدة",
      tasksUnlocked: (count: number) => `تم فتح ${count} مهام`,
      unlockedTaskDescription: (title: string) => `${title} أصبحت متاحة الآن في صفحة المهام.`,
      unlockedTasksDescription: (titles: string) => `${titles} أصبحت متاحة الآن في صفحة المهام.`,
      viewTasks: "عرض المهام",
      rewardTierOpened: "تم فتح منتج جديد",
      rewardsOpened: (count: number) => `تم فتح ${count} منتجات`,
      rewardOpenedDescription: (title: string) => `${title} أصبح الآن ضمن مستواك الحالي.`,
      rewardsOpenedDescription: (title: string) => `${title} ومنتجات أخرى أصبحت الآن ضمن مستواك.`,
      viewRewards: "عرض المنتجات",
      ceilingMoved: "تم رفع سقف حسابك",
      ceilingMovedDescription: (level: number) =>
        `المستوى ${level} يفتح لك مساحة أكبر للمهام والعجلة والتقدم نحو المنتجات.`,
      keepGoing: "واصل التقدم",
      dailyLoginClaimedToast: "تم استلام تسجيل الدخول اليومي",
      dailyLoginClaimedToastHint: `+${DAILY_LOGIN_POINTS_REWARD} نقطة و +${DAILY_LOGIN_XP_REWARD} خبرة تمت إضافتها.`,
      dailyLoginFailedToast: "تعذر استلام تسجيل الدخول اليومي",
      introBadge: "اليوم",
      introTitle: "هل أنت جاهز لليوم؟",
      introDescription: "إذا كانت العجلة جاهزة فلفها الآن، واحصل على تسجيلك اليومي، وحافظ على تقدم مكافآتك.",
      introPrimary: "افتح عجلة الحظ",
      introSecondary: "عرض المتجر",
      progressSnapshot: "ملخص التقدم",
      xpLeft: (value: string) => `متبقي ${value} خبرة للمستوى التالي.`,
      progressAfterSync: "سيتحدث التقدم بعد أول إجراء تتم مزامنته.",
      dailyLogin: "تسجيل يومي",
      securedToday: "تم اليوم",
      claimReady: "الاستلام جاهز",
      claiming: "جارٍ الاستلام...",
      claimDailyLogin: "استلم تسجيل اليوم",
      openDailyLogin: "افتح تسجيل اليوم",
      openTasks: "افتح المهام",
      leaderboardTitle: "لوحة الصدارة",
      leaderboardSubtitle: "أفضل اللاعبين أولاً، ثم يظهر ترتيبك الحالي.",
      you: "أنت",
      levelXp: (level: number, xp: string) => `المستوى ${level} | خبرة ${xp}`,
      pointsUnit: "نقطة",
      spinTitle: "عجلة الحظ",
      spinSubtitle: "معاينة مباشرة ومختصرة لنفس العجلة الموجودة في صفحة العجلة الكاملة.",
      wheelTitle: "العجلة",
      wheelDescription: "نفس شكل العجلة، لكن بشكل مختصر للصفحة الرئيسية.",
      minLevel: "الحد الأدنى للمستوى",
      cooldown: "فترة التبريد",
      todaySpins: "لفات اليوم",
      livePreview: "معاينة مباشرة",
      wheelReadyTitle: "عجلتك جاهزة.",
      wheelCoolingTitle: "عجلتك في فترة التبريد.",
      openSpinWheel: "افتح عجلة الحظ",
      nextAffordableReward: "أقرب منتج يمكنك الحصول عليه",
      nextAffordableRewardSubtitle: "هذا هو الهدف الأقرب بناءً على رصيدك الحالي.",
      target: "الهدف",
      statusLabel: "الحالة",
      gap: "المتبقي",
      readyNow: "جاهز",
      needsPoints: (value: string) => `تحتاج ${value} نقطة`,
      levelShort: (level: number) => `مستوى ${level}`,
      dayLock: (days: number) => `${days} يوم انتظار`,
      nextUp: "التالي",
      rewardCovered: "رصيدك الحالي يغطي هذا المنتج بالفعل.",
      reachLevel: (level: number) => `الوصول إلى المستوى ${level}`,
      waitDays: (days: number) => `انتظار ${days} ${days === 1 ? "يوم" : "أيام"} إضافية`,
      bankPoints: (value: string) => `جمع ${value} نقطة إضافية`,
      unlockSummary: (items: string) => `لفتح هذا المنتج، ${items}.`,
      nextRewardTargetSummary: "هذا هو أقرب منتج لك الآن.",
      requiresLevelAndDays: (level: number, days: number) =>
        `يتطلب المستوى ${level} وعمر حساب ${days} ${days === 1 ? "يوم" : "أيام"}.`,
      requiresLevelOnly: (level: number) => `يتطلب المستوى ${level}.`,
      viewTarget: "عرض الهدف",
      noRewards: "لا توجد منتجات متاحة الآن.",
      refreshingHome: "جارٍ تحديث الصفحة الرئيسية...",
      closeLevelUp: "إغلاق نافذة رفع المستوى",
      levelUp: "ترقية مستوى",
      levelUpSourceDaily: "تسجيلك اليومي دفع حسابك إلى المستوى التالي. هذا ما تم فتحه لك الآن.",
      levelUpSourceGeneric: (previousLevel: number, currentLevel: number) =>
        `انتقلت للتو من المستوى ${previousLevel} إلى المستوى ${currentLevel}.`,
      gain: "المكسب",
      promotion: "الترقية",
      gatesUpdateImmediately: "شروط المستوى في المهام والعجلة والمنتجات تتحدث فوراً عند تجاوزك لها.",
      close: "إغلاق"
    };
  }

  return {
    checking: "Checking",
    unavailable: "Unavailable",
    claimed: "Claimed",
    ready: "Ready",
    syncingDailyLogin: "Syncing your daily login shortcut.",
    dailyLoginUnavailable: "The daily login task is not available right now.",
    dailyLoginClaimed: `You already secured +${DAILY_LOGIN_POINTS_REWARD} pts and +${DAILY_LOGIN_XP_REWARD} XP today.`,
    dailyLoginReady: `Claim +${DAILY_LOGIN_POINTS_REWARD} pts and +${DAILY_LOGIN_XP_REWARD} XP before the daily timer resets.`,
    spinChecking: "Checking today's spin window.",
    spinReady: "Ready",
    spinCooling: "Cooling",
    unlocksAtLevel: (level: number) => `Unlocks at level ${level}.`,
    nextSpinIn: (value: string) => `Next spin in ${value}`,
    dailySpinReady: "Your daily spin is ready.",
    dailySpinCooling: "Your wheel is cooling down.",
    dailySpinUnlocked: "Daily spin unlocked",
    dailySpinUnlockedDescription: (hours: number) =>
      `The spin wheel is now live from home and resets every ${hours} hours.`,
    openSpin: "Open Spin",
    newTaskUnlocked: "New task unlocked",
    tasksUnlocked: (count: number) => `${count} tasks unlocked`,
    unlockedTaskDescription: (title: string) => `${title} is now available from your task board.`,
    unlockedTasksDescription: (titles: string) => `${titles} are now available from your task board.`,
    viewTasks: "View Tasks",
    rewardTierOpened: "Reward tier opened",
    rewardsOpened: (count: number) => `${count} rewards opened`,
    rewardOpenedDescription: (title: string) => `${title} just moved into your level range.`,
    rewardsOpenedDescription: (title: string) => `${title} and more rewards are now inside your level range.`,
    viewRewards: "View Rewards",
    ceilingMoved: "Your account ceiling just moved",
    ceilingMovedDescription: (level: number) =>
      `Level ${level} opens more room for quests, spins, and reward progress.`,
    keepGoing: "Keep Going",
    dailyLoginClaimedToast: "Daily login claimed",
    dailyLoginClaimedToastHint: `+${DAILY_LOGIN_POINTS_REWARD} pts and +${DAILY_LOGIN_XP_REWARD} XP secured.`,
    dailyLoginFailedToast: "Daily login unavailable",
    introBadge: "Today",
    introTitle: "Ready for today?",
    introDescription: "Spin if it is live, secure your daily login, and keep your rewards moving forward.",
    introPrimary: "Open Spin Wheel",
    introSecondary: "View Rewards Store",
    progressSnapshot: "Progress Snapshot",
    xpLeft: (value: string) => `${value} XP left for the next level.`,
    progressAfterSync: "Progress updates after your next synced action.",
    dailyLogin: "Daily Login",
    securedToday: "Secured today",
    claimReady: "Claim ready",
    claiming: "Claiming...",
    claimDailyLogin: "Claim Daily Login",
    openDailyLogin: "Open Daily Login",
    openTasks: "Open Tasks",
    leaderboardTitle: "Leaderboard",
    leaderboardSubtitle: "Top players first, then your current position.",
    you: "You",
    levelXp: (level: number, xp: string) => `Level ${level} | XP ${xp}`,
    pointsUnit: "pts",
    spinTitle: "Spin Wheel",
    spinSubtitle: "A compact live preview of the same wheel on the full spin page.",
    wheelTitle: "Wheel",
    wheelDescription: "Same wheel styling, just condensed for home.",
    minLevel: "Min level",
    cooldown: "Cooldown",
    todaySpins: "Today spins",
    livePreview: "Live preview",
    wheelReadyTitle: "Your wheel is ready.",
    wheelCoolingTitle: "Your wheel is cooling down.",
    openSpinWheel: "Open Spin Wheel",
    nextAffordableReward: "Next Affordable Reward",
    nextAffordableRewardSubtitle: "Your balance points here next.",
    target: "Target",
    statusLabel: "Status",
    gap: "Gap",
    readyNow: "Ready",
    needsPoints: (value: string) => `Need ${value} pts`,
    levelShort: (level: number) => `Lvl ${level}`,
    dayLock: (days: number) => `${days}d lock`,
    nextUp: "Next up",
    rewardCovered: "Your current balance already covers this reward.",
    reachLevel: (level: number) => `reach level ${level}`,
    waitDays: (days: number) => `wait ${days} more ${days === 1 ? "day" : "days"}`,
    bankPoints: (value: string) => `bank ${value} more points`,
    unlockSummary: (items: string) => `To unlock this next, ${items}.`,
    nextRewardTargetSummary: "This is your next reward target.",
    requiresLevelAndDays: (level: number, days: number) =>
      `Requires level ${level} and ${days} account day${days === 1 ? "" : "s"}.`,
    requiresLevelOnly: (level: number) => `Requires level ${level}.`,
    viewTarget: "View target",
    noRewards: "No rewards are available right now.",
    refreshingHome: "Refreshing home...",
    closeLevelUp: "Close level up modal",
    levelUp: "Level Up",
    levelUpSourceDaily: "Daily login pushed your account into the next bracket. Here's what opened up.",
    levelUpSourceGeneric: (previousLevel: number, currentLevel: number) =>
      `You just moved from level ${previousLevel} to level ${currentLevel}.`,
    gain: "Gain",
    promotion: "Promotion",
    gatesUpdateImmediately: "Level gates across tasks, spins, and rewards react immediately when you cross them.",
    close: "Close"
  };
}

function getLocalizedRewardTargetStatusLabel(target: RewardTarget, copy: ReturnType<typeof getHomeCopy>) {
  if (target.canRedeemNow) return copy.readyNow;
  if (!target.levelNeeded && !target.daysNeeded && target.pointsNeeded > 0) {
    return copy.needsPoints(formatCompactNumber(target.pointsNeeded));
  }
  if (target.levelNeeded > 0) return copy.levelShort(target.reward.minLevel);
  if (target.daysNeeded > 0) return copy.dayLock(target.daysNeeded);
  return copy.nextUp;
}

function getLocalizedRewardTargetSummary(
  target: RewardTarget,
  copy: ReturnType<typeof getHomeCopy>,
  language: "en" | "ar"
) {
  if (target.canRedeemNow) {
    return copy.rewardCovered;
  }

  const blockers: string[] = [];
  if (target.levelNeeded > 0) blockers.push(copy.reachLevel(target.reward.minLevel));
  if (target.daysNeeded > 0) blockers.push(copy.waitDays(target.daysNeeded));
  if (target.pointsNeeded > 0) blockers.push(copy.bankPoints(formatCompactNumber(target.pointsNeeded)));

  return blockers.length ? copy.unlockSummary(blockers.join(language === "ar" ? " و " : " and ")) : copy.nextRewardTargetSummary;
}

export function MemberHomePage() {
  const toast = useToast();
  const { language, t } = useLanguage();
  const stats = useUserStats();
  const rewards = useRewards();
  const giveaways = useGiveaways();
  const spinStatus = useSpinStatus();
  const quests = useQuests();
  const completeQuest = useCompleteQuest();
  const [levelUpState, setLevelUpState] = useState<LevelUpState | null>(null);
  const hasCachedData = !!stats.data || !!rewards.data || !!giveaways.data || !!spinStatus.data || !!quests.data;
  const showSyncBanner = useSmoothBusy(
    hasCachedData &&
      (stats.isFetching || rewards.isFetching || giveaways.isFetching || spinStatus.isFetching || quests.isFetching)
  );
  const leaderboard = stats.data?.leaderboard ?? [];
  const currentLeaderboardRank = stats.data?.leaderboardRank ?? null;
  const progressPercent =
    stats.data && stats.data.requiredForNext > 0
      ? (stats.data.progressInLevel / stats.data.requiredForNext) * 100
      : 0;
  const remainingXp =
    stats.data && stats.data.requiredForNext > 0
      ? Math.max(stats.data.requiredForNext - stats.data.progressInLevel, 0)
      : null;
  const rewardTarget = rewards.data && stats.data ? getNextRewardTarget(rewards.data, stats.data.user) : null;
  const activeGiveaway = giveaways.data?.find((giveaway) => giveaway.status === "ACTIVE") ?? null;
  const copy = useMemo(() => getHomeCopy(language), [language]);
  const spinCountdown = useCountdown(spinStatus.data?.nextAvailableAt);
  const giveawayCountdown = useCountdown(activeGiveaway?.endsAt);
  const dailyLoginQuest = useMemo(
    () => (quests.data ?? []).find((quest) => isDailyLoginQuest(quest)) ?? null,
    [quests.data]
  );
  const dailyLoginClaimed = completedToday(dailyLoginQuest?.lastCompletedAt ?? stats.data?.user.lastLogin ?? null);
  const dailyLoginHref = dailyLoginQuest ? `/tasks/${dailyLoginQuest.id}` : "/tasks";
  const dailyLoginStatus = !quests.data
    ? copy.checking
    : !dailyLoginQuest
      ? copy.unavailable
      : dailyLoginClaimed
        ? copy.claimed
        : copy.ready;
  const dailyLoginSummary = !quests.data
    ? copy.syncingDailyLogin
    : !dailyLoginQuest
      ? copy.dailyLoginUnavailable
      : dailyLoginClaimed
        ? copy.dailyLoginClaimed
        : copy.dailyLoginReady;

  const spinLabel = !spinStatus.data
    ? copy.checking
    : spinStatus.data.blockedByLevel
      ? copy.levelShort(spinStatus.data.minLevel)
      : spinStatus.data.canSpin
        ? copy.spinReady
        : copy.spinCooling;
  const spinHint = !spinStatus.data
    ? copy.spinChecking
    : spinStatus.data.blockedByLevel
      ? copy.unlocksAtLevel(spinStatus.data.minLevel)
      : spinStatus.data.canSpin
        ? copy.dailySpinReady
        : spinCountdown.isReady
          ? copy.dailySpinReady
          : copy.nextSpinIn(spinCountdown.shortLabel);
  const topThree = leaderboard.slice(0, 3);
  const currentUserInTopThree = stats.data
    ? topThree.some((entry) => entry.id === stats.data.user.id)
    : false;
  const levelUpUnlocks = useMemo(() => {
    if (!levelUpState) {
      return [];
    }

    const unlocks: Array<{
      title: string;
      description: string;
      href: string;
      cta: string;
    }> = [];
    const previousLevel = levelUpState.previousLevel;
    const currentLevel = levelUpState.currentLevel;

    if (spinStatus.data && previousLevel < spinStatus.data.minLevel && currentLevel >= spinStatus.data.minLevel) {
      unlocks.push({
        title: copy.dailySpinUnlocked,
        description: copy.dailySpinUnlockedDescription(spinStatus.data.cooldownHours),
        href: "/spin",
        cta: copy.openSpin
      });
    }

    const unlockedTasks = (quests.data ?? []).filter(
      (quest) =>
        !isDailyLoginQuest(quest) &&
        quest.minLevel > previousLevel &&
        quest.minLevel <= currentLevel
    );

    if (unlockedTasks.length) {
      unlocks.push({
        title: unlockedTasks.length === 1 ? copy.newTaskUnlocked : copy.tasksUnlocked(unlockedTasks.length),
        description:
          unlockedTasks.length === 1
            ? copy.unlockedTaskDescription(unlockedTasks[0].title)
            : copy.unlockedTasksDescription(
                unlockedTasks
                  .slice(0, 2)
                  .map((quest) => quest.title)
                  .join(language === "ar" ? " و " : " and ")
              ),
        href: "/tasks",
        cta: copy.viewTasks
      });
    }

    const unlockedRewards = (rewards.data ?? []).filter(
      (reward) => reward.minLevel > previousLevel && reward.minLevel <= currentLevel
    );

    if (unlockedRewards.length) {
      unlocks.push({
        title: unlockedRewards.length === 1 ? copy.rewardTierOpened : copy.rewardsOpened(unlockedRewards.length),
        description:
          unlockedRewards.length === 1
            ? copy.rewardOpenedDescription(unlockedRewards[0].title)
            : copy.rewardsOpenedDescription(unlockedRewards[0].title),
        href: "/rewards",
        cta: copy.viewRewards
      });
    }

    if (!unlocks.length) {
      unlocks.push({
        title: copy.ceilingMoved,
        description: copy.ceilingMovedDescription(currentLevel),
        href: "/tasks",
        cta: copy.keepGoing
      });
    }

    return unlocks;
  }, [copy, language, levelUpState, spinStatus.data, quests.data, rewards.data]);

  useEffect(() => {
    if (!stats.data?.user.id) {
      return;
    }

    const storageKey = getSeenLevelStorageKey(stats.data.user.id);
    const currentLevel = stats.data.user.level;
    const pending = getPendingLevelUp();
    const storedLevel = window.localStorage.getItem(storageKey);
    const seenLevel = storedLevel ? Number(storedLevel) : null;

    if (pending && pending.currentLevel === currentLevel && pending.currentLevel > pending.previousLevel) {
      setLevelUpState(pending);
      clearPendingLevelUp();
      window.localStorage.setItem(storageKey, String(currentLevel));
      return;
    }

    if (seenLevel === null || Number.isNaN(seenLevel)) {
      window.localStorage.setItem(storageKey, String(currentLevel));
      return;
    }

    if (currentLevel > seenLevel) {
      setLevelUpState({
        previousLevel: seenLevel,
        currentLevel,
        awardedXp: 0,
        awardedPoints: 0,
        source: "system"
      });
      window.localStorage.setItem(storageKey, String(currentLevel));
      return;
    }

    if (currentLevel !== seenLevel) {
      window.localStorage.setItem(storageKey, String(currentLevel));
    }
  }, [stats.data?.user.id, stats.data?.user.level]);

  useEffect(() => {
    if (!levelUpState) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [levelUpState]);

  async function handleDailyLoginClaim() {
    if (!dailyLoginQuest || dailyLoginClaimed || completeQuest.isPending) {
      return;
    }

    try {
      await completeQuest.mutateAsync(dailyLoginQuest.id);
      toast.success(copy.dailyLoginClaimedToast, copy.dailyLoginClaimedToastHint);
    } catch (error) {
      toast.error(copy.dailyLoginFailedToast, getApiError(error));
    }
  }

  const introSlide = useMemo<HomeCarouselIntroSlide>(
    () => ({
      theme: "member",
      badge: copy.introBadge,
      title: copy.introTitle,
      description: copy.introDescription,
      primaryAction: {
        href: "/spin",
        label: copy.introPrimary
      },
      secondaryAction: {
        href: "/rewards",
        label: copy.introSecondary
      }
    }),
    [copy]
  );

  const progressSnapshotPanel = stats.data ? (
    <Card className="relative flex h-full w-full flex-col overflow-hidden rounded-tl-[1.9rem] rounded-tr-[1.9rem] border border-white/12 bg-[linear-gradient(180deg,rgba(20,12,9,0.82),rgba(34,18,9,0.74))] text-white shadow-[0_24px_72px_-42px_rgba(0,0,0,0.55)] backdrop-blur-md">
      <CardHeader className="px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <CardDescription className="text-[11px] uppercase tracking-[0.34em] text-white/56">{copy.progressSnapshot}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.06] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/56">{t("level")}</p>
            <p className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">
              {t("minimumLevel", { level: stats.data.user.level }).replace("+", "")}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.06] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/56">{t("menuPoints")}</p>
            <p className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">
              {formatCompactNumber(stats.data.user.points)}
            </p>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-white/10 bg-black/18 p-3.5">
          <div className="flex items-center justify-between gap-3 text-sm text-white/68">
            <span>
              XP {formatCompactNumber(stats.data.progressInLevel)} / {formatCompactNumber(stats.data.requiredForNext)}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="mt-3 h-2 bg-white/10"
            indicatorClassName="bg-[linear-gradient(90deg,rgba(255,122,24,0.96),rgba(255,171,110,0.88))]"
          />
          <p className="mt-3 text-sm leading-5 text-white/66">
            {remainingXp !== null
              ? copy.xpLeft(formatCompactNumber(remainingXp))
              : copy.progressAfterSync}
          </p>
        </div>

        <div className="rounded-[1.35rem] border border-[rgba(255,122,24,0.22)] bg-[linear-gradient(145deg,rgba(255,122,24,0.16),rgba(255,255,255,0.03))] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
                {copy.dailyLogin}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                <p className="text-base font-semibold tracking-tight">
                  {dailyLoginClaimed ? copy.securedToday : copy.claimReady}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                dailyLoginClaimed
                  ? "shrink-0 border-white/14 bg-white/[0.06] text-white"
                  : "shrink-0 border-[rgba(255,122,24,0.24)] bg-[rgba(255,122,24,0.16)] text-white"
              }
            >
              {dailyLoginStatus}
            </Badge>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/68">{dailyLoginSummary}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {dailyLoginQuest && !dailyLoginClaimed ? (
              <Button
                type="button"
                size="sm"
                onClick={handleDailyLoginClaim}
                disabled={completeQuest.isPending}
                className="rounded-lg bg-[hsl(var(--arcetis-ember))] text-black hover:bg-[rgba(255,122,24,0.92)]"
              >
                {completeQuest.isPending ? copy.claiming : copy.claimDailyLogin}
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-lg border-white/12 bg-white/[0.06] text-white hover:bg-white/[0.12]"
              >
                <Link href={dailyLoginHref}>
                  {dailyLoginQuest ? copy.openDailyLogin : copy.openTasks}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  ) : (
    <Card className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.9rem] border border-white/12 bg-[linear-gradient(180deg,rgba(20,12,9,0.82),rgba(34,18,9,0.74))] text-white shadow-[0_24px_72px_-42px_rgba(0,0,0,0.55)] backdrop-blur-md">
      <CardHeader className="px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <CardDescription className="text-[11px] uppercase tracking-[0.34em] text-white/56">{copy.progressSnapshot}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-[1.35rem] bg-white/8" />
          <Skeleton className="h-24 rounded-[1.35rem] bg-white/8" />
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-black/18 p-3.5">
          <Skeleton className="h-4 w-40 bg-white/8" />
          <Skeleton className="mt-3 h-2 w-full bg-white/8" />
          <Skeleton className="mt-3 h-4 w-48 bg-white/8" />
        </div>
        <div className="rounded-[1.35rem] border border-[rgba(255,122,24,0.22)] bg-[linear-gradient(145deg,rgba(255,122,24,0.16),rgba(255,255,255,0.03))] p-3.5">
          <Skeleton className="h-4 w-28 bg-white/8" />
          <Skeleton className="mt-3 h-5 w-40 bg-white/8" />
          <Skeleton className="mt-3 h-4 w-full bg-white/8" />
          <Skeleton className="mt-3 h-9 w-36 rounded-lg bg-white/8" />
        </div>
      </CardContent>
    </Card>
  );

  const leaderboardPanel = (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{copy.leaderboardTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.leaderboardSubtitle}</p>
      </div>

      <div className="space-y-3 rounded-[1.8rem] border border-border/70 bg-card/90 p-4 shadow-sm">
        {stats.data ? (
          <>
            {topThree.map((entry, index) => {
              const rank = index + 1;
              const { Icon, wrapperClassName, iconClassName } = podiumIcon(rank);
              const isCurrentUser = entry.id === stats.data.user.id;

              return (
                <div
                  key={entry.id}
                  className="grid gap-3 rounded-[1.35rem] border border-border/70 bg-[linear-gradient(145deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${wrapperClassName}`}
                    >
                      <Icon className={`h-5 w-5 ${iconClassName}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="shrink-0 font-medium text-foreground/78">#{rank}</p>
                        <p className="truncate font-medium" title={entry.username}>
                          {entry.username}
                        </p>
                        {isCurrentUser ? <Badge variant="secondary">{copy.you}</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {copy.levelXp(entry.level, formatCompactNumber(entry.xp))}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-border/70 bg-background/75 px-3 py-1 text-sm font-semibold sm:justify-self-end">
                    {formatCompactNumber(entry.points)} {copy.pointsUnit}
                  </span>
                </div>
              );
            })}

            {!currentUserInTopThree && stats.data ? (
              <>
                <div className="flex items-center justify-center py-1 text-sm tracking-[0.5em] text-muted-foreground">
                  ...
                </div>
                <div className="grid gap-3 rounded-[1.35rem] border border-primary/20 bg-primary/[0.06] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.08] text-sm font-semibold text-foreground">
                      #{currentLeaderboardRank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate font-medium" title={stats.data.user.username}>
                          {stats.data.user.username}
                        </p>
                        <Badge variant="secondary">{copy.you}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {copy.levelXp(stats.data.user.level, formatCompactNumber(stats.data.user.xp))}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-primary/20 bg-background/75 px-3 py-1 text-sm font-semibold sm:justify-self-end">
                    {formatCompactNumber(stats.data.user.points)} {copy.pointsUnit}
                  </span>
                </div>
              </>
            ) : null}
          </>
        ) : (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-[1.25rem]" />
          ))
        )}
      </div>
    </div>
  );

  const spinPanel = (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{copy.spinTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.spinSubtitle}</p>
      </div>

      <Card className="flex h-full flex-col rounded-[1.8rem] border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Orbit className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold tracking-tight">{copy.wheelTitle}</p>
              <CardDescription>{copy.wheelDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4">
          <div className="flex justify-center">
            {spinStatus.data?.items?.length ? (
              <PrizeWheelDisplay items={spinStatus.data.items} size="compact" />
            ) : (
              <Skeleton className="h-64 w-full max-w-[19rem] rounded-[2rem]" />
            )}
          </div>

          {spinStatus.data ? (
            <>
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

              <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={spinStatus.data.canSpin ? "default" : "outline"}>{spinLabel}</Badge>
                  <Badge variant="outline">{copy.livePreview}</Badge>
                </div>
                <p className="mt-4 text-lg font-semibold">
                  {spinStatus.data.canSpin ? copy.wheelReadyTitle : copy.wheelCoolingTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{spinHint}</p>
              </div>

              <Button asChild className="mt-auto w-full justify-between rounded-xl">
                <Link href="/spin">
                  {copy.openSpinWheel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-24 w-full rounded-[1.15rem]" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const rewardPanel = (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{copy.nextAffordableReward}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.nextAffordableRewardSubtitle}</p>
      </div>

      {rewards.data && stats.data ? (
        rewardTarget ? (
          <div className="flex h-full flex-col rounded-[1.6rem] border border-border/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.84),_rgba(255,248,242,0.94))] p-5 shadow-[0_22px_60px_-46px_rgba(255,122,24,0.35)] dark:bg-[linear-gradient(180deg,_rgba(18,18,18,0.92),_rgba(10,10,10,0.98))]">
            <div className="mx-auto w-full max-w-[320px]">
              <RewardThumbnail
                title={rewardTarget.reward.title}
                imageUrl={rewardTarget.reward.imageUrl}
                className="aspect-square w-full"
              />
            </div>

            <div className="mt-5">
              <Badge
                variant={rewardTarget.canRedeemNow ? "default" : "outline"}
                className={
                  rewardTarget.canRedeemNow
                    ? "bg-[hsl(var(--arcetis-ember))] text-black hover:bg-[hsl(var(--arcetis-ember))]"
                    : "border-[rgba(255,122,24,0.22)] bg-[rgba(255,122,24,0.08)] text-foreground"
                }
              >
                {getLocalizedRewardTargetStatusLabel(rewardTarget, copy)}
              </Badge>
              <p className="mt-4 text-2xl font-semibold tracking-tight" title={rewardTarget.reward.title}>
                {rewardTarget.reward.title}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {getLocalizedRewardTargetSummary(rewardTarget, copy, language)}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-[1rem] border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{copy.target}</p>
                  <p className="mt-1 font-semibold">{formatCompactNumber(rewardTarget.reward.pointsCost)} {copy.pointsUnit}</p>
                </div>
                <div className="rounded-[1rem] border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("balance")}</p>
                  <p className="mt-1 font-semibold">{formatCompactNumber(stats.data.user.points)} {copy.pointsUnit}</p>
                </div>
                <div className="rounded-[1rem] border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {rewardTarget.canRedeemNow ? copy.statusLabel : copy.gap}
                  </p>
                  <p className="mt-1 font-semibold">
                    {rewardTarget.canRedeemNow ? copy.readyNow : `${formatCompactNumber(rewardTarget.pointsNeeded)} ${copy.pointsUnit}`}
                  </p>
                </div>
              </div>

              {rewardTarget.levelNeeded > 0 || rewardTarget.daysNeeded > 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {rewardTarget.daysNeeded > 0
                    ? copy.requiresLevelAndDays(rewardTarget.reward.minLevel, rewardTarget.reward.minAccountAge)
                    : copy.requiresLevelOnly(rewardTarget.reward.minLevel)}
                </p>
              ) : null}

              <Button
                asChild
                variant="outline"
                className="mt-5 w-full justify-between rounded-xl border-[rgba(255,122,24,0.2)] bg-background/80 hover:bg-[rgba(255,122,24,0.06)]"
              >
                <Link href={`/rewards/${rewardTarget.reward.id}`}>
                  {copy.viewTarget}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-border/70 bg-background/65 p-5 text-sm text-muted-foreground">
            {copy.noRewards}
          </div>
        )
      ) : (
        <Skeleton className="h-[34rem] w-full rounded-[1.5rem]" />
      )}
    </div>
  );

  const giveawayPanel = (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Giveaway</h2>
        <p className="mt-1 text-sm text-muted-foreground">A quick check for whether a live giveaway is running right now.</p>
      </div>

      <Card className="rounded-[1.6rem] border-border/70 bg-card/90 shadow-sm">
        <CardContent className="space-y-4 p-5">
          {giveaways.data ? (
            activeGiveaway ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <PartyPopper className="h-3.5 w-3.5" />
                    Live giveaway
                  </Badge>
                  {activeGiveaway.viewerEntry ? (
                    <Badge variant={activeGiveaway.viewerEntry.status === "selected" ? "default" : activeGiveaway.viewerEntry.status === "pending" ? "secondary" : "outline"}>
                      {activeGiveaway.viewerEntry.status === "selected"
                        ? "Selected"
                        : activeGiveaway.viewerEntry.status === "pending"
                          ? "Applied"
                          : "Not selected"}
                    </Badge>
                  ) : null}
                </div>

                <div>
                  <p className="text-lg font-semibold tracking-tight">{activeGiveaway.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {activeGiveaway.prizeSummary || "Open the giveaway page to see the prize and entry rules."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1rem] border border-border/60 bg-background/80 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Winners</p>
                    <p className="mt-1 font-semibold">
                      {formatCompactNumber(activeGiveaway.selectedCount ?? 0)} / {formatCompactNumber(activeGiveaway.winnerCount ?? 1)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/60 bg-background/80 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                    <p className="mt-1 font-semibold">
                      {activeGiveaway.endsAt
                        ? giveawayCountdown.isReady
                          ? "Closing now"
                          : `Ends in ${giveawayCountdown.shortLabel}`
                        : "No deadline"}
                    </p>
                  </div>
                </div>

                <Button asChild className="w-full justify-between rounded-xl">
                  <Link href={`/giveaways/${activeGiveaway.id}`}>
                    {activeGiveaway.viewerEntry ? "Open my entry" : "Open giveaway"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <div className="rounded-[1.15rem] border border-dashed border-border/70 bg-background/55 p-4 text-sm text-muted-foreground">
                No live giveaway right now. Check back later for the next drop.
              </div>
            )
          ) : (
            <Skeleton className="h-36 w-full rounded-[1.2rem]" />
          )}
        </CardContent>
      </Card>
    </div>
  );

  const secondaryPanelsFallback = (
    <section className="grid gap-8 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] xl:items-start [&>*]:min-w-0">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[24rem] w-full rounded-[1.8rem]" />
        <Skeleton className="h-[24rem] w-full rounded-[1.6rem]" />
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[34rem] w-full rounded-[1.6rem]" />
      </div>
    </section>
  );

  return (
    <>
      {showSyncBanner ? <SyncBanner className="mb-6" message={copy.refreshingHome} /> : null}

      <div className="space-y-6">
        <section className="[&>*]:min-w-0">
          <LatestProductsCarousel
            introSlide={introSlide}
            introAside={progressSnapshotPanel}
            rewards={rewards.data}
            user={stats.data?.user}
            isLoading={rewards.isLoading || rewards.isFetching}
            autoplayMs={3800}
          />
        </section>

        <DeferredSection fallback={secondaryPanelsFallback}>
          <section className="grid gap-8 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] xl:items-start [&>*]:min-w-0">
            <div className="flex flex-col gap-6">
              {leaderboardPanel}
              {spinPanel}
            </div>
            <div className="flex flex-col gap-6">
              {rewardPanel}
              {giveawayPanel}
            </div>
          </section>
        </DeferredSection>
      </div>

      {levelUpState ? (
        <div className="arcetis-levelup-backdrop fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={copy.closeLevelUp}
            className="absolute inset-0 bg-black/78 backdrop-blur-md"
            onClick={() => setLevelUpState(null)}
          />
          <div className="arcetis-levelup-panel relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(8,8,8,0.98),_rgba(16,16,16,0.97)_52%,_rgba(56,31,11,0.94))] p-6 text-white shadow-[0_42px_140px_-52px_rgba(0,0,0,0.95)] sm:p-8">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,hsl(var(--arcetis-ember)),transparent)]" />
              <div className="arcetis-levelup-scan absolute left-0 top-0 h-32 w-full bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-40" />
              <div className="absolute -right-14 top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,122,24,0.28),rgba(255,122,24,0))] blur-3xl" />
            </div>

            <button
              type="button"
              onClick={() => setLevelUpState(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/76 transition-colors hover:bg-white/[0.12] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.38em] text-white/48">{copy.levelUp}</p>
                  <h3 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                    {t("minimumLevel", { level: levelUpState.currentLevel }).replace("+", "")}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/72">
                    {levelUpState.source === "daily-login"
                      ? copy.levelUpSourceDaily
                      : copy.levelUpSourceGeneric(levelUpState.previousLevel, levelUpState.currentLevel)}
                  </p>
                </div>

                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-right">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/46">{copy.gain}</p>
                  <p className="mt-2 text-lg font-semibold">+{levelUpState.awardedXp} XP</p>
                  <p className="text-sm text-white/66">+{levelUpState.awardedPoints} {copy.pointsUnit}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
                <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-5">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/52">
                    <Sparkles className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                    {copy.promotion}
                  </div>
                  <div className="mt-6 flex items-end gap-3">
                    <span className="text-5xl font-semibold text-white/34">{levelUpState.previousLevel}</span>
                    <ArrowRight className="mb-3 h-5 w-5 text-[hsl(var(--arcetis-ember))]" />
                    <span className="text-7xl font-semibold leading-none">{levelUpState.currentLevel}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/64">
                    {copy.gatesUpdateImmediately}
                  </p>
                </div>

                <div className="space-y-3">
                  {levelUpUnlocks.map((unlock) => (
                    <div
                      key={unlock.title}
                      className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[rgba(255,122,24,0.24)] bg-[rgba(255,122,24,0.12)] text-[hsl(var(--arcetis-ember))]">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-semibold">{unlock.title}</p>
                          <p className="mt-1 text-sm leading-6 text-white/66">{unlock.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-full bg-[hsl(var(--arcetis-ember))] px-6 text-black hover:bg-[rgba(255,122,24,0.92)]"
                >
                  <Link href={levelUpUnlocks[0]?.href ?? "/tasks"}>
                    {levelUpUnlocks[0]?.cta ?? copy.keepGoing}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/[0.06] px-6 text-white hover:bg-white/[0.12]"
                  onClick={() => setLevelUpState(null)}
                >
                  {copy.close}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

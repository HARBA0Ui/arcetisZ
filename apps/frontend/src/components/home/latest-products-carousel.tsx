"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Package2, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import { RewardThumbnail } from "@/components/rewards/reward-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { Reward, User } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const carouselThemes = [
  "bg-[radial-gradient(circle_at_top_left,rgba(255,164,95,0.2),transparent_26%),radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.1),transparent_18%),linear-gradient(135deg,rgba(8,8,8,0.98),rgba(21,17,13,0.96)_46%,rgba(66,29,4,0.92))]",
  "bg-[radial-gradient(circle_at_top_left,rgba(126,226,255,0.18),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(255,173,104,0.14),transparent_20%),linear-gradient(135deg,rgba(8,8,8,0.98),rgba(11,24,28,0.96)_46%,rgba(37,22,10,0.92))]",
  "bg-[radial-gradient(circle_at_top_left,rgba(168,255,196,0.14),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(255,164,95,0.16),transparent_18%),linear-gradient(135deg,rgba(8,8,8,0.98),rgba(16,21,17,0.96)_44%,rgba(56,30,12,0.92))]"
];
const introThemes = {
  member: {
    shell:
      "bg-[radial-gradient(circle_at_14%_18%,rgba(255,169,94,0.18),transparent_22%),linear-gradient(135deg,rgba(10,10,10,0.98),rgba(18,18,18,0.96)_54%,rgba(58,29,8,0.94))]",
    accent: "bg-[hsl(var(--arcetis-ember))] text-black hover:bg-[rgba(255,122,24,0.92)]",
    secondary: "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
    panel: "border-white/10 bg-black/20",
    metric: "border-white/10 bg-white/[0.05]"
  },
  public: {
    shell:
      "bg-[radial-gradient(circle_at_12%_18%,rgba(255,171,94,0.22),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(98,190,255,0.16),transparent_24%),linear-gradient(135deg,rgba(10,10,10,0.96),rgba(27,30,38,0.96)_54%,rgba(50,35,18,0.92))]",
    accent: "bg-white text-black hover:bg-white/90",
    secondary: "border border-white/12 bg-white/10 text-white hover:bg-white/16",
    panel: "border-white/10 bg-black/18",
    metric: "border-white/10 bg-white/[0.05]"
  }
} as const;

export type HomeCarouselIntroSlide = {
  theme?: "member" | "public";
  badge: string;
  title: string;
  description: string;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  highlights?: string[];
  metricsTitle?: string;
  metrics?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
};

type CarouselSlide =
  | {
      type: "intro";
      key: string;
      intro: HomeCarouselIntroSlide;
    }
  | {
      type: "reward";
      key: string;
      reward: Reward;
    };

function formatCompactNumber(value: number) {
  return formatNumber(value);
}

function formatAddedDate(value: string, locale: string, prefix: string, fallback: string) {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return `${prefix} ${formatter.format(date)}`;
}

function getAccountAgeDays(createdAt?: string) {
  if (!createdAt) {
    return 0;
  }

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return 0;
  }

  return Math.max(Math.floor((Date.now() - created.getTime()) / DAY_MS), 0);
}

function getProductState(reward: Reward, user?: Pick<User, "points" | "level" | "createdAt"> | null) {
  if (reward.stock <= 0) {
    return {
      label: "Unavailable",
      detail: "This product is currently unavailable.",
      badgeClassName: "border-white/12 bg-white/[0.06] text-white/74"
    };
  }

  if (!user) {
    return {
      label: "Explore",
      detail: "Open the rewards store to check your current eligibility.",
      badgeClassName: "border-[rgba(255,122,24,0.22)] bg-[rgba(255,122,24,0.14)] text-white"
    };
  }

  if (user.level < reward.minLevel) {
    return {
      label: `Level ${reward.minLevel}`,
      detail: `Reach level ${reward.minLevel} to unlock this product.`,
      badgeClassName: "border-white/12 bg-white/[0.06] text-white/78"
    };
  }

  const accountAgeDays = getAccountAgeDays(user.createdAt);
  if (accountAgeDays < reward.minAccountAge) {
    const remainingDays = reward.minAccountAge - accountAgeDays;

    return {
      label: `${remainingDays} day${remainingDays === 1 ? "" : "s"} left`,
      detail: `Your account needs ${remainingDays} more day${remainingDays === 1 ? "" : "s"} to unlock it.`,
      badgeClassName: "border-white/12 bg-white/[0.06] text-white/78"
    };
  }

  if (user.points < reward.pointsCost) {
    const pointsGap = reward.pointsCost - user.points;

    return {
      label: `${formatCompactNumber(pointsGap)} pts left`,
      detail: `You are ${formatCompactNumber(pointsGap)} points away from redeeming it.`,
      badgeClassName: "border-[rgba(255,122,24,0.22)] bg-[rgba(255,122,24,0.14)] text-white"
    };
  }

  return {
    label: "Ready now",
    detail: "You currently meet the level, age, and balance requirements.",
    badgeClassName: "border-emerald-400/20 bg-emerald-400/14 text-emerald-100"
  };
}

export function LatestProductsCarousel({
  introSlide,
  introAside,
  rewards,
  user,
  isLoading,
  primaryLinkMode = "reward",
  size = "default",
  autoplayMs = 3800,
  secondaryHref = "/rewards",
  secondaryLabel = "Browse Rewards Store",
  className
}: {
  introSlide?: HomeCarouselIntroSlide;
  introAside?: ReactNode;
  rewards?: Reward[];
  user?: Pick<User, "points" | "level" | "createdAt"> | null;
  isLoading?: boolean;
  primaryLinkMode?: "reward" | "signin";
  size?: "default" | "compact";
  autoplayMs?: number;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  const rewardSlides = useMemo(() => {
    const rewardList = rewards ?? [];
    const source = rewardList.some((reward) => reward.stock > 0)
      ? rewardList.filter((reward) => reward.stock > 0)
      : rewardList;

    return [...source]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 5);
  }, [rewards]);
  const slideList = useMemo<CarouselSlide[]>(
    () => [
      ...(introSlide ? [{ type: "intro", key: "intro", intro: introSlide } satisfies CarouselSlide] : []),
      ...rewardSlides.map(
        (reward) =>
          ({
            type: "reward",
            key: reward.id,
            reward
          }) satisfies CarouselSlide
      )
    ],
    [introSlide, rewardSlides]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { language } = useLanguage();
  const safeActiveIndex = slideList.length ? activeIndex % slideList.length : 0;
  const isCompact = size === "compact";
  const hasIntroAside = !!introAside && !isCompact;
  const copy =
    language === "ar"
      ? {
          latestProducts: "أحدث المنتجات",
          emptyTitle: "رف المنتجات فارغ الآن.",
          emptyDescription: "ستظهر المنتجات الجديدة هنا بمجرد توفرها في المتجر.",
          addedPrefix: "أضيف",
          addedFallback: "أضيف مؤخرًا",
          unavailable: "غير متاح",
          unavailableDetail: "هذا المنتج غير متاح حاليًا.",
          explore: "استكشف",
          exploreDetail: "افتح صفحة المنتجات لمعرفة أهليتك الحالية.",
          reachLevel: (level: number) => `صل إلى المستوى ${level} لفتح هذا المنتج.`,
          daysLeft: (days: number) => `متبقي ${days} يوم`,
          daysDetail: (days: number) => `حسابك يحتاج ${days} يوم إضافي ليفتح هذا المنتج.`,
          ptsLeft: (points: string) => `متبقي ${points} نقطة`,
          ptsDetail: (points: string) => `أنت تحتاج ${points} نقطة للحصول عليه.`,
          readyNow: "جاهز الآن",
          readyDetail: "أنت تستوفي حاليًا شروط المستوى والعمر والرصيد.",
          prev: "الشريحة السابقة",
          next: "الشريحة التالية",
          latestProduct: "أحدث منتج",
          cost: "السعر",
          level: "المستوى",
          plans: "الخطط",
          accountAge: "شرط عمر الحساب",
          viewProduct: "عرض المنتج",
          rewardStoreProduct: "منتج من المتجر"
        }
      : {
          latestProducts: "Latest Products",
          emptyTitle: "The rewards shelf is empty right now.",
          emptyDescription: "New products will show up here as soon as they are available in the store.",
          addedPrefix: "Added",
          addedFallback: "Recently added",
          unavailable: "Unavailable",
          unavailableDetail: "This product is currently unavailable.",
          explore: "Explore",
          exploreDetail: "Open the rewards store to check your current eligibility.",
          reachLevel: (level: number) => `Reach level ${level} to unlock this product.`,
          daysLeft: (days: number) => `${days} day${days === 1 ? "" : "s"} left`,
          daysDetail: (days: number) => `Your account needs ${days} more day${days === 1 ? "" : "s"} to unlock it.`,
          ptsLeft: (points: string) => `${points} pts left`,
          ptsDetail: (points: string) => `You are ${points} points away from redeeming it.`,
          readyNow: "Ready now",
          readyDetail: "You currently meet the level, age, and balance requirements.",
          prev: "Previous slide",
          next: "Next slide",
          latestProduct: "Latest Product",
          cost: "Cost",
          level: "Level",
          plans: "Plans",
          accountAge: "day account age requirement",
          viewProduct: "View Product",
          rewardStoreProduct: "Reward store product"
        };

  useEffect(() => {
    if (isPaused || slideList.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideList.length);
    }, autoplayMs);

    return () => window.clearInterval(timer);
  }, [autoplayMs, isPaused, slideList.length]);

  if (isLoading && !slideList.length) {
    return <Skeleton className={cn("w-full rounded-[2rem]", isCompact ? "h-[25rem] sm:h-[26rem]" : "h-[29rem]")} />;
  }

  if (!slideList.length) {
    return (
      <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{copy.latestProducts}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{copy.emptyTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {copy.emptyDescription}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={secondaryHref}>
              {secondaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.82)]",
        isCompact ? "h-full" : "",
        className
      )}
      aria-roledescription="carousel"
      aria-label={language === "ar" ? "واجهة الصفحة الرئيسية" : "Home spotlight"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      {slideList.length > 1 ? (
        <div className={cn("absolute z-20 flex items-center gap-2", isCompact ? "right-4 top-4" : "right-5 top-5")}>
          <div
            className={cn(
              "rounded-full border border-white/18 bg-black/70 font-semibold text-white shadow-[0_8px_24px_-16px_rgba(0,0,0,0.9)] backdrop-blur",
              isCompact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
            )}
          >
            {safeActiveIndex + 1} / {slideList.length}
          </div>
          <button
            type="button"
            aria-label={copy.prev}
            onClick={() => setActiveIndex((current) => (current - 1 + slideList.length) % slideList.length)}
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-white/14 bg-white/[0.08] text-white shadow-[0_14px_32px_-18px_rgba(0,0,0,0.95)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.04] hover:border-[hsl(var(--arcetis-ember))] hover:bg-[hsl(var(--arcetis-ember))] hover:text-black",
              isCompact ? "h-10 w-10" : "h-11 w-11"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={copy.next}
            onClick={() => setActiveIndex((current) => (current + 1) % slideList.length)}
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-white/14 bg-white/[0.08] text-white shadow-[0_14px_32px_-18px_rgba(0,0,0,0.95)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.04] hover:border-[hsl(var(--arcetis-ember))] hover:bg-[hsl(var(--arcetis-ember))] hover:text-black",
              isCompact ? "h-10 w-10" : "h-11 w-11"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "relative",
          isCompact ? "h-full min-h-[23rem] sm:min-h-[24rem] xl:min-h-0" : "min-h-[32rem] md:min-h-[30rem]"
        )}
      >
        {slideList.map((slide, index) => {
          const isActive = index === safeActiveIndex;

          if (slide.type === "intro") {
            const theme = introThemes[slide.intro.theme ?? "member"];

            return (
              <article
                key={slide.key}
                className={cn(
                  "absolute inset-0 flex flex-col justify-between text-white transition-all duration-500 ease-out",
                  isCompact ? "p-5 sm:p-6" : "px-7 py-10 sm:px-9 sm:py-11",
                  theme.shell,
                  isActive ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-8 opacity-0"
                )}
                aria-hidden={!isActive}
              >
                <div
                  className={cn(
                    "relative z-10 h-full",
                    hasIntroAside ? "grid gap-7 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:items-stretch" : "flex flex-col justify-between pb-2"
                  )}
                >
                  <div className={cn(hasIntroAside ? "flex h-full flex-col justify-between pb-2" : "")}>
                    <div>
                      <Badge className="border-white/10 bg-white/12 text-white hover:bg-white/12">
                        {slide.intro.badge}
                      </Badge>

                      <h2
                        className={cn(
                          "max-w-3xl font-semibold tracking-tight",
                          isCompact
                            ? "mt-4 max-w-[11ch] text-[2rem] leading-[0.94] sm:text-[2.3rem]"
                            : hasIntroAside
                              ? "mt-7 max-w-[8ch] text-4xl leading-[0.96] sm:text-[3.45rem]"
                              : "mt-6 text-4xl sm:text-5xl lg:text-6xl"
                        )}
                      >
                      {slide.intro.title}
                      </h2>
                      <p
                        className={cn(
                          "max-w-2xl text-white/72",
                          isCompact
                            ? "mt-3 max-w-[34rem] text-sm leading-6 sm:text-[0.95rem]"
                            : hasIntroAside
                              ? "mt-6 max-w-[26rem] text-[1.02rem] leading-7"
                              : "mt-5 text-base leading-7 sm:text-lg"
                        )}
                      >
                        {slide.intro.description}
                      </p>

                      <div className={cn("flex flex-wrap gap-3", isCompact ? "mt-5" : hasIntroAside ? "mt-9" : "mt-8")}>
                        <Button asChild size={isCompact ? "default" : "lg"} className={cn("rounded-full", isCompact ? "px-5" : "px-7", theme.accent)}>
                          <Link href={slide.intro.primaryAction.href}>
                            {slide.intro.primaryAction.label}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        {slide.intro.secondaryAction ? (
                          <Button
                            asChild
                            size={isCompact ? "default" : "lg"}
                            variant="secondary"
                            className={cn("rounded-full", isCompact ? "px-5" : "px-7", theme.secondary)}
                          >
                            <Link href={slide.intro.secondaryAction.href}>{slide.intro.secondaryAction.label}</Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {slide.intro.highlights?.length ? (
                      <div className={cn("flex flex-wrap text-white/68", isCompact ? "mt-5 gap-2 text-[11px] sm:text-xs" : hasIntroAside ? "mt-10 gap-3 text-sm" : "mt-8 gap-3 text-sm")}>
                        {slide.intro.highlights.map((highlight) => (
                          <span key={highlight} className={cn("rounded-full border border-white/10 bg-white/[0.06]", isCompact ? "px-3 py-1.5" : "px-4 py-2")}>
                            {highlight}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {hasIntroAside ? (
                    <div className="relative z-10 lg:pl-6">
                      {introAside}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          }

          const reward = slide.reward;
          const productState = getProductState(reward, user);
          const translatedState =
            productState.label === "Unavailable"
              ? copy.unavailable
              : productState.label === "Explore"
                ? copy.explore
                : productState.label === "Ready now"
                  ? copy.readyNow
                  : reward.stock <= 0
                    ? copy.unavailable
                    : productState.label.includes("pts left")
                      ? copy.ptsLeft(productState.label.replace(" pts left", ""))
                      : productState.label.includes("day") && productState.label.includes("left")
                        ? copy.daysLeft(Number.parseInt(productState.label, 10) || 0)
                        : productState.label.startsWith("Level ")
                          ? productState.label
                          : productState.label;
          const translatedDetail =
            productState.detail === "This product is currently unavailable."
              ? copy.unavailableDetail
              : productState.detail === "Open the rewards store to check your current eligibility."
                ? copy.exploreDetail
                : productState.detail === "You currently meet the level, age, and balance requirements."
                  ? copy.readyDetail
                  : productState.detail.startsWith("Reach level ")
                    ? copy.reachLevel(reward.minLevel)
                    : productState.detail.includes("points away")
                      ? copy.ptsDetail(formatCompactNumber(Math.max(reward.pointsCost - (user?.points ?? 0), 0)))
                      : productState.detail.includes("more day")
                        ? copy.daysDetail(Math.max(reward.minAccountAge - getAccountAgeDays(user?.createdAt), 0))
                        : productState.detail;
          const primaryHref =
            primaryLinkMode === "signin"
              ? `/login?redirect=${encodeURIComponent(`/rewards/${reward.id}`)}`
              : `/rewards/${reward.id}`;

          return (
            <article
              key={slide.key}
              className={cn(
                "absolute inset-0 grid text-white transition-all duration-500 ease-out",
                isCompact
                  ? "gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.48fr)] sm:items-center sm:gap-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(176px,0.54fr)]"
                  : "gap-8 px-6 py-8 sm:gap-10 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)] lg:items-center",
                carouselThemes[index % carouselThemes.length],
                isActive ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-8 opacity-0"
              )}
              aria-hidden={!isActive}
            >
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("border-white/12 bg-white/[0.06] text-white hover:bg-white/[0.06]", isCompact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1")}>
                      <Sparkles className="mr-2 h-3.5 w-3.5 text-[hsl(var(--arcetis-ember))]" />
                      {copy.latestProduct}
                    </Badge>
                    <Badge className={cn(isCompact ? "px-2.5 py-1 text-[11px] hover:bg-inherit" : "px-3 py-1 hover:bg-inherit", productState.badgeClassName)}>
                      {translatedState}
                    </Badge>
                  </div>

                  <p className={cn("uppercase tracking-[0.28em] text-white/58", isCompact ? "mt-4 text-[11px]" : "mt-5 text-xs")}>{formatAddedDate(reward.createdAt, language === "ar" ? "ar" : "en-US", copy.addedPrefix, copy.addedFallback)}</p>
                  <h2
                    className={cn(
                      "font-semibold tracking-tight",
                      isCompact ? "mt-3 max-w-[10ch] text-[1.85rem] leading-[0.92] sm:text-[2.15rem]" : "mt-4 max-w-2xl text-3xl sm:text-4xl"
                    )}
                  >
                    {reward.title}
                  </h2>
                  <p
                    className={cn(
                      "text-white/72",
                      isCompact ? "mt-3 max-w-[28rem] text-sm leading-6 line-clamp-2" : "mt-4 max-w-2xl text-sm leading-7 sm:text-base"
                    )}
                  >
                    {reward.description}
                  </p>
                </div>

                <div className={cn(isCompact ? "mt-4" : "mt-8")}>
                  <div className={cn("grid grid-cols-3", isCompact ? "gap-2" : "gap-3")}>
                    <div className={cn("rounded-[1.15rem] border border-white/10 bg-white/[0.05]", isCompact ? "p-3" : "p-4")}>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">{copy.cost}</p>
                      <p className={cn("mt-2 font-semibold", isCompact ? "text-base leading-tight" : "text-lg")}>{formatCompactNumber(reward.pointsCost)} pts</p>
                    </div>
                    <div className={cn("rounded-[1.15rem] border border-white/10 bg-white/[0.05]", isCompact ? "p-3" : "p-4")}>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">{copy.level}</p>
                      <p className={cn("mt-2 font-semibold", isCompact ? "text-base leading-tight" : "text-lg")}>Level {reward.minLevel}+</p>
                    </div>
                    <div className={cn("rounded-[1.15rem] border border-white/10 bg-white/[0.05]", isCompact ? "p-3" : "p-4")}>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">{copy.plans}</p>
                      <p className={cn("mt-2 font-semibold", isCompact ? "text-base leading-tight" : "text-lg")}>{reward.plans?.length ?? 1}</p>
                    </div>
                  </div>

                  <div className={cn("flex flex-wrap items-center gap-2 text-white/68", isCompact ? "mt-4 text-sm leading-6" : "mt-5 text-sm")}>
                    <ShieldCheck className={cn("text-[hsl(var(--arcetis-ember))]", isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                    <span className={cn(isCompact ? "line-clamp-2 max-w-[28rem]" : "")}>{translatedDetail}</span>
                    {reward.minAccountAge > 0 ? (
                      <>
                        <Clock3 className={cn("ml-2 text-white/44", isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        <span>{reward.minAccountAge} {copy.accountAge}</span>
                      </>
                    ) : null}
                  </div>

                  <div className={cn("flex flex-wrap gap-3", isCompact ? "mt-5" : "mt-6")}>
                    <Button
                      asChild
                      size={isCompact ? "default" : "default"}
                      className={cn("rounded-full bg-[hsl(var(--arcetis-ember))] text-black hover:bg-[rgba(255,122,24,0.92)]", isCompact ? "px-4.5" : "px-6")}
                    >
                      <Link href={primaryHref}>
                        {copy.viewProduct}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      size={isCompact ? "default" : "default"}
                      className={cn("rounded-full border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]", isCompact ? "px-4.5" : "px-6")}
                    >
                      <Link href={secondaryHref}>{secondaryLabel}</Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className={cn("relative items-center justify-center", isCompact ? "hidden sm:flex sm:self-stretch sm:justify-end" : "flex")}>
                <div className={cn("absolute top-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,24,0.24),rgba(255,122,24,0))] blur-3xl", isCompact ? "inset-x-4 h-28 -translate-y-1/2" : "inset-x-8 h-48 -translate-y-1/2")} />
                <div className={cn("absolute inset-y-8 right-4 hidden w-px bg-gradient-to-b from-transparent via-white/12 to-transparent", isCompact ? "sm:block" : "lg:block")} />
                <div className={cn("relative w-full", isCompact ? "max-w-[9.75rem] lg:max-w-[10.75rem] xl:max-w-[11.5rem]" : "max-w-[24rem]")}>
                  <div className={cn("absolute h-full w-full rounded-[1.7rem] border border-white/8 bg-white/[0.04]", isCompact ? "-left-2 -top-2" : "-left-4 -top-4")} />
                  <RewardThumbnail
                    title={reward.title}
                    imageUrl={reward.imageUrl}
                    className={cn("relative w-full rounded-[1.7rem] border-white/12", isCompact ? "aspect-[0.84]" : "aspect-[1/1.05]")}
                  />
                  <div className={cn("absolute rounded-[1rem] border border-white/10 bg-black/55 backdrop-blur", isCompact ? "bottom-2 left-2 right-2 px-2.5 py-2" : "bottom-3 left-4 right-4 px-4 py-3")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn("truncate font-semibold", isCompact ? "text-xs sm:text-sm" : "text-sm")}>{reward.title}</p>
                        <p className="mt-1 text-xs text-white/58">{copy.rewardStoreProduct}</p>
                      </div>
                      <div className={cn("inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] font-semibold", isCompact ? "px-2.5 py-1 text-xs sm:text-sm" : "px-3 py-1 text-sm")}>
                        <Package2 className={cn("mr-2 text-[hsl(var(--arcetis-ember))]", isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        {formatCompactNumber(reward.pointsCost)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

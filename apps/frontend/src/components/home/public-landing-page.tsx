"use client";

import Link from "next/link";
import { ArrowRight, Flame, Gift, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { GuestSpinTeaserModal } from "@/components/home/guest-spin-teaser-modal";
import { useLanguage, type AppLanguage } from "@/components/i18n/language-provider";
import { LatestProductsCarousel, type HomeCarouselIntroSlide } from "@/components/home/latest-products-carousel";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Reward } from "@/lib/types";

function getLandingCopy(language: AppLanguage) {
  if (language === "ar") {
    return {
      navQuests: "المهام",
      navRewards: "المنتجات",
      navReferrals: "الإحالات",
      signIn: "تسجيل الدخول",
      createAccount: "إنشاء حساب",
      spotlightEyebrow: "واجهة المنتجات",
      spotlightTitle: "شاهد ما الذي يمكن للأعضاء الحصول عليه",
      spotlightDescription:
        "تشرح الشريحة الأولى المنصة، ثم تبدأ أحدث المنتجات بالدوران تلقائيًا بعدها.",
      exploreRewards: "سجل دخولك لاستكشاف المنتجات",
      introBadge: "منتجات مع حافز يومي",
      introTitle: "سبب واضح يجعلك تسجل الدخول قبل أن يضيع يومك.",
      introDescription:
        "Arcetis يحول النشاط اليومي إلى سلسلة دخول ونقاط وخبرة وعجلة ومكافآت حقيقية. سجل الدخول وواصل التقدم، أو أنشئ حسابك وابدأ من أول فوز.",
      introPrimary: "سجل الدخول وتابع",
      introSecondary: "إنشاء حساب",
      introHighlights: ["مهام يومية", "تعزيزات الإحالة", "نزولات المنتجات"],
      introMetricsTitle: "لماذا يستمر الناس",
      proofStrip: [
        { label: "دورة مباشرة", value: "مهام، سلسلة دخول، عجلة" },
        { label: "دخول سريع", value: "إيميل أو Google" },
        { label: "فائدة واضحة", value: "نقاط، خبرة، طلبات منتجات" }
      ],
      nextSession: "الجلسة القادمة",
      nextSessionTitle: "ما الذي سيفتح لك بعد تسجيل الدخول",
      live: "مباشر",
      sessionPreview: [
        {
          title: "الدخول اليومي",
          value: "+25 XP",
          description: "حافظ على سلسلة دخولك قبل إعادة ضبط المؤقت.",
          icon: Zap
        },
        {
          title: "مهمة مكتملة",
          value: "+120 pts",
          description: "أنهِ مهمة واقترب أكثر من المنتج التالي.",
          icon: Star
        },
        {
          title: "عجلة إضافية",
          value: "مفتوح",
          description: "حوّل تقدمك إلى فرصة لمكافأة فورية.",
          icon: Trophy
        }
      ],
      progressTitle: "التقدم نحو المنتج التالي",
      progressDescription: "جلسة جيدة أخرى قد تضعك في نطاق الطلب القادم.",
      pillars: [
        {
          title: "حافز يومي",
          description: "مهام جديدة وانتصارات سريعة وسلسلة دخول تجعل العودة غدًا منطقية.",
          icon: Flame
        },
        {
          title: "منتجات تشعرك بالتقدم",
          description: "النقاط والخبرة والمفاجآت تجعل التقدم واضحًا بدل أن يكون مخفيًا في القوائم.",
          icon: Gift
        },
        {
          title: "سهولة المشاركة",
          description: "الإحالات والمهام الاجتماعية تحول كل عضو نشط إلى دائرة نمو للمنصة.",
          icon: Sparkles
        }
      ],
      journeyEyebrow: "رحلة العضو",
      journeyTitle: "ثلاث خطوات من الدخول إلى النتيجة",
      journey: [
        {
          step: "01",
          title: "سجل الدخول",
          description: "ارجع إلى سلسلة دخولك ومهامك غير المنتهية والمنتج التالي الذي كنت تسعى إليه."
        },
        {
          step: "02",
          title: "ابنِ الزخم",
          description: "أكمل الأنشطة واجمع النقاط والخبرة وحافظ على حركة الحساب في كل زيارة."
        },
        {
          step: "03",
          title: "احصل على الفائدة",
          description: "اطلب المنتجات وافتح العجلة وامنح نفسك سببًا للاستمرار."
        }
      ],
      ctaBadge: "استمر في الدورة",
      ctaTitle: "سجل الدخول إذا كنت بدأت بالفعل. أنشئ حسابًا إذا أردت أن تكون الجلسة القادمة مهمة.",
      ctaDescription:
        "Arcetis يجعل التقدم واضحًا من البداية: مهام تُنجز، سلسلة دخول يجب حمايتها، ومنتجات تستحق الرجوع من أجلها. الخطوة التالية يجب أن تكون سهلة."
    };
  }

  return {
    navQuests: "Quests",
    navRewards: "Rewards",
    navReferrals: "Referrals",
    signIn: "Sign in",
    createAccount: "Create account",
    spotlightEyebrow: "Product spotlight",
    spotlightTitle: "See what members can unlock",
    spotlightDescription:
      "The first slide explains the platform, then the newest products rotate automatically after it.",
    exploreRewards: "Sign in to explore rewards",
    introBadge: "Rewards with momentum",
    introTitle: "A reason to sign in before the day gets away from you.",
    introDescription:
      "Arcetis turns everyday actions into streaks, XP, points, spins, and real reward momentum. Sign in to keep climbing, or create an account and start from your first win.",
    introPrimary: "Sign in and continue",
    introSecondary: "Create account",
    introHighlights: ["Daily quests", "Referral boosts", "Reward drops"],
    introMetricsTitle: "Why people stay",
    proofStrip: [
      { label: "Live loop", value: "Tasks, streaks, spins" },
      { label: "Fast entry", value: "Email or Google sign-in" },
      { label: "Clear upside", value: "Points, XP, product requests" }
    ],
    nextSession: "Next session",
    nextSessionTitle: "What unlocks when you sign in",
    live: "Live",
    sessionPreview: [
      {
        title: "Daily check-in",
        value: "+25 XP",
        description: "Keep your streak alive before the timer resets.",
        icon: Zap
      },
      {
        title: "Quest completed",
        value: "+120 pts",
        description: "Finish a challenge and move closer to your next claim.",
        icon: Star
      },
      {
        title: "Bonus spin",
        value: "Unlocked",
        description: "Turn progress into a shot at instant rewards.",
        icon: Trophy
      }
    ],
    progressTitle: "Progress to next reward",
    progressDescription: "One more good session puts the next claim in reach.",
    pillars: [
      {
        title: "Daily momentum",
        description: "Fresh quests, quick wins, and streak pressure give people a reason to come back tomorrow.",
        icon: Flame
      },
      {
        title: "Rewards that feel earned",
        description: "Points, XP, and surprise drops keep progress visible instead of hiding value behind menus.",
        icon: Gift
      },
      {
        title: "Easy to share",
        description: "Referrals and social actions turn every active member into a growth loop for the platform.",
        icon: Sparkles
      }
    ],
    journeyEyebrow: "Member journey",
    journeyTitle: "Three steps from sign-in to payoff",
    journey: [
      {
        step: "01",
        title: "Sign in",
        description: "Return to your streak, unfinished quests, and the next reward you were already chasing."
      },
      {
        step: "02",
        title: "Build momentum",
        description: "Complete actions, stack points + XP, and keep the account moving every time you show up."
      },
      {
        step: "03",
        title: "Claim the upside",
        description: "Request products, unlock spins, and give people a reason to keep engaging."
      }
    ],
    ctaBadge: "Keep the loop moving",
    ctaTitle: "Sign in if you already started. Create an account if you want the next session to matter.",
    ctaDescription:
      "Arcetis makes progress obvious from the start: quests to complete, streaks to protect, and rewards worth coming back for. The next move should feel easy."
  };
}

export function PublicLandingPage({ rewards }: { rewards: Reward[] }) {
  const { language } = useLanguage();
  const copy = getLandingCopy(language);
  const rewardsRedirect = `/login?redirect=${encodeURIComponent("/rewards")}`;
  const introSlide: HomeCarouselIntroSlide = {
    theme: "public",
    badge: copy.introBadge,
    title: copy.introTitle,
    description: copy.introDescription,
    primaryAction: {
      href: "/login",
      label: copy.introPrimary
    },
    secondaryAction: {
      href: "/register",
      label: copy.introSecondary
    },
    highlights: copy.introHighlights,
    metricsTitle: copy.introMetricsTitle,
    metrics: copy.proofStrip.map((item) => ({
      label: item.label,
      value: item.value
    }))
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <GuestSpinTeaserModal />
      <div className="arcetis-landing-grid pointer-events-none absolute inset-0 -z-20" />
      <div className="arcetis-landing-orb absolute left-[-6rem] top-24 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,179,71,0.26),_rgba(255,179,71,0))] blur-3xl" />
      <div className="arcetis-landing-orb arcetis-landing-orb-delayed absolute right-[-5rem] top-12 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(98,190,255,0.2),_rgba(98,190,255,0))] blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <MarketingHeader />

        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{copy.spotlightEyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{copy.spotlightTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {copy.spotlightDescription}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={rewardsRedirect}>
                {copy.exploreRewards}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <LatestProductsCarousel
            introSlide={introSlide}
            rewards={rewards}
            primaryLinkMode="signin"
            autoplayMs={3800}
            secondaryHref={rewardsRedirect}
            secondaryLabel={copy.exploreRewards}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/88 shadow-[0_26px_90px_-56px_rgba(0,0,0,0.8)]">
            <CardHeader className="border-b border-border/70 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{copy.nextSession}</p>
                  <CardTitle className="mt-2 text-2xl">{copy.nextSessionTitle}</CardTitle>
                </div>
                <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground">{copy.live}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {copy.sessionPreview.map((item) => (
                <div key={item.title} className="rounded-[1.4rem] border border-border/70 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/60">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}

              <div className="rounded-[1.5rem] border border-amber-300/30 bg-[linear-gradient(145deg,_rgba(255,205,120,0.16),_rgba(255,255,255,0.03))] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{copy.progressTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{copy.progressDescription}</p>
                  </div>
                  <span className="text-2xl font-semibold tracking-tight">78%</span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,_rgba(255,183,77,1),_rgba(255,115,0,0.92))]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/70 bg-card/86 shadow-sm">
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {copy.pillars.map((item) => (
                <div key={item.title} className="space-y-3 rounded-[1.5rem] border border-border/70 bg-background/65 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/60">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="rounded-[2rem] border-border/70 bg-card/88 shadow-sm">
            <CardHeader>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">{copy.journeyEyebrow}</p>
              <CardTitle className="text-3xl tracking-tight">{copy.journeyTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {copy.journey.map((item) => (
                <div key={item.step} className="rounded-[1.5rem] border border-border/70 bg-background/68 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.76),_rgba(255,247,235,0.92))] p-7 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.75)] dark:bg-[linear-gradient(180deg,_rgba(22,22,22,0.92),_rgba(10,10,10,0.98))] sm:p-8">
            <Badge variant="outline" className="rounded-full border-border/70 bg-background/70 px-3 py-1 text-[0.72rem] uppercase tracking-[0.22em]">
              {copy.ctaBadge}
            </Badge>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">{copy.ctaTitle}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{copy.ctaDescription}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/login">
                  {copy.signIn}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link href="/register">{copy.createAccount}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

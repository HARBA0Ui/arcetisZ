"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { StaticPageShell } from "@/components/marketing/static-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AboutContent() {
  const { language } = useLanguage();
  const copy =
    language === "ar"
      ? {
          eyebrow: "عن Arcetis",
          title: "منصة مكافآت مبنية على الاستمرارية",
          intro:
            "Arcetis تمنح الأعضاء سببًا واضحًا للعودة: مهام يومية، نقاط، خبرة، إحالات، عجلة، وحملات دعائية يتم مراجعتها قبل النشر.",
          what: "ماذا تفعل Arcetis",
          whatP1: "Arcetis تجمع بين أفعال الأعضاء المتكررة ونظام مكافآت واضح يجعل التقدم مفهومًا وسهل المتابعة.",
          whatP2: "يكمل الأعضاء المهام، ويكسبون الخبرة والنقاط، ويفتحون فرصًا أكثر كلما ارتفع مستواهم، ثم يحصلون على المنتجات عند استيفاء الشروط.",
          sponsors: "كيف يدخل الرعاة في المنصة",
          sponsorsP1: "يتم مراجعة طلبات الرعاية قبل النشر. تقوم Arcetis بمراجعة الطلب وتحديد النطاق والسعر ثم نشر الحملات المقبولة فقط.",
          sponsorsP2: "هذه المراجعة تجعل المنصة أنظف للأعضاء وتعطي الرعاة مسارًا أوضح من الطلب إلى الإطلاق.",
          tasks: "المهام",
          tasksP: "المهام اليومية والاجتماعية والمدفوعة تحافظ على نشاط المنصة وتعطي العضو خطوة واضحة تالية.",
          rewards: "المنتجات",
          rewardsP: "تتحول النقاط إلى منتجات ملموسة، بينما تفتح الخبرة مستويات وفرصًا إضافية.",
          referrals: "الإحالات",
          referralsP: "تجعل الإحالات الأعضاء النشطين جزءًا من نمو المنصة بشكل متكرر."
        }
      : {
          eyebrow: "About Arcetis",
          title: "A rewards platform built around momentum",
          intro:
            "Arcetis gives members a clear reason to return: daily tasks, points, XP, referrals, spins, and sponsored campaigns that are reviewed before they go live.",
          what: "What Arcetis does",
          whatP1: "Arcetis combines recurring member actions with a visible rewards system so progress is easy to understand and worth coming back for.",
          whatP2: "Members complete platform tasks, earn XP and points, unlock more opportunities as they level up, and redeem rewards when their balance and eligibility match the target.",
          sponsors: "How sponsors fit in",
          sponsorsP1: "Sponsor requests are reviewed before publication. Arcetis checks the request, aligns on scope and pricing, and only then publishes approved campaigns into the live task catalog.",
          sponsorsP2: "This review step keeps the platform cleaner for members and gives sponsors a clearer path from request to distribution.",
          tasks: "Tasks",
          tasksP: "Daily, social, and sponsored actions keep the platform active and give members a focused next step.",
          rewards: "Rewards",
          rewardsP: "Points accumulate into tangible claims, while XP gates new tiers and additional opportunities.",
          referrals: "Referrals",
          referralsP: "Referrals extend the loop by turning active members into a repeatable growth channel for the platform."
        };

  return (
    <StaticPageShell eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro}>
      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader>
            <CardTitle>{copy.what}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>{copy.whatP1}</p>
            <p>{copy.whatP2}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader>
            <CardTitle>{copy.sponsors}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>{copy.sponsorsP1}</p>
            <p>{copy.sponsorsP2}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[1.6rem] border-border/70 bg-card/86 shadow-sm">
          <CardHeader>
            <CardTitle>{copy.tasks}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{copy.tasksP}</CardContent>
        </Card>
        <Card className="rounded-[1.6rem] border-border/70 bg-card/86 shadow-sm">
          <CardHeader>
            <CardTitle>{copy.rewards}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{copy.rewardsP}</CardContent>
        </Card>
        <Card className="rounded-[1.6rem] border-border/70 bg-card/86 shadow-sm">
          <CardHeader>
            <CardTitle>{copy.referrals}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{copy.referralsP}</CardContent>
        </Card>
      </div>
    </StaticPageShell>
  );
}

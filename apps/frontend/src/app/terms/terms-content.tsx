"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { StaticPageShell } from "@/components/marketing/static-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TermsContent() {
  const { language } = useLanguage();
  const copy =
    language === "ar"
      ? {
          eyebrow: "الشروط والأحكام",
          title: "قواعد استخدام Arcetis",
          intro: "توضح هذه الشروط التوقعات الأساسية للحسابات ونشاط المنصة والمنتجات والحملات الدعائية والمعايير التي تحافظ على موثوقية النظام.",
          accounts: "الحسابات والأهلية",
          rewards: "المنتجات والنقاط والخبرة",
          proof: "الإثبات والتحقق",
          sponsored: "الحملات الدعائية",
          changes: "التغييرات على الخدمة"
        }
      : {
          eyebrow: "Terms & Conditions",
          title: "Rules for using Arcetis",
          intro: "These terms describe the baseline expectations for accounts, platform activity, rewards, sponsored campaigns, and the standards Arcetis uses to keep the ecosystem reliable.",
          accounts: "Accounts and eligibility",
          rewards: "Rewards, points, and XP",
          proof: "Proof and verification",
          sponsored: "Sponsored campaigns",
          changes: "Changes to the service"
        };

  return (
    <StaticPageShell eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.accounts}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{language === "ar" ? "يجب على الأعضاء تقديم معلومات صحيحة وهم مسؤولون عن النشاط داخل حساباتهم." : "Members must provide accurate account information and are responsible for activity under their accounts."}</p>
            <p>{language === "ar" ? "يجوز لـ Arcetis تعليق أو تقييد أو حذف الحسابات المرتبطة بالاحتيال أو الانتحال أو الإساءة." : "Arcetis may suspend, restrict, or remove accounts involved in fraud, impersonation, or abusive conduct."}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.rewards}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{language === "ar" ? "تحكم قواعد المنصة وأهلية الحساب في النقاط والخبرة وتوفر المنتجات." : "Points, XP, and reward availability are governed by platform rules and eligibility gates."}</p>
            <p>{language === "ar" ? "يمكن لـ Arcetis رفض المنتجات أو عكسها إذا كان النشاط غير صحيح أو متلاعبًا أو غير مكتمل." : "Arcetis may reject or reverse rewards if the underlying activity is invalid, manipulated, or incomplete."}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[1.6rem] border-border/70 bg-card/86 shadow-sm">
          <CardHeader><CardTitle>{copy.proof}</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{language === "ar" ? "قد تتم مراجعة الإثباتات يدويًا، ويمكن رفض الإثباتات الناقصة أو المضللة أو الضعيفة." : "Proof submissions may be reviewed manually. Missing, misleading, or low-quality proof can be rejected."}</CardContent>
        </Card>
        <Card className="rounded-[1.6rem] border-border/70 bg-card/86 shadow-sm">
          <CardHeader><CardTitle>{copy.sponsored}</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{language === "ar" ? "طلبات الرعاية تخضع للمراجعة والتسعير والموافقة قبل النشر على المنصة." : "Sponsor requests are subject to review, pricing alignment, and approval before publication on the platform."}</CardContent>
        </Card>
        <Card className="rounded-[1.6rem] border-border/70 bg-card/86 shadow-sm">
          <CardHeader><CardTitle>{copy.changes}</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{language === "ar" ? "يجوز لـ Arcetis تحديث المزايا أو القواعد أو الحدود أو هذه الشروط مع تطور الخدمة." : "Arcetis may update platform features, rules, limits, or these terms as the service evolves."}</CardContent>
        </Card>
      </div>
    </StaticPageShell>
  );
}

"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { StaticPageShell } from "@/components/marketing/static-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PrivacyContent() {
  const { language } = useLanguage();
  const copy =
    language === "ar"
      ? {
          eyebrow: "سياسة الخصوصية",
          title: "كيف تتعامل Arcetis مع بيانات الأعضاء",
          intro: "تشرح هذه الصفحة أنواع المعلومات التي تستخدمها Arcetis لإدارة الحسابات وتشغيل المهام وتقديم المنتجات والتحقق من الإثباتات وحماية المنصة.",
          collect: "المعلومات التي نجمعها",
          use: "كيف نستخدمها",
          storage: "التخزين والاحتفاظ",
          choices: "خياراتك"
        }
      : {
          eyebrow: "Privacy Policy",
          title: "How Arcetis handles member data",
          intro: "This page explains the categories of information Arcetis uses to operate accounts, run tasks, issue rewards, review proof submissions, and protect the platform from abuse.",
          collect: "Information we collect",
          use: "How we use it",
          storage: "Storage and retention",
          choices: "Your choices"
        };

  return (
    <StaticPageShell eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.collect}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{language === "ar" ? "بيانات الحساب مثل البريد الإلكتروني واسم المستخدم ومعلومات التحقق." : "Account details such as email, username, and authentication information."}</p>
            <p>{language === "ar" ? "بيانات النشاط مثل إكمال المهام والإثباتات والإحالات والدورات وطلبات المنتجات." : "Activity data such as task completions, proof submissions, referral usage, spins, and reward claims."}</p>
            <p>{language === "ar" ? "المعلومات التقنية اللازمة للأمان ومنع الاحتيال واستقرار الخدمة." : "Technical information needed for security, fraud prevention, and service reliability."}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.use}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{language === "ar" ? "لإنشاء الحسابات وتأمينها وإظهار التقدم ومعالجة المهام والمنتجات والإحالات والعجلة." : "To create and secure accounts, show progress, and process tasks, rewards, referrals, and spins."}</p>
            <p>{language === "ar" ? "لمراجعة الإثباتات وفرض قواعد المنصة والتحقيق في الاحتيال أو التلاعب." : "To review proof submissions, enforce platform rules, and investigate abuse or manipulation."}</p>
            <p>{language === "ar" ? "للتواصل بخصوص التحديثات أو التنبيهات أو طلبات الرعاية عند الحاجة." : "To communicate service updates, account notices, or sponsor-request follow-ups when necessary."}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.storage}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{language === "ar" ? "تحتفظ Arcetis بالبيانات اللازمة لتشغيل الخدمة وحفظ السجل ودعم المراجعات والحفاظ على الثقة." : "Arcetis stores the data needed to operate the service, maintain reward history, support audits, and keep the platform trustworthy."}</p>
            <p>{language === "ar" ? "قد يتم استخدام ملفات الارتباط والتخزين المحلي للحفاظ على الجلسة الأساسية." : "Local browser storage and cookies may be used to keep members signed in and preserve essential session state."}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.choices}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{language === "ar" ? "يمكن للأعضاء طلب تحديث الحساب أو تصحيح البيانات أو حذفها ضمن الحدود القانونية والتشغيلية." : "Members can request account updates, corrections, or deletion subject to legal and operational limits."}</p>
            <p>{language === "ar" ? "يجب إرسال أسئلة الخصوصية من خلال صفحة التواصل ليتم توثيقها ومراجعتها." : "Questions or privacy requests should be sent through the contact page so the request can be reviewed and documented."}</p>
          </CardContent>
        </Card>
      </div>
    </StaticPageShell>
  );
}

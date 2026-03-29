"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { StaticPageShell } from "@/components/marketing/static-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ContactContent() {
  const { language } = useLanguage();
  const copy =
    language === "ar"
      ? {
          eyebrow: "تواصل",
          title: "تواصل مع فريق Arcetis",
          intro: "استخدم هذه القنوات للدعم أو الشراكات أو التواصل التجاري العام.",
          email: "البريد الإلكتروني",
          emailText: "مساعدة الحساب والأسئلة عن المنتجات والدعم العام.",
          instagram: "إنستغرام",
          instagramText: "تابع التحديثات وتواصل اجتماعيًا وتعرّف أكثر على متجر Arcetis.",
          promotions: "الحملات الدعائية",
          promotionsText: "للحملات والرعايات، يمكن للأعضاء استخدام نموذج طلب الترويج داخل التطبيق بعد تسجيل الدخول.",
          promotionsLink: "راسل فريق الحملات",
          expectations: "وقت الرد المتوقع",
          e1: "طلبات الدعم تحصل عادة على رد أولي خلال يومي عمل.",
          e2: "طلبات الحملات قد تحتاج مراجعة إضافية قبل تأكيد السعر أو التوقيت أو التفاصيل.",
          e3: "للأعضاء داخل المنصة، أسرع طريق للحملات هو نموذج طلب الترويج من قسم المهام بعد تسجيل الدخول."
        }
      : {
          eyebrow: "Contact",
          title: "Reach the Arcetis team",
          intro: "Use these channels for support, partnership questions, or general business communication.",
          email: "Email",
          emailText: "Account help, reward questions, promotion support, and general requests.",
          instagram: "Instagram",
          instagramText: "Follow updates, reach out through social, and learn more about the Arcetis shop.",
          promotions: "Promotions",
          promotionsText: "For campaigns and sponsor requests, members can also use the in-app promotion request form after sign-in.",
          promotionsLink: "Email the promotions team",
          expectations: "Response expectations",
          e1: "Support requests should normally receive an initial response within two business days.",
          e2: "Promotion requests may require additional review before pricing, launch timing, or campaign details can be confirmed.",
          e3: "For members already inside the platform, the fastest route for sponsor campaigns is the promotion request flow available from the tasks area after sign-in."
        };

  return (
    <StaticPageShell eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.email}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{copy.emailText}</p>
            <a className="font-medium text-foreground underline-offset-4 hover:underline" href="mailto:arcetis002@gmail.com">arcetis002@gmail.com</a>
          </CardContent>
        </Card>
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.instagram}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{copy.instagramText}</p>
            <a className="font-medium text-foreground underline-offset-4 hover:underline" href="https://www.instagram.com/arcetis_shop/" target="_blank" rel="noreferrer">@arcetis_shop</a>
          </CardContent>
        </Card>
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader><CardTitle>{copy.promotions}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{copy.promotionsText}</p>
            <a className="font-medium text-foreground underline-offset-4 hover:underline" href="mailto:arcetis002@gmail.com">{copy.promotionsLink}</a>
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
        <CardHeader><CardTitle>{copy.expectations}</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>{copy.e1}</p>
          <p>{copy.e2}</p>
          <p>{copy.e3}</p>
        </CardContent>
      </Card>
    </StaticPageShell>
  );
}

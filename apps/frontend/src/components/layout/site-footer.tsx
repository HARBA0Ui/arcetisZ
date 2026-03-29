"use client";

import Link from "next/link";
import { ArcetisLogo } from "@/components/common/arcetis-logo";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

const footerLinks = [
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" }
] as const;

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  const { language } = useLanguage();
  const copy =
    language === "ar"
      ? {
          about: "عن Arcetis",
          contact: "تواصل معنا",
          privacy: "سياسة الخصوصية",
          terms: "الشروط والأحكام",
          rights: "جميع الحقوق محفوظة.",
          note: "المعلومات العامة والخصوصية والشروط متاحة هنا."
        }
      : {
          about: "About Arcetis",
          contact: "Contact",
          privacy: "Privacy Policy",
          terms: "Terms & Conditions",
          rights: "All rights reserved.",
          note: "Public information, privacy, and terms are available here."
        };

  return (
    <footer className={cn("mt-12 border-t border-border/60 bg-background/55", className)}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <Link href="/" className="inline-flex shrink-0">
              <ArcetisLogo className="h-8 md:h-9" />
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.key === "about"
                  ? copy.about
                  : link.key === "contact"
                    ? copy.contact
                    : link.key === "privacy"
                      ? copy.privacy
                      : copy.terms}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-border/60 pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; <span suppressHydrationWarning>{year}</span> Arcetis. {copy.rights}
          </p>
          <p>{copy.note}</p>
        </div>
      </div>
    </footer>
  );
}

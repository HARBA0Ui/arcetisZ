"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArcetisLogo } from "@/components/common/arcetis-logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketingHeader() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const copy =
    language === "ar"
      ? {
          home: "الرئيسية",
          about: "عن",
          contact: "تواصل",
          privacy: "الخصوصية",
          terms: "الشروط",
          signIn: "تسجيل الدخول",
          createAccount: "إنشاء حساب"
        }
      : {
          home: "Home",
          about: "About",
          contact: "Contact",
          privacy: "Privacy",
          terms: "Terms",
          signIn: "Sign in",
          createAccount: "Create account"
        };

  const links = [
    { href: "/", label: copy.home },
    { href: "/about", label: copy.about },
    { href: "/contact", label: copy.contact },
    { href: "/privacy", label: copy.privacy },
    { href: "/terms", label: copy.terms }
  ];

  return (
    <header className="rounded-[2rem] border border-border/70 bg-background/78 px-4 py-4 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.65)] backdrop-blur xl:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="shrink-0">
          <ArcetisLogo className="h-12 md:h-16" />
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActiveRoute(pathname, link.href) ? "page" : undefined}
              className={cn(
                "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActiveRoute(pathname, link.href)
                  ? "border-border/70 bg-card/85 text-foreground shadow-sm"
                  : "border-border/40 bg-background/60 text-muted-foreground hover:border-border/70 hover:bg-card/70 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ThemeToggle iconOnly className="rounded-full border-border/70 bg-background/70" />
          <Button asChild variant="ghost" className="rounded-full px-5">
            <Link href="/login">{copy.signIn}</Link>
          </Button>
          <Button asChild className="rounded-full px-5">
            <Link href="/register">{copy.createAccount}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

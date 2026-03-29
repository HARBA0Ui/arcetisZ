"use client";

import { useAuthToken } from "@/hooks/use-auth-token";
import { AppShell } from "@/components/layout/app-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";

type StaticPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
};

export function StaticPageShell({ eyebrow, title, intro, children }: StaticPageShellProps) {
  const token = useAuthToken();
  const pageContent = (
    <>
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,_rgba(10,10,10,0.96),_rgba(27,30,38,0.96)_54%,_rgba(50,35,18,0.92))] p-8 text-white shadow-[0_36px_120px_-52px_rgba(0,0,0,0.85)] sm:p-10">
        <Badge className="border-white/10 bg-white/12 text-white hover:bg-white/12">{eyebrow}</Badge>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">{intro}</p>
      </section>

      <section className="mt-6 space-y-4">{children}</section>
    </>
  );

  if (token) {
    return (
      <AppShell>
        <div className="arcetis-landing-grid pointer-events-none absolute inset-0 -z-20" />
        <div className="arcetis-landing-orb absolute left-[-6rem] top-24 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,179,71,0.22),_rgba(255,179,71,0))] blur-3xl" />
        <div className="arcetis-landing-orb absolute right-[-4rem] top-10 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(98,190,255,0.16),_rgba(98,190,255,0))] blur-3xl" />
        {pageContent}
      </AppShell>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="arcetis-landing-grid pointer-events-none absolute inset-0 -z-20" />
      <div className="arcetis-landing-orb absolute left-[-6rem] top-24 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,179,71,0.22),_rgba(255,179,71,0))] blur-3xl" />
      <div className="arcetis-landing-orb absolute right-[-4rem] top-10 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(98,190,255,0.16),_rgba(98,190,255,0))] blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <MarketingHeader />
        {pageContent}
      </div>

      <SiteFooter />
    </main>
  );
}

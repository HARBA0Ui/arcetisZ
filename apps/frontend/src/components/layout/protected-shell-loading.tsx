"use client";

import { CircleDollarSign, Gift, Home, PartyPopper, Sparkles, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArcetisLogo } from "@/components/common/arcetis-logo";
import { NotificationCenter } from "@/components/common/notification-center";
import { RouteLoading } from "@/components/layout/route-loading";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: Sparkles },
  { href: "/spin", label: "Spin", icon: Gift },
  { href: "/giveaways", label: "Giveaways", icon: PartyPopper },
  { href: "/rewards", label: "Rewards", icon: CircleDollarSign },
  { href: "/referrals", label: "Referrals", icon: Users2 }
];

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProtectedShellLoading({ message }: { message: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen overflow-x-hidden pb-12">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <Link href="/" className="mr-2 shrink-0">
            <ArcetisLogo className="h-16 md:h-20" />
          </Link>

          <nav className="flex flex-1 flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-2 text-sm transition-all",
                  isActiveRoute(pathname, item.href)
                    ? "border-border/70 bg-card/85 text-foreground shadow-sm"
                    : "text-muted-foreground hover:border-border/60 hover:bg-muted/55 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle iconOnly className="h-12 w-12 rounded-2xl border-border/80 bg-card text-foreground" />
            <NotificationCenter />
            <Skeleton className="h-12 min-w-[12.25rem] rounded-full" />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pt-8">
        <RouteLoading label={message} />
      </main>
    </div>
  );
}

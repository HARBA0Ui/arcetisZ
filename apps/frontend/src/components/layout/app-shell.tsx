"use client";

import { useEffect, useRef } from "react";
import { CircleDollarSign, Gift, Home, PartyPopper, Sparkles, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArcetisLogo } from "@/components/common/arcetis-logo";
import { NotificationCenter } from "@/components/common/notification-center";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { UserMenu } from "@/components/common/user-menu";
import { ProtectedShellLoading } from "@/components/layout/protected-shell-loading";
import { SiteFooter } from "@/components/layout/site-footer";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { useAuthToken } from "@/hooks/use-auth-token";
import { isSessionError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLogout, useMe } from "@/hooks/useAuth";

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const logout = useLogout();
  const sessionHint = useAuthToken();
  const { data: user, error, isError, isFetched } = useMe();
  const prefetchedRoutesRef = useRef(false);
  const logoutTarget = pathname === "/" ? "/" : "/login";

  useEffect(() => {
    if (sessionHint) return;

    void (async () => {
      startNavigation(logoutTarget);
      await logout();

      if (logoutTarget === pathname) {
        router.refresh();
        return;
      }

      router.replace(logoutTarget);
    })();
  }, [logout, logoutTarget, pathname, router, sessionHint, startNavigation]);

  useEffect(() => {
    if (!sessionHint) return;
    if (!isFetched || !isError || !isSessionError(error, { includeNotFound: true })) return;

    void (async () => {
      startNavigation(logoutTarget);
      await logout();
      router.replace(logoutTarget);
    })();
  }, [error, isError, isFetched, logout, logoutTarget, router, sessionHint, startNavigation]);

  async function handleLogout() {
    startNavigation(logoutTarget);
    await logout();
    if (logoutTarget === pathname) {
      router.refresh();
      return;
    }

    router.replace(logoutTarget);
  }

  useEffect(() => {
    if (!sessionHint) {
      return;
    }

    if (prefetchedRoutesRef.current) {
      return;
    }

    prefetchedRoutesRef.current = true;

    const timeoutId = window.setTimeout(() => {
      const warmRoutes = new Set([
        ...navItems.map((item) => item.href),
        "/profile",
        "/requests",
        "/giveaways/mine"
      ]);

      warmRoutes.forEach((href) => {
        void router.prefetch(href);
      });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, sessionHint]);

  if (!sessionHint) {
    return <ProtectedShellLoading message="Refreshing your session..." />;
  }

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
            <UserMenu user={user ?? undefined} onLogout={() => void handleLogout()} />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl min-w-0 overflow-x-clip px-4 pt-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

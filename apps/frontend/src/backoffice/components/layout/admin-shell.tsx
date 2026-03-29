"use client";

import { LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArcetisLogo } from "@/components/common/arcetis-logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLogout, useMe } from "@/backoffice/hooks/useAuth";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { startNavigation } = useNavigationProgress();
  const logout = useLogout();
  const { data: user } = useMe();

  const navItems = [
    { href: "/backoffice/dashboard", label: "Home" },
    { href: "/backoffice/dashboard/quests", label: "Quests" },
    { href: "/backoffice/dashboard/giveaways", label: "Giveaways" },
    { href: "/backoffice/dashboard/sponsors", label: "Sponsors" },
    { href: "/backoffice/dashboard/products", label: "Products" },
    { href: "/backoffice/dashboard/redemptions", label: "Redemptions" },
    { href: "/backoffice/dashboard/users", label: "Users" },
    { href: "/backoffice/dashboard/config", label: "Config" },
    { href: "/backoffice/dashboard/admins", label: "Admins" }
  ];

  async function handleLogout() {
    startNavigation("/backoffice/login");
    await logout();
    router.replace("/backoffice/login");
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.12),transparent_33%),radial-gradient(circle_at_90%_8%,rgba(255,255,255,0.08),transparent_30%)]" />
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/backoffice/dashboard" className="shrink-0">
              <ArcetisLogo className="h-12 md:h-14" />
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1.5 sm:flex">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div className="text-right">
                <p className="text-sm font-medium leading-4">{user?.username ?? "Admin"}</p>
                <p className="text-xs text-muted-foreground">Arcetis Backoffice</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle iconOnly className="h-9 w-9 border-border/80 bg-card text-foreground" />
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-9 border border-border/70 bg-card px-0"
                aria-label="Disconnect"
                title="Disconnect"
                onClick={() => void handleLogout()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const isHome = item.href === "/backoffice/dashboard" && pathname === item.href;
              const isSection = item.href !== "/backoffice/dashboard" && (pathname === item.href || pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 py-2 text-sm transition",
                    isHome || isSection
                      ? "border-border bg-card text-foreground shadow-sm"
                      : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-0 mx-auto max-w-7xl px-4 pt-8">{children}</main>
    </div>
  );
}

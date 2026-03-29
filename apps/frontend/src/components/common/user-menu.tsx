"use client";

import Link from "next/link";
import { ChevronDown, ClipboardList, Coins, Flame, Gauge, LogOut, PartyPopper, UserCircle2, UserRound, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber, formatNumber } from "@/lib/format";
import { xpProgress } from "@/lib/level";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  user?: Pick<User, "username" | "level" | "points" | "xp" | "loginStreak">;
  className?: string;
  onLogout?: () => void;
}

function formatCompactPoints(value: number) {
  return formatCompactNumber(value);
}

function UserProgressIcon({
  progress,
  level,
  size = "sm"
}: {
  progress: number;
  level?: number;
  size?: "sm" | "md";
}) {
  const iconSize = size === "md" ? 42 : 34;
  const strokeWidth = size === "md" ? 2.6 : 2.2;
  const radius = (iconSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * progress) / 100;
  const wrapperClassName = size === "md" ? "h-11 w-11" : "h-9 w-9";
  const insetClassName = size === "md" ? "inset-[4px]" : "inset-[3px]";
  const badgeClassName =
    size === "md"
      ? "h-5 min-w-[2rem] px-2.5 text-[11px]"
      : "h-4 min-w-[1.7rem] px-2 text-[10px]";
  const iconClassName = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className={cn("relative shrink-0 overflow-visible", wrapperClassName)}>
      <svg
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        className="-rotate-90 h-full w-full"
        aria-hidden="true"
      >
        <circle
          cx={iconSize / 2}
          cy={iconSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={iconSize / 2}
          cy={iconSize / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--arcetis-ember))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="drop-shadow-[0_0_4px_rgba(255,122,24,0.35)]"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset
          }}
        />
      </svg>
      <div
        className={cn(
          "absolute flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.22),rgba(30,30,30,0.96)_42%,rgba(4,4,4,1)_78%)] text-white shadow-[inset_0_0_18px_rgba(0,0,0,0.8),0_8px_18px_-14px_rgba(0,0,0,0.95)]",
          insetClassName
        )}
      >
        <div className="absolute h-3.5 w-3.5 rounded-full bg-[hsl(var(--arcetis-ember))]/18 blur-[6px]" />
        <UserCircle2 className={cn("relative z-[1]", iconClassName)} />
      </div>

      {typeof level === "number" ? (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
          <div
            className={cn(
              "flex items-center justify-center whitespace-nowrap border border-[rgba(255,122,24,0.35)] bg-[linear-gradient(180deg,rgba(26,26,26,0.98),rgba(8,8,8,0.98))] font-semibold leading-none text-white shadow-[0_10px_20px_-16px_rgba(0,0,0,0.95)] [clip-path:polygon(16%_0,84%_0,100%_44%,87%_100%,13%_100%,0_44%)]",
              badgeClassName
            )}
          >
            {level}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function UserMenu({ user, className, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const username = user?.username ?? "User";
  const level = user?.level ?? 1;
  const points = user?.points ?? 0;
  const xp = user?.xp ?? 0;
  const streak = user?.loginStreak ?? 0;
  const { t } = useLanguage();
  const progress = xpProgress(xp);
  const levelProgress = progress.requiredForNext > 0 ? (progress.progressInLevel / progress.requiredForNext) * 100 : 0;
  const compactPoints = formatCompactPoints(points);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <Button
        variant="secondary"
        size="sm"
        className="h-12 min-w-[12.25rem] justify-between gap-2 overflow-visible rounded-full border border-border/70 bg-card/80 px-3 py-0 transition-all hover:border-border hover:bg-accent/70"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user ? `Open account menu for ${username}` : "Open account menu"}
        title={
          user
            ? `${Math.round(levelProgress)}% to level ${level + 1} | ${formatNumber(points)} pts | ${streak}d streak`
            : "Open account menu"
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          {user ? (
            <UserProgressIcon progress={levelProgress} level={user.level} />
          ) : (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
          {user ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold tabular-nums" title={`${formatNumber(points)} pts`}>
                {compactPoints}
                <span className="ml-1 text-xs font-normal text-muted-foreground">pts</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/50 px-2 py-1 text-[11px] font-medium leading-none text-foreground/88">
                <Flame className="h-3 w-3 text-[hsl(var(--arcetis-ember))]" />
                {streak}d
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-6 w-10 rounded-full" />
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0")} />
      </Button>

      {open ? (
        <div className="arcetis-dropdown absolute right-0 top-[calc(100%+0.55rem)] z-[70] w-72 rounded-xl border border-border/90 bg-card p-3 shadow-arcetis">
          <div className="flex items-center gap-3">
            <UserProgressIcon progress={user ? levelProgress : 0} level={user?.level} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{username}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round(levelProgress)}% to level {level + 1}
              </p>
            </div>
            <span className="ml-auto rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Arcetis Core
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/70 bg-muted/40 p-2">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Coins className="h-3 w-3" />
                {t("menuPoints")}
              </p>
              <p className="mt-1 text-sm font-semibold">{formatNumber(points)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/40 p-2">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Zap className="h-3 w-3" />
                {t("menuXp")}
              </p>
              <p className="mt-1 text-sm font-semibold">{formatNumber(xp)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/40 p-2">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Flame className="h-3 w-3" />
                {t("menuStreak")}
              </p>
              <p className="mt-1 text-sm font-semibold">{streak}d</p>
            </div>
          </div>

          <div className="my-3 h-px bg-border" />

          <nav className="space-y-1" aria-label="User quick links">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <Gauge className="h-4 w-4" />
              {t("menuDashboard")}
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4" />
              {t("menuProfile")}
            </Link>
            <Link
              href="/requests"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <ClipboardList className="h-4 w-4" />
              {t("menuRequests")}
            </Link>
            <Link
              href="/giveaways/mine"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <PartyPopper className="h-4 w-4" />
              My giveaways
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive/80 transition-colors hover:bg-accent hover:text-destructive"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("menuLogout")}
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

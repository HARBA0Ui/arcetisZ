"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationStream
} from "@/hooks/usePlatform";
import { formatDateTime } from "@/lib/format";
import type { PlatformNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/common/spinner";

function formatTime(input: string) {
  return formatDateTime(input);
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useNotificationStream();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  const unreadCount = notifications.data?.unreadCount ?? 0;
  const items = notifications.data?.notifications ?? [];

  const handleRead = async (item: PlatformNotification) => {
    if (!item.readAt) {
      await markRead.mutateAsync(item.id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="secondary"
        size="sm"
        className={cn(
          "relative h-12 w-12 overflow-visible rounded-2xl border border-border/70 bg-card px-0 transition-all hover:border-border hover:bg-accent/70",
          unreadCount > 0 && "border-red-500/25 shadow-[0_16px_28px_-24px_rgba(239,68,68,0.95)]"
        )}
        aria-label="Open notifications"
        title="Notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className={cn("h-4 w-4", unreadCount > 0 && "text-red-100")} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-[linear-gradient(180deg,#fb7185,#e11d48)] px-1 text-[10px] font-bold leading-none text-white shadow-[0_14px_22px_-16px_rgba(225,29,72,0.95)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="arcetis-dropdown absolute right-0 top-[calc(100%+0.55rem)] z-[70] w-[min(92vw,24rem)] rounded-xl border border-border/90 bg-card p-3 shadow-arcetis">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgba(225,29,72,0.14)] px-1.5 text-[11px] font-semibold leading-none text-red-200">
                  {unreadCount}
                </span>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={unreadCount === 0 || markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {markAll.isPending ? (
                <>
                  <Spinner className="mr-1 h-3.5 w-3.5" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCheck className="mr-1 h-3.5 w-3.5" />
                  Mark all read
                </>
              )}
            </Button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {notifications.isLoading ? (
              <div className="flex items-center gap-2 rounded-md border border-border p-3 text-sm text-muted-foreground">
                <Spinner className="h-3.5 w-3.5" />
                Loading notifications...
              </div>
            ) : null}

            {!notifications.isLoading && items.length === 0 ? (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : null}

            {items.map((item) =>
              item.link ? (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={async () => {
                    await handleRead(item);
                    setOpen(false);
                  }}
                  className={cn(
                    "block rounded-md border p-3 transition-colors hover:bg-accent/50",
                    item.readAt ? "border-border" : "border-primary/40 bg-primary/5"
                  )}
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {formatTime(item.createdAt)}
                  </p>
                </Link>
              ) : (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleRead(item)}
                  className={cn(
                    "w-full rounded-md border p-3 text-left transition-colors hover:bg-accent/50",
                    item.readAt ? "border-border" : "border-primary/40 bg-primary/5"
                  )}
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {formatTime(item.createdAt)}
                  </p>
                </button>
              )
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

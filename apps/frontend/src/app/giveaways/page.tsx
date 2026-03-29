"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Clock3, PartyPopper, Search, ShieldCheck, Trophy, Users2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SyncBanner } from "@/components/common/sync-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeAssetUrl } from "@/lib/assets";
import { useCountdown } from "@/hooks/use-countdown";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useGiveaways } from "@/hooks/usePlatform";
import { formatNumber } from "@/lib/format";
import type { Giveaway } from "@/lib/types";
import { cn } from "@/lib/utils";

function matchesSearch(query: string, value: { title: string; description: string; prizeSummary?: string | null }) {
  if (!query) {
    return true;
  }

  const haystack = [value.title, value.description, value.prizeSummary ?? ""].join(" ").toLowerCase();
  return haystack.includes(query);
}

function formatAccountAge(days?: number | null) {
  if (!days) {
    return "No account age lock";
  }

  return `${formatNumber(days)} days account age`;
}

function GiveawayCountdown({
  endsAt,
  status,
  className,
  long = false
}: {
  endsAt?: string | null;
  status: Giveaway["status"];
  className?: string;
  long?: boolean;
}) {
  const countdown = useCountdown(status === "CLOSED" ? null : endsAt ?? null);

  let label = "No deadline";
  if (status === "CLOSED") {
    label = "Closed";
  } else if (endsAt) {
    label = countdown.isReady ? "Closing now" : `Ends in ${long ? countdown.longLabel : countdown.shortLabel}`;
  }

  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Clock3 className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
      {label}
    </span>
  );
}

function GiveawayCard({ giveaway }: { giveaway: Giveaway }) {
  const entryStatus =
    giveaway.viewerEntry?.status === "selected"
      ? "Selected"
      : giveaway.viewerEntry?.status === "pending"
        ? "Applied"
        : giveaway.viewerEntry?.status === "rejected"
          ? "Closed on your account"
          : null;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-[1.65rem] border-border/70 bg-card/95">
      {giveaway.imageUrl ? (
        <img
          src={normalizeAssetUrl(giveaway.imageUrl)}
          alt={giveaway.title}
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center border-b border-border/70 bg-background/55 text-sm text-muted-foreground">
          No poster
        </div>
      )}

      <CardHeader className="space-y-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={giveaway.status === "ACTIVE" ? "secondary" : "outline"}>
            {giveaway.status === "ACTIVE" ? "Current giveaway" : "Closed"}
          </Badge>
          {entryStatus ? <Badge variant="outline">{entryStatus}</Badge> : null}
          {giveaway.requiresJustification ? <Badge variant="outline">1-3 proof images</Badge> : null}
        </div>
        <CardTitle className="text-xl">{giveaway.title}</CardTitle>
        <CardDescription className="line-clamp-3">{giveaway.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-0 text-sm sm:p-6 sm:pt-0">
        <div className="rounded-[1.1rem] border border-border/70 bg-background/60 px-4 py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prize</p>
              <p className="mt-2 line-clamp-2 font-semibold text-foreground">
                {giveaway.prizeSummary || "Prize details inside"}
              </p>
            </div>
            <GiveawayCountdown endsAt={giveaway.endsAt} status={giveaway.status} className="shrink-0 text-xs" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-border/60 bg-card/65 p-3">
              <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                <Trophy className="h-3.5 w-3.5" />
                Winners
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">
                {formatNumber(giveaway.selectedCount ?? 0)} / {formatNumber(giveaway.winnerCount ?? 1)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/65 p-3">
              <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                <Users2 className="h-3.5 w-3.5" />
                Entries
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">{formatNumber(giveaway.entryCount ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/65 p-3">
              <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Rule
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">Lvl {formatNumber(giveaway.minLevel ?? 1)}+</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{formatAccountAge(giveaway.minAccountAge)}</Badge>
          <Badge variant="outline">{giveaway.allowEntryEdits ? "Pending edits allowed" : "One final submission"}</Badge>
        </div>

        <Button asChild className="mt-auto w-full justify-between">
          <Link href={`/giveaways/${giveaway.id}`}>
            {giveaway.viewerEntry ? "View my entry" : giveaway.status === "ACTIVE" ? "Open current giveaway" : "Open giveaway"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function GiveawaysPage() {
  const giveawaysQuery = useGiveaways();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const showSyncBanner = useSmoothBusy(!!giveawaysQuery.data && giveawaysQuery.isFetching);

  const giveaways = useMemo(
    () => (giveawaysQuery.data ?? []).filter((giveaway) => matchesSearch(deferredSearch, giveaway)),
    [deferredSearch, giveawaysQuery.data]
  );

  const currentGiveaway = giveaways.find((giveaway) => giveaway.status === "ACTIVE") ?? null;
  const closedGiveaways = giveaways.filter((giveaway) => giveaway.id !== currentGiveaway?.id);

  return (
    <>
      <PageHeader
        title="Giveaways"
        subtitle="See the current giveaway first, then reopen older closed drops whenever you want to check past entries."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Free to apply</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/giveaways/mine">My giveaways</Link>
            </Button>
          </div>
        }
      />

      {showSyncBanner ? <SyncBanner className="mb-6" message="Refreshing giveaways..." /> : null}

      <Card className="mb-6 rounded-[1.5rem] border-border/70 bg-card/92 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder="Search giveaways by title, prize, or description"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{currentGiveaway ? "1 current" : "0 current"}</Badge>
            <Badge variant="outline">{formatNumber(closedGiveaways.length)} closed</Badge>
            <Badge variant="outline">{formatNumber(giveaways.filter((item) => item.viewerEntry).length)} applied</Badge>
          </div>
        </CardContent>
      </Card>

      {giveawaysQuery.isLoading && !giveawaysQuery.data ? (
        <div className="space-y-6">
          <Card className="rounded-[1.9rem] border-border/70 bg-card/95">
            <CardContent className="p-6">
              <Skeleton className="h-72 w-full rounded-[1.6rem]" />
            </CardContent>
          </Card>
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="rounded-[1.65rem] border-border/70 bg-card/95">
                <Skeleton className="aspect-[16/10] w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Current giveaway</p>
                <p className="text-sm text-muted-foreground">The one live drop members can enter right now.</p>
              </div>
            </div>

            {currentGiveaway ? (
              <Card className="overflow-hidden rounded-[1.85rem] border-[rgba(255,122,24,0.18)] bg-[linear-gradient(135deg,_rgba(18,18,18,0.96),_rgba(34,22,11,0.96)_58%,_rgba(73,33,10,0.92))] text-white shadow-[0_24px_70px_-52px_rgba(255,122,24,0.42)]">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-white/10 bg-white/12 text-white hover:bg-white/12">
                        <PartyPopper className="mr-1 h-3.5 w-3.5" />
                        Live now
                      </Badge>
                      {currentGiveaway.viewerEntry ? (
                        <Badge variant="outline" className="border-white/20 text-white">
                          {currentGiveaway.viewerEntry.status === "selected"
                            ? "Selected"
                            : currentGiveaway.viewerEntry.status === "pending"
                              ? "Applied"
                              : "Closed on your account"}
                        </Badge>
                      ) : null}
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{currentGiveaway.title}</h2>
                    <p className="text-sm leading-7 text-white/72 sm:text-base">
                      {currentGiveaway.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-white/80">
                      <Badge variant="outline" className="border-white/15 text-white">Level {formatNumber(currentGiveaway.minLevel ?? 1)}+</Badge>
                      <Badge variant="outline" className="border-white/15 text-white">{formatAccountAge(currentGiveaway.minAccountAge)}</Badge>
                      <Badge variant="outline" className="border-white/15 text-white">
                        {currentGiveaway.requiresJustification ? "1-3 proof images" : "No proof images"}
                      </Badge>
                    </div>
                  </div>

                  {currentGiveaway.imageUrl ? (
                    <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/20">
                      <img
                        src={normalizeAssetUrl(currentGiveaway.imageUrl)}
                        alt={currentGiveaway.title}
                        className="aspect-[16/9] max-h-[420px] w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center rounded-[1.4rem] border border-white/10 bg-black/20 p-6 text-center text-sm text-white/65">
                      No poster added for the current giveaway.
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.15rem] border border-white/10 bg-white/8 p-3.5 sm:p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/60">Winners</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatNumber(currentGiveaway.selectedCount ?? 0)} / {formatNumber(currentGiveaway.winnerCount ?? 1)}
                      </p>
                    </div>
                    <div className="rounded-[1.15rem] border border-white/10 bg-white/8 p-3.5 sm:p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/60">Entries</p>
                      <p className="mt-2 text-2xl font-semibold">{formatNumber(currentGiveaway.entryCount ?? 0)}</p>
                    </div>
                    <div className="rounded-[1.15rem] border border-white/10 bg-white/8 p-3.5 sm:p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/60">Countdown</p>
                      <p className="mt-2 text-sm font-semibold">
                        <GiveawayCountdown endsAt={currentGiveaway.endsAt} status={currentGiveaway.status} long />
                      </p>
                    </div>
                  </div>

                  <Button asChild className="w-full justify-between rounded-xl bg-white text-black hover:bg-white/90 sm:w-auto">
                    <Link href={`/giveaways/${currentGiveaway.id}`}>
                      {currentGiveaway.viewerEntry ? "Open my entry" : "Open current giveaway"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-[1.8rem] border-border/70 bg-card/92 shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No current giveaway is live right now. Closed giveaways stay below so members can still reopen older entries.
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Closed giveaways</p>
                <p className="text-sm text-muted-foreground">Past drops stay here so people can revisit rules and their entry status.</p>
              </div>
              <Badge variant="outline">{formatNumber(closedGiveaways.length)} closed</Badge>
            </div>

            {closedGiveaways.length ? (
              <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
                {closedGiveaways.map((giveaway) => (
                  <GiveawayCard key={giveaway.id} giveaway={giveaway} />
                ))}
              </div>
            ) : (
              <Card className="rounded-[1.8rem] border-border/70 bg-card/92 shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  {deferredSearch
                    ? "No giveaways match your search right now."
                    : "No closed giveaways yet. Once the current drop ends, older ones will stay here."}
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      )}
    </>
  );
}

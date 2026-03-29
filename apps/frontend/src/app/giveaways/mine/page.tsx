"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Clock3, Search } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SyncBanner } from "@/components/common/sync-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeAssetUrl } from "@/lib/assets";
import { useCountdown } from "@/hooks/use-countdown";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useMyGiveaways } from "@/hooks/usePlatform";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { GiveawayEntryStatus } from "@/lib/types";

function matchesSearch(query: string, value: { title?: string | null; prizeSummary?: string | null }) {
  if (!query) {
    return true;
  }

  const haystack = [value.title ?? "", value.prizeSummary ?? ""].join(" ").toLowerCase();
  return haystack.includes(query);
}

function EntryCountdown({ endsAt, status }: { endsAt?: string | null; status?: "ACTIVE" | "CLOSED" | null }) {
  const countdown = useCountdown(status === "CLOSED" ? null : endsAt ?? null);

  if (status === "CLOSED") {
    return <span>Closed</span>;
  }

  if (!endsAt) {
    return <span>No deadline</span>;
  }

  return <span>{countdown.isReady ? "Closing now" : `Ends in ${countdown.shortLabel}`}</span>;
}

function getStatusBadge(status: GiveawayEntryStatus) {
  switch (status) {
    case "selected":
      return { label: "Selected", variant: "default" as const };
    case "rejected":
      return { label: "Not selected", variant: "outline" as const };
    default:
      return { label: "Pending review", variant: "secondary" as const };
  }
}

export default function MyGiveawaysPage() {
  const entriesQuery = useMyGiveaways();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | GiveawayEntryStatus>("all");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const showSyncBanner = useSmoothBusy(!!entriesQuery.data && entriesQuery.isFetching);

  const entries = useMemo(
    () =>
      (entriesQuery.data ?? []).filter((entry) => {
        const statusMatches = statusFilter === "all" || entry.status === statusFilter;
        const searchMatches = matchesSearch(deferredSearch, {
          title: entry.giveaway?.title,
          prizeSummary: entry.giveaway?.prizeSummary
        });
        return statusMatches && searchMatches;
      }),
    [deferredSearch, entriesQuery.data, statusFilter]
  );

  return (
    <>
      <PageHeader
        title="My giveaways"
        subtitle="Reopen your entries, check the status, and keep every giveaway you joined in one clear place."
        right={
          <Button asChild variant="outline" size="sm">
            <Link href="/giveaways">Browse giveaways</Link>
          </Button>
        }
      />

      {showSyncBanner ? <SyncBanner className="mb-6" message="Refreshing your giveaways..." /> : null}

      <Card className="mb-6 rounded-[1.5rem] border-border/70 bg-card/92 shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-center">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder="Search by giveaway title or prize"
            />
          </div>
          <div className="min-w-0">
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | GiveawayEntryStatus)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending review</option>
              <option value="selected">Selected</option>
              <option value="rejected">Not selected</option>
            </Select>
          </div>
          <div className="flex items-center justify-start xl:justify-end">
            <Badge variant="outline">{formatNumber(entries.length)} entries</Badge>
          </div>
        </CardContent>
      </Card>

      {entriesQuery.isLoading && !entriesQuery.data ? (
        <div className="grid auto-rows-fr gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-[1.65rem] border-border/70 bg-card/95">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full rounded-[1.2rem]" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : entries.length ? (
        <div className="grid auto-rows-fr gap-4 xl:grid-cols-2">
          {entries.map((entry) => {
            const badge = getStatusBadge(entry.status);

            return (
              <Card key={entry.id} className="rounded-[1.65rem] border-border/70 bg-card/95">
                {entry.giveaway?.imageUrl ? (
                  <img
                    src={normalizeAssetUrl(entry.giveaway.imageUrl)}
                    alt={entry.giveaway.title ?? "Giveaway poster"}
                    className="aspect-[16/8] w-full object-cover"
                  />
                ) : null}
                <CardHeader className="space-y-3 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <Badge variant="outline">{entry.giveaway?.status === "ACTIVE" ? "Current giveaway" : "Closed"}</Badge>
                  </div>
                  <CardTitle>{entry.giveaway?.title ?? "Giveaway"}</CardTitle>
                  <CardDescription>{entry.giveaway?.prizeSummary || "Prize details inside the giveaway page."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-0 text-sm sm:p-6 sm:pt-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] border border-border/70 bg-background/65 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sent</p>
                      <p className="mt-2 font-semibold text-foreground">{formatDateTime(entry.createdAt)}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-border/70 bg-background/65 p-4">
                      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        Countdown
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        <EntryCountdown endsAt={entry.giveaway?.endsAt} status={entry.giveaway?.status} />
                      </p>
                    </div>
                  </div>

                  {entry.justification ? (
                    <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Saved note</p>
                      <p className="mt-2 line-clamp-3 leading-6">{entry.justification}</p>
                    </div>
                  ) : null}

                  {entry.justificationImageUrls?.length ? (
                    <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Saved proof images</p>
                      <p className="mt-2">{formatNumber(entry.justificationImageUrls.length)} image{entry.justificationImageUrls.length === 1 ? "" : "s"} attached to this entry.</p>
                    </div>
                  ) : null}

                  <Button asChild className="w-full justify-between">
                    <Link href={`/giveaways/${entry.giveawayId}`}>
                      Reopen giveaway
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-[1.5rem] border-border/70 bg-card/92 shadow-sm">
          <CardContent className="p-5 sm:p-6 text-sm text-muted-foreground">
            {deferredSearch || statusFilter !== "all"
              ? "No giveaway entries match the current filters."
              : "You have not joined any giveaways yet."}
          </CardContent>
        </Card>
      )}
    </>
  );
}


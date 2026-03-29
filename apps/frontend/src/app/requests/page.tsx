"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Copy, Search } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { useLanguage } from "@/components/i18n/language-provider";
import { RewardThumbnail } from "@/components/rewards/reward-thumbnail";
import { SyncBanner } from "@/components/common/sync-banner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useRedemptions } from "@/hooks/usePlatform";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getDisplayRequestCode } from "@/lib/request-code";
import type { RedemptionStatus } from "@/lib/types";

const statusLabel: Record<RedemptionStatus, string> = {
  pending: "Waiting for delivery",
  approved: "Delivered",
  rejected: "Rejected + refunded",
  expired: "Expired + refunded"
};

const statusTone: Record<RedemptionStatus, string> = {
  pending: "border-[rgba(255,122,24,0.28)] bg-[rgba(255,122,24,0.08)] text-foreground",
  approved: "border-emerald-400/30 bg-emerald-400/12 text-emerald-100",
  rejected: "border-red-400/30 bg-red-400/12 text-red-100",
  expired: "border-slate-400/30 bg-slate-400/12 text-slate-100"
};

function formatDate(value?: string | null) {
  return formatDateTime(value);
}

export default function RequestsPage() {
  const requests = useRedemptions();
  const toast = useToast();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | RedemptionStatus>("all");
  const showSyncBanner = useSmoothBusy(!!requests.data && requests.isFetching);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (requests.data ?? []).filter((request) => {
      if (status !== "all" && request.status !== status) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        request.requestCode,
        request.id.slice(-12),
        request.reward?.title,
        request.planLabel
      ]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, requests.data, status]);

  return (
    <>
      <PageHeader
        title={t("requestHistoryTitle")}
        subtitle={t("requestHistorySubtitle")}
        right={
          <Button asChild variant="outline" size="sm">
            <Link href="/rewards">{t("browseProducts")}</Link>
          </Button>
        }
      />

      {showSyncBanner ? <SyncBanner message="Refreshing request history..." /> : null}

      <Card className="mb-6 rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10"
              placeholder={t("searchRequests")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: t("all") },
              { value: "pending", label: t("pending") },
              { value: "approved", label: t("delivered") },
              { value: "rejected", label: t("refunded") },
              { value: "expired", label: t("expired") }
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={status === option.value ? "default" : "outline"}
                onClick={() => setStatus(option.value as "all" | RedemptionStatus)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {requests.data ? (
        filteredRequests.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRequests.map((request) => {
              const displayCode = getDisplayRequestCode(request.requestCode, request.id);

              return (
                <Card key={request.id} className="overflow-hidden rounded-[1.7rem] border-border/70 bg-card/95">
                  <RewardThumbnail
                    title={request.reward?.title ?? "Reward"}
                    imageUrl={request.reward?.imageUrl}
                    className="aspect-square w-full rounded-none border-x-0 border-t-0 border-b"
                  />
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusTone[request.status]} variant="outline">
                        {request.status === "pending"
                          ? t("waitingForDelivery")
                          : request.status === "approved"
                            ? t("delivered")
                            : request.status === "rejected"
                              ? t("rejectedRefunded")
                              : t("expiredRefunded")}
                      </Badge>
                      {request.planLabel ? <Badge variant="outline">{request.planLabel}</Badge> : null}
                    </div>
                    <CardTitle className="text-lg">{request.reward?.title ?? t("requestHistoryTitle")}</CardTitle>
                    <CardDescription>{formatDate(request.createdAt)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="rounded-[1.2rem] border border-border/70 bg-background/65 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("requestCode")}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="font-mono font-semibold">{displayCode}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={async () => {
                            await navigator.clipboard.writeText(displayCode);
                            toast.success(t("codeCopied"), displayCode);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{t("pointsSpent")}</span>
                      <span className="font-medium text-foreground">
                        {typeof request.pointsSpent === "number" ? formatNumber(request.pointsSpent) : "-"} pts
                      </span>
                    </div>

                    <Button asChild className="w-full justify-between">
                      <Link href={`/requests/${request.id}`}>
                        {t("openDetails")}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {t("noRequestsMatch")}
            </CardContent>
          </Card>
        )
      ) : requests.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden rounded-[1.7rem] border-border/70 bg-card/95">
              <Skeleton className="aspect-square w-full rounded-none" />
              <CardHeader>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full rounded-[1.2rem]" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {t("requestHistoryUnavailable")}
          </CardContent>
        </Card>
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Search, ShieldX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PaginationControls } from "@/backoffice/components/backoffice/pagination-controls";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { getApiError } from "@/backoffice/lib/api";
import { useAdminRedemptions, useUpdateRedemption } from "@/backoffice/hooks/useAdmin";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getDisplayRequestCode } from "@/lib/request-code";
import type { RedemptionStatus } from "@/lib/types";

const statusLabel: Record<RedemptionStatus, string> = {
  pending: "Awaiting action",
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

export default function BackofficeRedemptionsPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const updateRedemption = useUpdateRedemption();

  const [query, setQuery] = useState(searchParams.get("code") ?? "");
  const [status, setStatus] = useState<"all" | RedemptionStatus>("pending");
  const [page, setPage] = useState(1);
  const redemptions = useAdminRedemptions({
    q: query || undefined,
    status: status === "all" ? undefined : status,
    page,
    pageSize: 10
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const selectedRedemption = useMemo(
    () => redemptions.data?.items.find((item) => item.id === selectedId) ?? redemptions.data?.items[0] ?? null,
    [redemptions.data, selectedId]
  );

  useEffect(() => {
    if (selectedRedemption && selectedRedemption.id !== selectedId) {
      setSelectedId(selectedRedemption.id);
      return;
    }

    if (!selectedRedemption) {
      setSelectedId(null);
    }
  }, [selectedId, selectedRedemption]);

  useEffect(() => {
    setReviewNote(selectedRedemption?.reviewNote ?? "");
    setCopiedCode(null);
  }, [selectedRedemption?.id, selectedRedemption?.reviewNote]);

  if (redemptions.isLoading && !redemptions.data) {
    return <LoadingCard label="Loading redemptions..." />;
  }

  if (!redemptions.data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Redemptions are not available right now.
        </CardContent>
      </Card>
    );
  }

  const requestedInfoEntries = Object.entries(selectedRedemption?.requestedInfo ?? {});
  const selectedDisplayCode = getDisplayRequestCode(selectedRedemption?.requestCode, selectedRedemption?.id);

  const handleReview = async (nextStatus: "approved" | "rejected") => {
    if (!selectedRedemption) {
      return;
    }

    try {
      await updateRedemption.mutateAsync({
        id: selectedRedemption.id,
        status: nextStatus,
        reviewNote: reviewNote.trim() || undefined
      });

      toast.success(
        nextStatus === "approved" ? "Request marked delivered" : "Request rejected and refunded",
        selectedDisplayCode || selectedRedemption.reward?.title || "Redemption"
      );
    } catch (error) {
      toast.error("Redemption update failed", getApiError(error));
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Redemptions"
        subtitle="Paste a request code, inspect the Instagram handoff, then mark it delivered or reject and refund."
        right={<Badge variant="secondary">Results: {redemptions.data.total}</Badge>}
      />

      <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
                setSelectedId(null);
              }}
              className="pl-10"
              placeholder="Paste or search by request code, user, plan, or product"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Delivered" },
              { value: "rejected", label: "Rejected" },
              { value: "expired", label: "Expired" },
              { value: "all", label: "All" }
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={status === option.value ? "default" : "outline"}
                onClick={() => {
                  setStatus(option.value as "all" | RedemptionStatus);
                  setPage(1);
                  setSelectedId(null);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>{redemptions.data.total} result(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {redemptions.data.items.length ? (
              redemptions.data.items.map((redemption) => (
                <button
                  key={redemption.id}
                  type="button"
                  onClick={() => setSelectedId(redemption.id)}
                  className={`w-full rounded-[1.25rem] border p-4 text-left transition ${
                    selectedRedemption?.id === redemption.id
                      ? "border-[hsl(var(--arcetis-ember))] bg-[rgba(255,122,24,0.08)]"
                      : "border-border/70 bg-background/60 hover:border-border hover:bg-background/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-sm font-semibold">
                      {getDisplayRequestCode(redemption.requestCode, redemption.id)}
                    </p>
                    <Badge className={statusTone[redemption.status]} variant="outline">
                      {statusLabel[redemption.status]}
                    </Badge>
                  </div>
                  <p className="mt-3 font-medium">{redemption.reward?.title ?? "Unknown product"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {redemption.user?.username ?? "Unknown user"}
                    {redemption.planLabel ? ` | ${redemption.planLabel}` : ""}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">{formatDate(redemption.createdAt)}</p>
                </button>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No redemptions match the current filters.
              </div>
            )}

            <PaginationControls
              page={redemptions.data.page}
              totalPages={redemptions.data.totalPages}
              total={redemptions.data.total}
              itemLabel="request"
              onPrevious={() => {
                setPage((current) => Math.max(current - 1, 1));
                setSelectedId(null);
              }}
              onNext={() => {
                setPage((current) => Math.min(current + 1, redemptions.data.totalPages));
                setSelectedId(null);
              }}
            />
          </CardContent>
        </Card>

        {selectedRedemption ? (
          <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{selectedRedemption.reward?.title ?? "Request details"}</CardTitle>
                  <CardDescription>
                    {selectedRedemption.planLabel ?? "Standard"}
                    {typeof selectedRedemption.pointsSpent === "number"
                      ? ` | ${formatNumber(selectedRedemption.pointsSpent)} pts`
                      : ""}
                  </CardDescription>
                </div>
                <Badge className={statusTone[selectedRedemption.status]} variant="outline">
                  {statusLabel[selectedRedemption.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Request code</p>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="font-mono font-semibold">{selectedDisplayCode}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={async () => {
                        await navigator.clipboard.writeText(selectedDisplayCode);
                        setCopiedCode(selectedDisplayCode);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {copiedCode === selectedDisplayCode ? (
                    <p className="mt-2 text-xs text-muted-foreground">Copied</p>
                  ) : null}
                </div>

                <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">User</p>
                  <p className="mt-3 font-semibold">{selectedRedemption.user?.username ?? "-"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedRedemption.user?.email ?? "-"}</p>
                </div>

                <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Created</p>
                  <p className="mt-3 font-semibold">{formatDate(selectedRedemption.createdAt)}</p>
                </div>

                <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Processed</p>
                  <p className="mt-3 font-semibold">{formatDate(selectedRedemption.processedAt)}</p>
                </div>
              </div>

              {selectedRedemption.reviewedBy ? (
                <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  Reviewed by <span className="font-medium text-foreground">{selectedRedemption.reviewedBy.username}</span>
                  {" | "}
                  {selectedRedemption.reviewedBy.email}
                </div>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.3rem] border border-border/70 bg-background/60 p-4">
                    <p className="text-sm font-medium">Requested info</p>
                    {requestedInfoEntries.length ? (
                      <div className="mt-4 space-y-3">
                        {requestedInfoEntries.map(([key, value]) => (
                          <div key={key} className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{key}</p>
                            <p className="mt-1 break-all text-sm">{value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">No extra delivery info was submitted.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.3rem] border border-border/70 bg-background/60 p-4">
                    <p className="text-sm font-medium">Admin note</p>
                    <Textarea
                      className="mt-3 min-h-[140px]"
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      placeholder="Add an internal note before marking delivered or rejecting/refunding."
                      disabled={selectedRedemption.status !== "pending"}
                    />
                  </div>

                  <div className="rounded-[1.3rem] border border-border/70 bg-background/60 p-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Rejecting this request will automatically refund the user&apos;s points and return the product to stock.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        className="w-full"
                        disabled={selectedRedemption.status !== "pending" || updateRedemption.isPending}
                        onClick={() => handleReview("approved")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark delivered
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-red-500/35 bg-red-500/10 text-red-100 hover:bg-red-500/16"
                        disabled={selectedRedemption.status !== "pending" || updateRedemption.isPending}
                        onClick={() => handleReview("rejected")}
                      >
                        <ShieldX className="mr-2 h-4 w-4" />
                        Reject and refund
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Choose a redemption request to inspect its code, delivery info, and admin actions.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

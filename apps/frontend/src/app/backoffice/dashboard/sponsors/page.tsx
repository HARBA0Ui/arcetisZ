"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Globe2, Megaphone, Search, XCircle } from "lucide-react";
import { PaginationControls } from "@/backoffice/components/backoffice/pagination-controls";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { useAdminSponsorRequests, useReviewSponsorRequest } from "@/backoffice/hooks/useAdmin";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiError } from "@/lib/api";
import { normalizeAssetUrl } from "@/lib/assets";
import { formatSponsorCategory, isOtherSponsorCategory } from "@/lib/sponsor-requests";
import type { SponsorRequest, SponsorRequestStatus } from "@/lib/types";

const statusOptions: Array<{ value: "all" | SponsorRequestStatus; label: string }> = [
  { value: "all", label: "All requests" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" }
];

const sponsorStatusStyles: Record<SponsorRequestStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200"
};

export default function BackofficeSponsorsPage() {
  const [status, setStatus] = useState<"all" | SponsorRequestStatus>("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reviewNote, setReviewNote] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const requests = useAdminSponsorRequests({
    status: status === "all" ? undefined : status,
    q: query || undefined,
    page,
    pageSize: 8
  });
  const reviewRequest = useReviewSponsorRequest();
  const toast = useToast();

  const selectedRequest = useMemo(
    () => requests.data?.items.find((request) => request.id === activeId) ?? requests.data?.items[0] ?? null,
    [activeId, requests.data]
  );

  useEffect(() => {
    setReviewNote(selectedRequest?.reviewNote ?? "");
  }, [selectedRequest?.id, selectedRequest?.reviewNote]);

  const submitReview = async (
    event: FormEvent,
    nextStatus: Extract<SponsorRequestStatus, "accepted" | "rejected">
  ) => {
    event.preventDefault();

    if (!selectedRequest) return;

    try {
      await reviewRequest.mutateAsync({
        id: selectedRequest.id,
        status: nextStatus,
        reviewNote: reviewNote.trim() || undefined
      });

      toast.success(
        nextStatus === "accepted" ? "Request accepted" : "Request rejected",
        selectedRequest.title
      );
      setReviewNote("");
      setActiveId(null);
    } catch (error) {
      toast.error("Review failed", getApiError(error));
    }
  };

  return (
    <div>
      <SectionHeader
        title="Sponsors"
        subtitle="Review promotion requests, confirm the commercial agreement, then publish accepted ones into live sponsored quests."
        right={
          <Select
            className="w-[11rem]"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "all" | SponsorRequestStatus);
              setActiveId(null);
              setReviewNote("");
              setPage(1);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        }
      />

      {requests.isLoading ? <LoadingCard label="Loading sponsor requests..." /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Request Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                  setActiveId(null);
                }}
                className="pl-10"
                placeholder="Search by title, company, contact, or member"
              />
            </div>

            {(requests.data?.items ?? []).map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => {
                  setActiveId(request.id);
                  setReviewNote(request.reviewNote ?? "");
                }}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedRequest?.id === request.id
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/70 hover:bg-muted/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{request.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.companyName} | {request.submittedBy?.username ?? request.contactName}
                    </p>
                  </div>
                  <Badge className={sponsorStatusStyles[request.status]} variant="outline">
                    {request.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{formatSponsorCategory(request.category)}</Badge>
                  <Badge variant="outline">{request.requestedPointsReward} pts</Badge>
                  <Badge variant="outline">{request.requestedXpReward} XP</Badge>
                  <Badge variant="outline">Max {request.maxCompletions}</Badge>
                </div>
              </button>
            ))}

            {!requests.isLoading && (requests.data?.items.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-5 text-sm text-muted-foreground">
                No sponsor requests in this view.
              </div>
            ) : null}

            {requests.data ? (
              <PaginationControls
                page={requests.data.page}
                totalPages={requests.data.totalPages}
                total={requests.data.total}
                itemLabel="request"
                onPrevious={() => {
                  setPage((current) => Math.max(current - 1, 1));
                  setActiveId(null);
                }}
                onNext={() => {
                  setPage((current) => Math.min(current + 1, requests.data.totalPages));
                  setActiveId(null);
                }}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRequest ? (
              <div className="rounded-xl border border-dashed border-border/80 p-5 text-sm text-muted-foreground">
                Select a sponsor request to inspect and review it.
              </div>
            ) : (
              <form className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold">{selectedRequest.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.companyName} | {formatSponsorCategory(selectedRequest.category)}
                    </p>
                  </div>
                  <Badge className={sponsorStatusStyles[selectedRequest.status]} variant="outline">
                    {selectedRequest.status}
                  </Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={selectedRequest.contactName} readOnly />
                  <Input value={selectedRequest.contactEmail} readOnly />
                  <Input
                    value={
                      selectedRequest.platform ??
                      (isOtherSponsorCategory(selectedRequest.category)
                        ? "Custom request"
                        : formatSponsorCategory(selectedRequest.category))
                    }
                    readOnly
                  />
                  <Input value={`Level ${selectedRequest.minLevel}+`} readOnly />
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-sm font-medium">Campaign brief</p>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedRequest.description}</p>
                  {selectedRequest.imageUrl ? (
                    <img
                      src={normalizeAssetUrl(selectedRequest.imageUrl)}
                      alt={selectedRequest.title}
                      className="mt-4 h-28 w-28 rounded-xl border border-border object-cover"
                    />
                  ) : null}
                  {isOtherSponsorCategory(selectedRequest.category) && selectedRequest.otherReason ? (
                    <>
                      <p className="mt-4 text-sm font-medium">Other category reason</p>
                      <p className="mt-2 text-sm text-muted-foreground">{selectedRequest.otherReason}</p>
                    </>
                  ) : null}
                  {selectedRequest.proofRequirements ? (
                    <>
                      <p className="mt-4 text-sm font-medium">Proof requirements</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {selectedRequest.proofRequirements}
                      </p>
                    </>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/70 p-4">
                    <p className="text-sm font-medium">Rewards</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedRequest.requestedPointsReward} pts / {selectedRequest.requestedXpReward} XP
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 p-4">
                    <p className="text-sm font-medium">Limits</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedRequest.maxCompletions} people | level {selectedRequest.minLevel}+
                    </p>
                  </div>
                </div>

                {selectedRequest.landingUrl ? (
                  <a
                    href={selectedRequest.landingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    <Globe2 className="h-4 w-4" />
                    Open campaign link
                  </a>
                ) : null}

                {selectedRequest.status !== "pending" && selectedRequest.publishedQuest ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
                    Published quest: {selectedRequest.publishedQuest.title}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Review note</p>
                  <Textarea
                    rows={4}
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="Optional note returned to the sponsor."
                    disabled={selectedRequest.status !== "pending"}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    className="gap-2"
                    disabled={selectedRequest.status !== "pending" || reviewRequest.isPending}
                    onClick={(event) => submitReview(event, "accepted")}
                  >
                    {reviewRequest.isPending ? <Spinner className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve and publish
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="gap-2"
                    disabled={selectedRequest.status !== "pending" || reviewRequest.isPending}
                    onClick={(event) => submitReview(event, "rejected")}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

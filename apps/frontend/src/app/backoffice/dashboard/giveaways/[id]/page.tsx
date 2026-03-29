"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock3, ImageIcon, Search, Trophy, UserCircle2, XCircle } from "lucide-react";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import {
  useAdminGiveawayDetails,
  useReviewGiveawayEntry,
  useUpdateGiveaway
} from "@/backoffice/hooks/useAdmin";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { normalizeAssetUrl } from "@/lib/assets";
import { getApiError } from "@/lib/api";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import type { GiveawayField, GiveawayEntryStatus } from "@/lib/types";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function formatAccountAge(days?: number | null) {
  if (!days) {
    return "No account age lock";
  }

  return `${formatNumber(days)} days`;
}

function getStatusBadge(status: GiveawayEntryStatus) {
  switch (status) {
    case "selected":
      return { label: "Selected", variant: "default" as const };
    case "rejected":
      return { label: "Rejected", variant: "outline" as const };
    default:
      return { label: "Pending", variant: "secondary" as const };
  }
}

export default function BackofficeGiveawayDetailPage() {
  const params = useParams<{ id: string }>();
  const giveawayId = params?.id ?? "";
  const giveaway = useAdminGiveawayDetails(giveawayId);
  const reviewEntry = useReviewGiveawayEntry();
  const updateGiveaway = useUpdateGiveaway();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | GiveawayEntryStatus>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [proofOnly, setProofOnly] = useState(false);
  const [durationDays, setDurationDays] = useState(7);

  useEffect(() => {
    if (!giveaway.data?.endsAt) {
      setDurationDays(7);
      return;
    }

    const remainingDays = Math.max(
      1,
      Math.ceil((new Date(giveaway.data.endsAt).getTime() - Date.now()) / DAY_IN_MS)
    );
    setDurationDays(remainingDays);
  }, [giveaway.data?.endsAt, giveaway.data?.id]);

  const fieldMap = new Map(
    (((giveaway.data?.inputFields as GiveawayField[] | null) ?? [])).map((field) => [field.id, field.label])
  );

  const filteredEntries = useMemo(() => {
    const entries = [...(giveaway.data?.entries ?? [])];
    const query = search.trim().toLowerCase();

    return entries
      .filter((entry) => {
        const statusMatches = statusFilter === "all" || entry.status === statusFilter;
        const proofMatches = !proofOnly || !!entry.justificationImageUrls?.length;
        const searchMatches =
          !query ||
          [entry.user?.username ?? "", entry.user?.email ?? "", entry.justification ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return statusMatches && proofMatches && searchMatches;
      })
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [giveaway.data?.entries, proofOnly, search, sortOrder, statusFilter]);

  async function handleReview(entryId: string, status: "selected" | "rejected") {
    if (!giveaway.data) {
      return;
    }

    try {
      const result = await reviewEntry.mutateAsync({
        id: entryId,
        giveawayId: giveaway.data.id,
        status
      });

      toast.success(
        status === "selected" ? "Winner selected" : "Entry rejected",
        result.autoClosed
          ? "Winner slots are full, so the giveaway closed automatically and the remaining pending entries were updated."
          : "The giveaway entry was updated successfully."
      );
    } catch (error) {
      toast.error("Giveaway review failed", getApiError(error));
    }
  }

  async function handleDurationUpdate() {
    if (!giveaway.data) {
      return;
    }

    try {
      await updateGiveaway.mutateAsync({
        id: giveaway.data.id,
        durationDays,
        ...(giveaway.data.status === "CLOSED" ? { status: "ACTIVE" as const } : {})
      });

      toast.success(
        giveaway.data.status === "CLOSED" ? "Giveaway reopened" : "Duration updated",
        `This giveaway will now run for ${formatNumber(durationDays)} day${durationDays === 1 ? "" : "s"} from now.`
      );
    } catch (error) {
      toast.error("Giveaway update failed", getApiError(error));
    }
  }

  async function handleCloseNow() {
    if (!giveaway.data) {
      return;
    }

    try {
      await updateGiveaway.mutateAsync({
        id: giveaway.data.id,
        status: "CLOSED"
      });

      toast.success("Giveaway closed", "This giveaway is now closed on the frontoffice.");
    } catch (error) {
      toast.error("Close giveaway failed", getApiError(error));
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title={giveaway.data?.title ?? "Giveaway details"}
        subtitle="Review the poster, rules, and proof images, then adjust duration or lock winners without leaving backoffice."
        right={
          <Button asChild variant="outline">
            <Link href="/backoffice/dashboard/giveaways">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to giveaways
            </Link>
          </Button>
        }
      />

      {giveaway.isLoading && !giveaway.data ? <LoadingCard label="Loading giveaway details..." /> : null}

      {giveaway.data ? (
        <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[hsl(var(--arcetis-ember))]" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={giveaway.data.status === "ACTIVE" ? "secondary" : "outline"}>{giveaway.data.status}</Badge>
                  <Badge variant="outline">
                    {formatNumber(giveaway.data.selectedCount ?? 0)} / {formatNumber(giveaway.data.winnerCount ?? 1)} selected
                  </Badge>
                  <Badge variant="outline">{formatNumber(giveaway.data.entryCount ?? 0)} applications</Badge>
                </div>

                {giveaway.data.imageUrl ? (
                  <img
                    src={normalizeAssetUrl(giveaway.data.imageUrl)}
                    alt={giveaway.data.title}
                    className="aspect-[4/3] w-full rounded-2xl border border-border/70 object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/50 text-sm text-muted-foreground">
                    No poster added
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-[0.18em]">Prize summary</p>
                  <p className="mt-2 text-foreground">{giveaway.data.prizeSummary || "No prize summary added."}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em]">Description</p>
                  <p className="mt-2 whitespace-pre-line text-foreground">{giveaway.data.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs uppercase tracking-[0.18em]">Closes</p>
                    <p className="mt-2 text-foreground">{formatDate(giveaway.data.endsAt)}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs uppercase tracking-[0.18em]">Edit policy</p>
                    <p className="mt-2 text-foreground">
                      {giveaway.data.allowEntryEdits ? "Pending entries can be updated" : "Entries are final after submit"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs uppercase tracking-[0.18em]">Public rules</p>
                    <p className="mt-2 text-foreground">
                      Level {formatNumber(giveaway.data.minLevel ?? 1)}+ • {formatAccountAge(giveaway.data.minAccountAge)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="text-xs uppercase tracking-[0.18em]">Proof rule</p>
                    <p className="mt-2 text-foreground">
                      {giveaway.data.requiresJustification
                        ? `${giveaway.data.justificationLabel || "1 to 3 proof images required"}`
                        : "No proof images required"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div className="space-y-2">
                    <label htmlFor="giveaway-duration-days" className="text-sm font-medium text-foreground">
                      Set duration from now
                    </label>
                    <div className="relative">
                      <Input
                        id="giveaway-duration-days"
                        type="number"
                        min={1}
                        max={365}
                        value={durationDays}
                        onChange={(event) =>
                          setDurationDays(Math.max(1, Math.min(365, Number(event.target.value) || 1)))
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        days
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => void handleDurationUpdate()}
                    disabled={updateGiveaway.isPending}
                  >
                    <Clock3 className="mr-2 h-4 w-4" />
                    {giveaway.data.status === "CLOSED" ? "Reopen with duration" : "Update duration"}
                  </Button>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/55 p-3 text-sm text-muted-foreground">
                  The giveaway closes automatically when the duration ends or when all winner slots are selected.
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => void handleCloseNow()}
                  disabled={updateGiveaway.isPending || giveaway.data.status === "CLOSED"}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Close now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(giveaway.data.inputFields?.length ?? 0) ? (
                  giveaway.data.inputFields?.map((field) => (
                    <div key={field.id} className="rounded-xl border border-border/70 bg-background/60 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">{field.label}</p>
                        <Badge variant="outline">{field.type ?? "TEXT"}</Badge>
                      </div>
                      <p className="mt-2 text-muted-foreground">{field.placeholder || "No placeholder"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{field.required === false ? "Optional" : "Required"}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
                    This giveaway does not ask for any extra fields.
                  </div>
                )}
              </CardContent>
            </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <CardTitle>Applications</CardTitle>
                  <Badge variant="outline">{formatNumber(filteredEntries.length)} shown</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="pl-10"
                      placeholder="Search by user or note"
                    />
                  </div>
                  <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | GiveawayEntryStatus)}>
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                  <Select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </Select>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={proofOnly}
                    onChange={(event) => setProofOnly(event.target.checked)}
                  />
                  Only show entries with proof images
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(giveaway.data.entries?.length ?? 0) ? (
                filteredEntries.length ? (
                  filteredEntries.map((entry) => {
                    const badge = getStatusBadge(entry.status);

                    return (
                      <div key={entry.id} className="rounded-2xl border border-border/70 bg-background/55 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
                              <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{entry.user?.username || "User"}</p>
                              <p className="text-sm text-muted-foreground">{entry.user?.email}</p>
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div className="flex justify-end gap-2">
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                              {entry.justificationImageUrls?.length ? (
                                <Badge variant="outline" className="gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {formatNumber(entry.justificationImageUrls.length)} proof
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-2">Submitted {formatDateTime(entry.createdAt)}</p>
                            {entry.reviewedAt ? <p>Reviewed {formatDateTime(entry.reviewedAt)}</p> : null}
                            {entry.reviewedBy?.username ? <p>By {entry.reviewedBy.username}</p> : null}
                          </div>
                        </div>

                        {entry.status === "pending" ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={reviewEntry.isPending}
                              onClick={() => void handleReview(entry.id, "selected")}
                            >
                              Select winner
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={reviewEntry.isPending}
                              onClick={() => void handleReview(entry.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : null}

                        {entry.answers && Object.keys(entry.answers).length ? (
                          <div className="mt-4 overflow-hidden rounded-xl border border-border/70">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Field</TableHead>
                                  <TableHead>Answer</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(entry.answers).map(([fieldId, value]) => (
                                  <TableRow key={fieldId}>
                                    <TableCell>{fieldMap.get(fieldId) ?? fieldId}</TableCell>
                                    <TableCell>{value}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : null}

                        {entry.justification ? (
                          <div className="mt-4 rounded-xl border border-border/70 bg-card/60 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Note</p>
                            <p className="mt-2 whitespace-pre-line text-sm text-foreground">{entry.justification}</p>
                          </div>
                        ) : null}

                        {entry.justificationImageUrls?.length ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {entry.justificationImageUrls.map((imageUrl) => (
                              <a
                                key={imageUrl}
                                href={normalizeAssetUrl(imageUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="overflow-hidden rounded-xl border border-border/70 bg-background/65"
                              >
                                <img
                                  src={normalizeAssetUrl(imageUrl)}
                                  alt="Giveaway proof"
                                  className="aspect-square w-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-background/50 p-6 text-sm text-muted-foreground">
                    No entries match the current filters.
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-background/50 p-6 text-sm text-muted-foreground">
                  No one has applied to this giveaway yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : giveaway.isLoading ? null : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Giveaway details are not available right now.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

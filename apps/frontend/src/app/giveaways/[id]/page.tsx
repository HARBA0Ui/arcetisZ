"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  ImageIcon,
  PencilLine,
  ShieldCheck,
  Ticket,
  Trophy,
  Upload,
  Users2,
  X
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SyncBanner } from "@/components/common/sync-banner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { normalizeAssetUrl } from "@/lib/assets";
import { useMe } from "@/hooks/useAuth";
import { useCountdown } from "@/hooks/use-countdown";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useApplyGiveaway, useGiveawayById, useUpdateGiveawayEntry } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";

const MAX_GIVEAWAY_PROOF_IMAGES = 3;

function getFieldInputType(type?: string) {
  switch (type) {
    case "EMAIL":
      return "email";
    case "LINK":
      return "url";
    default:
      return "text";
  }
}

function formatAccountAge(days?: number | null) {
  if (!days) {
    return "No account age lock";
  }

  return `${formatNumber(days)} days account age`;
}

function getAccountAgeDays(createdAt?: string | null) {
  if (!createdAt) {
    return 0;
  }

  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    return 0;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - createdAtDate.getTime()) / millisecondsPerDay));
}

function formatDayCount(days: number) {
  return `${formatNumber(days)} ${days === 1 ? "day" : "days"}`;
}

function GiveawayCountdown({ endsAt, status, long = false }: { endsAt?: string | null; status: "ACTIVE" | "CLOSED"; long?: boolean }) {
  const countdown = useCountdown(status === "CLOSED" ? null : endsAt ?? null);

  if (status === "CLOSED") {
    return <span>Closed</span>;
  }

  if (!endsAt) {
    return <span>No deadline</span>;
  }

  return <span>{countdown.isReady ? "Closing now" : `Ends in ${long ? countdown.longLabel : countdown.shortLabel}`}</span>;
}

function getEntryStatusMeta(status?: "pending" | "selected" | "rejected") {
  switch (status) {
    case "selected":
      return {
        label: "Selected",
        title: "You were selected",
        description: "The admin marked your entry as one of the winners. Keep this page handy in case they need your submitted details again.",
        variant: "default" as const
      };
    case "rejected":
      return {
        label: "Not selected",
        title: "This entry was not selected",
        description: "Your entry is still saved here for reference, but the winners were already chosen for this drop.",
        variant: "outline" as const
      };
    case "pending":
      return {
        label: "Pending review",
        title: "Your entry is in review",
        description: "The admin can still review this entry. If edits are allowed, you can update your proof until the giveaway closes.",
        variant: "secondary" as const
      };
    default:
      return null;
  }
}

export default function GiveawayDetailPage() {
  const params = useParams<{ id: string }>();
  const giveawayId = params?.id ?? "";
  const { data: viewer } = useMe();
  const giveawayQuery = useGiveawayById(giveawayId);
  const giveaway = giveawayQuery.data;
  const applyMutation = useApplyGiveaway();
  const updateEntryMutation = useUpdateGiveawayEntry();
  const toast = useToast();
  const showSyncBanner = useSmoothBusy(!!giveaway && giveawayQuery.isFetching);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [justification, setJustification] = useState("");
  const [keptJustificationImageUrls, setKeptJustificationImageUrls] = useState<string[]>([]);
  const [newJustificationFiles, setNewJustificationFiles] = useState<File[]>([]);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!giveaway) {
      return;
    }

    // Reset the local draft whenever the server entry snapshot changes.
    setAnswers(
      Object.fromEntries(
        (giveaway.inputFields ?? []).map((field) => [field.id, giveaway.viewerEntry?.answers?.[field.id] ?? ""])
      )
    );
    setJustification(giveaway.viewerEntry?.justification ?? "");
    setKeptJustificationImageUrls(giveaway.viewerEntry?.justificationImageUrls ?? []);
    setNewJustificationFiles([]);
  }, [giveaway]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const newFilePreviews = useMemo(
    () =>
      newJustificationFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file)
      })),
    [newJustificationFiles]
  );

  useEffect(() => {
    return () => {
      for (const preview of newFilePreviews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [newFilePreviews]);

  useEffect(() => {
    if (!giveaway?.endsAt || giveaway.status === "CLOSED") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [giveaway?.endsAt, giveaway?.status]);

  const isClosed = useMemo(() => {
    if (!giveaway) {
      return false;
    }

    if (giveaway.status === "CLOSED") {
      return true;
    }

    if (!giveaway.endsAt) {
      return false;
    }

    return new Date(giveaway.endsAt).getTime() < currentTime;
  }, [currentTime, giveaway]);

  const entryStatus = getEntryStatusMeta(giveaway?.viewerEntry?.status);
  const needsProofImages = !!giveaway?.requiresJustification;
  const hasApplied = !!giveaway?.viewerEntry;
  const canEditEntry =
    !!giveaway &&
    !!giveaway.viewerEntry &&
    giveaway.viewerEntry.status === "pending" &&
    !!giveaway.allowEntryEdits &&
    !isClosed;
  const requiredMissing = useMemo(
    () =>
      (giveaway?.inputFields ?? []).some((field) => (field.required ?? true) && !answers[field.id]?.trim()),
    [answers, giveaway?.inputFields]
  );
  const totalProofImages = keptJustificationImageUrls.length + newJustificationFiles.length;
  const eligibility = useMemo(() => {
    if (!giveaway) {
      return null;
    }

    if (!viewer) {
      return {
        canEnter: false,
        isChecking: true,
        blockers: ["Checking whether this account meets the giveaway rules..."]
      };
    }

    const minLevel = Math.max(giveaway.minLevel ?? 1, 1);
    const minAccountAge = Math.max(giveaway.minAccountAge ?? 0, 0);
    const viewerLevel = Math.max(viewer.level ?? 1, 1);
    const viewerAccountAge = getAccountAgeDays(viewer.createdAt);
    const blockers: string[] = [];

    if (viewerLevel < minLevel) {
      blockers.push(`You need level ${formatNumber(minLevel)}. Your account is level ${formatNumber(viewerLevel)}.`);
    }

    if (viewerAccountAge < minAccountAge) {
      const remainingDays = minAccountAge - viewerAccountAge;
      blockers.push(
        `You need an account at least ${formatDayCount(minAccountAge)} old. Yours is ${formatDayCount(viewerAccountAge)} old, so you can enter in ${formatDayCount(remainingDays)}.`
      );
    }

    return {
      canEnter: blockers.length === 0,
      isChecking: false,
      blockers
    };
  }, [giveaway, viewer]);
  const canSubmit =
    !!giveaway &&
    !isClosed &&
    !requiredMissing &&
    !!eligibility?.canEnter &&
    (!needsProofImages || totalProofImages >= 1) &&
    totalProofImages <= MAX_GIVEAWAY_PROOF_IMAGES &&
    (!hasApplied || canEditEntry);
  const isSubmitting = applyMutation.isPending || updateEntryMutation.isPending;
  const selectedCount = giveaway?.selectedCount ?? 0;
  const winnerCount = Math.max(giveaway?.winnerCount ?? 1, 1);
  const submitLabel = isSubmitting
    ? canEditEntry
      ? "Updating entry..."
      : "Sending entry..."
    : eligibility?.isChecking
      ? "Checking requirements..."
      : eligibility && !eligibility.canEnter
        ? "Requirements not met yet"
        : canEditEntry
          ? "Update entry"
          : isClosed
            ? "Closed"
            : "Send entry";

  async function handleSubmit() {
    if (!giveaway) {
      return;
    }

    try {
      const payload = {
        giveawayId: giveaway.id,
        answers,
        justification: justification.trim() || undefined,
        keptJustificationImageUrls,
        justificationImageFiles: newJustificationFiles
      };

      if (canEditEntry) {
        await updateEntryMutation.mutateAsync(payload);
        toast.success("Entry updated", "Your giveaway entry was updated successfully.");
        return;
      }

      await applyMutation.mutateAsync(payload);
      toast.success("Entry sent", "Your giveaway entry is now saved on your account.");
    } catch (error) {
      toast.error(canEditEntry ? "Update failed" : "Entry failed", getApiError(error));
    }
  }

  return (
    <>
      <PageHeader
        title={giveaway?.title ?? "Giveaway details"}
        subtitle="Review the rules first, then send one clean entry with the exact proof images this giveaway asks for."
        right={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/giveaways/mine">My giveaways</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/giveaways">Back to giveaways</Link>
            </Button>
          </div>
        }
      />

      {showSyncBanner ? <SyncBanner className="mb-6" message="Refreshing giveaway..." /> : null}

      {giveaway ? (
        <div className="space-y-6">
            {entryStatus ? (
              <Card className="rounded-[1.8rem] border-[rgba(255,122,24,0.22)] bg-[linear-gradient(135deg,rgba(28,20,15,0.96),rgba(18,18,18,0.98))]">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge variant={entryStatus.variant}>{entryStatus.label}</Badge>
                    <p className="mt-3 text-lg font-semibold text-foreground">{entryStatus.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{entryStatus.description}</p>
                  </div>
                  {canEditEntry ? (
                    <Badge variant="outline" className="gap-1 self-start">
                      <PencilLine className="h-3.5 w-3.5" />
                      Editing still open
                    </Badge>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95">
              {giveaway.imageUrl ? (
                <img
                  src={normalizeAssetUrl(giveaway.imageUrl)}
                  alt={giveaway.title}
                  className="aspect-[16/8] w-full object-cover"
                />
              ) : null}
              <CardContent className="space-y-5 p-6 sm:p-7">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={giveaway.status === "ACTIVE" ? "secondary" : "outline"}>
                      {giveaway.status === "ACTIVE" ? "Current giveaway" : "Closed"}
                    </Badge>
                    {isClosed ? <Badge variant="outline">Closed</Badge> : null}
                    {giveaway.requiresJustification ? <Badge variant="outline">1-3 proof images required</Badge> : null}
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">{giveaway.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{giveaway.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/65 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Prize</p>
                    <p className="mt-2 font-semibold">{giveaway.prizeSummary || "See description"}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/65 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Countdown</p>
                    <p className="mt-2 font-semibold">
                      <GiveawayCountdown endsAt={giveaway.endsAt} status={giveaway.status} long />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Rules before you enter</CardTitle>
                <CardDescription>See the exact limits and proof rules before you submit anything.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[1.35rem] border border-border/70 bg-background/65 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
                    <Trophy className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Winner slots</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {formatNumber(winnerCount)} winner{winnerCount === 1 ? "" : "s"} will be selected. {formatNumber(selectedCount)} already locked in.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 bg-background/65 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
                    <Clock3 className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Countdown</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    <GiveawayCountdown endsAt={giveaway.endsAt} status={giveaway.status} long />
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 bg-background/65 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
                    <Users2 className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Entry rules</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Level {formatNumber(Math.max(giveaway.minLevel ?? 1, 1))}+ • {formatAccountAge(giveaway.minAccountAge)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 bg-background/65 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
                    <Ticket className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Custom info</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {(giveaway.inputFields?.length ?? 0) > 0
                      ? `${formatNumber(giveaway.inputFields?.length ?? 0)} field${(giveaway.inputFields?.length ?? 0) === 1 ? "" : "s"} must match exactly what this giveaway asks for.`
                      : "This giveaway does not ask for any extra fields beyond your account application."}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 bg-background/65 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
                    <ImageIcon className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Proof images</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {giveaway.requiresJustification
                      ? giveaway.justificationLabel || "Upload 1 to 3 screenshots that support your entry."
                      : "No proof images are required for this giveaway."}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border/70 bg-background/65 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Edit policy</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {giveaway.allowEntryEdits
                      ? "You can update a pending entry until the giveaway closes."
                      : "This giveaway only allows one final submission, so check your info before sending it."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {(giveaway.inputFields?.length ?? 0) > 0 ? (
              <Card className="rounded-[2rem] border-border/70 bg-card/95">
                <CardHeader>
                  <CardTitle>Info this giveaway asks for</CardTitle>
                  <CardDescription>These are the extra fields the admin added for this giveaway.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {giveaway.inputFields?.map((field) => (
                    <div key={field.id} className="rounded-[1.2rem] border border-border/70 bg-background/65 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{field.label}</p>
                        <Badge variant="outline">{field.required === false ? "Optional" : "Required"}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{field.placeholder || "No extra placeholder added."}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {hasApplied && giveaway.viewerEntry ? (
              <Card className="rounded-[2rem] border-border/70 bg-card/95">
                <CardHeader>
                  <CardTitle>Your entry</CardTitle>
                  <CardDescription>Everything you already submitted is saved right here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={entryStatus?.variant ?? "secondary"}>{entryStatus?.label ?? giveaway.viewerEntry.status}</Badge>
                    <Badge variant="outline">Sent {formatDateTime(giveaway.viewerEntry.createdAt)}</Badge>
                    {giveaway.viewerEntry.reviewedAt ? (
                      <Badge variant="outline">Reviewed {formatDateTime(giveaway.viewerEntry.reviewedAt)}</Badge>
                    ) : null}
                  </div>

                  {Object.entries(giveaway.viewerEntry.answers ?? {}).length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(giveaway.viewerEntry.answers ?? {}).map(([fieldId, value]) => {
                        const field = giveaway.inputFields?.find((item) => item.id === fieldId);
                        return (
                          <div key={fieldId} className="rounded-[1.2rem] border border-border/70 bg-background/65 p-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{field?.label ?? fieldId}</p>
                            <p className="mt-2 break-all text-sm">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {giveaway.viewerEntry.justification ? (
                    <div className="rounded-[1.2rem] border border-border/70 bg-background/65 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Optional note</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6">{giveaway.viewerEntry.justification}</p>
                    </div>
                  ) : null}

                  {giveaway.viewerEntry.justificationImageUrls?.length ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {giveaway.viewerEntry.justificationImageUrls.map((imageUrl) => (
                        <a
                          key={imageUrl}
                          href={normalizeAssetUrl(imageUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-xl border border-border/70 bg-background/65"
                        >
                          <img
                            src={normalizeAssetUrl(imageUrl)}
                            alt="Saved giveaway proof"
                            className="aspect-square w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
            <Card className="rounded-[2rem] border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>
                  {canEditEntry ? "Update your entry" : hasApplied ? "Entry received" : isClosed ? "Giveaway closed" : "Enter now"}
                </CardTitle>
                <CardDescription>
                  {canEditEntry
                    ? "Your entry is still pending, so you can fix or improve it before the deadline."
                    : hasApplied
                      ? "You already entered. Reopen this page any time to review what you sent."
                      : isClosed
                        ? "This giveaway is no longer accepting new entries."
                        : "Send one complete entry so the team does not need to chase missing info."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 border-y border-border/60 py-4 text-sm">
                  <div className="text-center">
                    <Users2 className="mx-auto h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                    <p className="mt-2 text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">Entries</p>
                    <p className="mt-2 font-semibold">{formatNumber(giveaway.entryCount ?? 0)}</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="mx-auto h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                    <p className="mt-2 text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">Winner slots</p>
                    <p className="mt-2 font-semibold">{formatNumber(selectedCount)} / {formatNumber(winnerCount)}</p>
                  </div>
                </div>

                {!hasApplied || canEditEntry ? (
                  <div className="space-y-4">
                    {eligibility ? (
                      <div className="rounded-[1.15rem] border border-dashed border-border/70 bg-background/50 p-3 text-sm text-muted-foreground">
                        {eligibility.isChecking ? (
                          <p>{eligibility.blockers[0]}</p>
                        ) : eligibility.canEnter ? (
                          <p>You already meet this giveaway&apos;s level and account-age requirements.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">This account cannot enter yet.</p>
                            {eligibility.blockers.map((blocker) => (
                              <p key={blocker}>{blocker}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {(giveaway.inputFields ?? []).map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`giveaway-field-${field.id}`}>
                          {field.label}
                          {field.required === false ? "" : " *"}
                        </Label>
                        <Input
                          id={`giveaway-field-${field.id}`}
                          type={getFieldInputType(field.type)}
                          value={answers[field.id] ?? ""}
                          placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
                          onChange={(event) =>
                            setAnswers((current) => ({
                              ...current,
                              [field.id]: event.target.value
                            }))
                          }
                        />
                      </div>
                    ))}

                    {giveaway.requiresJustification ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>{giveaway.justificationLabel || "Upload 1 to 3 proof images"} *</Label>
                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/55 px-4 py-3 text-sm text-muted-foreground hover:border-[hsl(var(--arcetis-ember))]/40 hover:text-foreground">
                            <Upload className="h-4 w-4" />
                            <span>Add proof images</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(event) => {
                                const incoming = Array.from(event.target.files ?? []);
                                setNewJustificationFiles((current) =>
                                  [...current, ...incoming].slice(0, Math.max(0, MAX_GIVEAWAY_PROOF_IMAGES - keptJustificationImageUrls.length))
                                );
                                event.target.value = "";
                              }}
                            />
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Upload between 1 and {MAX_GIVEAWAY_PROOF_IMAGES} images. Current total: {formatNumber(totalProofImages)}.
                          </p>
                        </div>

                        {keptJustificationImageUrls.length || newFilePreviews.length ? (
                          <div className="grid gap-3 sm:grid-cols-3">
                            {keptJustificationImageUrls.map((imageUrl) => (
                              <div key={imageUrl} className="relative overflow-hidden rounded-xl border border-border/70 bg-background/65">
                                <img
                                  src={normalizeAssetUrl(imageUrl)}
                                  alt="Saved proof"
                                  className="aspect-square w-full object-cover"
                                />
                                <button
                                  type="button"
                                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                                  onClick={() =>
                                    setKeptJustificationImageUrls((current) => current.filter((value) => value !== imageUrl))
                                  }
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            {newFilePreviews.map((preview) => (
                              <div key={`${preview.file.name}-${preview.file.size}`} className="relative overflow-hidden rounded-xl border border-border/70 bg-background/65">
                                <img
                                  src={preview.url}
                                  alt={preview.file.name}
                                  className="aspect-square w-full object-cover"
                                />
                                <button
                                  type="button"
                                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                                  onClick={() =>
                                    setNewJustificationFiles((current) => current.filter((file) => file !== preview.file))
                                  }
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <Label htmlFor="giveaway-note">Optional note</Label>
                          <Textarea
                            id="giveaway-note"
                            rows={3}
                            value={justification}
                            onChange={(event) => setJustification(event.target.value)}
                            placeholder="Add a short note only if it helps explain the screenshots."
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[1.15rem] border border-dashed border-border/70 bg-background/50 p-3 text-sm text-muted-foreground">
                      {giveaway.allowEntryEdits
                        ? "If your entry stays pending, you can come back and edit it before the deadline."
                        : "This giveaway only accepts one final submission, so double-check your info before sending it."}
                    </div>

                    <Button className="w-full" disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
                      {submitLabel}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-[1.3rem] border border-border/70 bg-background/65 p-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--arcetis-ember))]" />
                      <p>
                        Your entry is attached to this account. If the admin reviews this giveaway later, they will see the exact info and proof images you already submitted.
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/giveaways/mine">
                        Open My giveaways
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      ) : giveawayQuery.isLoading ? (
        <Card className="max-w-3xl rounded-[2rem] border-border/70 bg-card/95">
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full rounded-[1.2rem]" />
            <Skeleton className="h-32 w-full rounded-[1.2rem]" />
            <Skeleton className="h-10 w-44" />
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl rounded-[2rem] border-border/70 bg-card/95">
          <CardContent className="p-6 text-sm text-muted-foreground">
            This giveaway was not found or is no longer available.
          </CardContent>
        </Card>
      )}
    </>
  );
}

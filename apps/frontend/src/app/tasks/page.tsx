"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CircleDot,
  Clock3,
  Gamepad2,
  Layers3,
  LockKeyhole,
  Megaphone,
  Orbit,
  Search,
  Share2,
  Sparkles,
  Target,
  X
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { DeferredSection } from "@/components/common/deferred-section";
import { PageHeader } from "@/components/common/page-header";
import { Spinner } from "@/components/common/spinner";
import { SyncBanner } from "@/components/common/sync-banner";
import { PromotionRequestForm } from "@/components/sponsor/promotion-request-form";
import { TaskThumbnail } from "@/components/tasks/task-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountdown } from "@/hooks/use-countdown";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useQuestSubmissions, useQuests, useSpinStatus, useUserStats } from "@/hooks/usePlatform";
import { formatDate, formatDateTime } from "@/lib/format";
import { completedToday, getQuestLastActivityAt, questNeedsProof } from "@/lib/quests";
import type { Quest, QuestCategory } from "@/lib/types";

type SectionKey = "daily" | "social" | "ads" | "games" | "others";

type SectionMeta = {
  key: SectionKey;
  title: string;
  description: string;
  icon: typeof CalendarDays;
  live: boolean;
  comingSoon?: string;
};

type TaskState = {
  label: string;
  variant: "default" | "secondary" | "outline";
};

const sectionMeta: SectionMeta[] = [
  {
    key: "daily",
    title: "Daily",
    description: "Fast, repeatable tasks that keep streaks, points, and XP moving every day.",
    icon: CalendarDays,
    live: true
  },
  {
    key: "social",
    title: "Social",
    description: "Follow, share, post, or confirm actions across social platforms and communities.",
    icon: Share2,
    live: true
  },
  {
    key: "ads",
    title: "Ads",
    description: "Paid ad-style tasks and sponsor placements.",
    icon: Megaphone,
    live: false,
    comingSoon: "Ad-style promotions are coming soon. This lane will stay quieter until paid placements and sponsor runs are ready."
  },
  {
    key: "games",
    title: "Games",
    description: "Game-specific missions, IDs, and gamer-focused reward actions.",
    icon: Gamepad2,
    live: false,
    comingSoon: "Game missions are coming soon. Expect title-specific tasks, IDs, and gameplay-focused drops here."
  },
  {
    key: "others",
    title: "Others",
    description: "Partner drops, special campaigns, and anything outside the core daily and social lanes.",
    icon: Layers3,
    live: true
  }
];

function matchesSearch(quest: Quest, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [quest.title, quest.description, quest.platform ?? "", quest.category].join(" ").toLowerCase();
  return haystack.includes(query);
}

function getSectionTasks(quests: Quest[], section: SectionKey) {
  switch (section) {
    case "daily":
      return quests.filter((quest) => quest.category === "DAILY");
    case "social":
      return quests.filter((quest) => quest.category === "SOCIAL");
    case "others":
      return quests.filter((quest) => quest.category !== "DAILY" && quest.category !== "SOCIAL");
    default:
      return [];
  }
}

function getCategoryLabel(category: QuestCategory) {
  if (category === "DAILY") return "Daily";
  if (category === "SOCIAL") return "Social";
  return "Other";
}

function getTaskState(quest: Quest, userLevel?: number): TaskState {
  const levelLocked = typeof userLevel === "number" && userLevel < quest.minLevel;

  if (levelLocked) {
    return { label: "Locked", variant: "outline" };
  }

  if (quest.latestSubmission?.status === "pending") {
    return { label: "Pending review", variant: "outline" };
  }

  if (quest.latestSubmission?.status === "approved" || completedToday(quest.lastCompletedAt)) {
    return { label: "Completed", variant: "default" };
  }

  if (questNeedsProof(quest)) {
    return { label: "Needs proof", variant: "secondary" };
  }

  return { label: "Ready", variant: "secondary" };
}

function getSubmissionStatusLabel(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function sortByPoints(quests: Quest[]) {
  return [...quests].sort((left, right) => {
    return right.pointsReward - left.pointsReward || right.xpReward - left.xpReward || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function TaskRow({ quest, userLevel }: { quest: Quest; userLevel?: number }) {
  const state = getTaskState(quest, userLevel);
  const levelLocked = typeof userLevel === "number" && userLevel < quest.minLevel;
  const lastActivity = formatDate(getQuestLastActivityAt(quest), "Never");

  return (
    <li>
      <Link
        href={`/tasks/${quest.id}`}
        className="group flex items-center gap-4 rounded-[1.35rem] border border-border/70 bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card"
      >
        <CircleDot className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />

        <TaskThumbnail
          title={quest.title}
          category={quest.category}
          imageUrl={quest.imageUrl}
          className="h-16 w-16 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold group-hover:text-foreground">{quest.title}</p>
            <Badge variant="outline">{getCategoryLabel(quest.category)}</Badge>
            {questNeedsProof(quest) ? <Badge variant="secondary">Proof</Badge> : null}
            {levelLocked ? (
              <Badge variant="outline" className="gap-1">
                <LockKeyhole className="h-3 w-3" />
                Locked
              </Badge>
            ) : null}
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{quest.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>{quest.pointsReward} pts</span>
            <span>{quest.xpReward} XP</span>
            <span>Level {quest.minLevel}+</span>
            <span>Last: {lastActivity}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant={state.variant}>{state.label}</Badge>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
      </Link>
    </li>
  );
}

function SpinTaskRow({
  canSpin,
  blockedByLevel,
  minLevel,
  cooldownHours,
  nextAvailableAt,
  isLoading
}: {
  canSpin?: boolean;
  blockedByLevel?: boolean;
  minLevel?: number;
  cooldownHours?: number;
  nextAvailableAt?: string | null;
  isLoading?: boolean;
}) {
  const countdown = useCountdown(nextAvailableAt);

  if (isLoading) {
    return <Skeleton className="h-[104px] w-full rounded-[1.35rem]" />;
  }

  const status = blockedByLevel ? "Locked" : canSpin ? "Ready" : "Cooling";
  const statusVariant = blockedByLevel ? "outline" : canSpin ? "default" : "secondary";
  const description = blockedByLevel
    ? `Unlocks at level ${minLevel ?? 2}.`
    : canSpin
      ? "Your daily spin is ready right now."
      : countdown.isReady
        ? "Your daily spin is ready right now."
        : `Next spin in ${countdown.shortLabel}.`;

  return (
    <li>
      <Link
        href="/spin"
        className="group flex items-center gap-4 rounded-[1.35rem] border border-border/70 bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card"
      >
        <CircleDot className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />

        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%),linear-gradient(135deg,_rgba(10,10,10,0.96),_rgba(83,49,16,0.82))] text-white shadow-sm">
          <Spinner className="h-6 w-6 text-[hsl(var(--arcetis-ember))]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold group-hover:text-foreground">Daily Spin</p>
            <Badge variant="outline">Daily</Badge>
            <Badge variant="secondary">Spin</Badge>
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>1 spin/day</span>
            <span>{cooldownHours ?? 24}h cooldown</span>
            <span>Level {minLevel ?? 2}+</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant={statusVariant}>{status}</Badge>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
      </Link>
    </li>
  );
}

function TaskSectionBlock({
  meta,
  tasks,
  userLevel,
  searchQuery,
  summaryLabel,
  extraRows
}: {
  meta: SectionMeta;
  tasks: Quest[];
  userLevel?: number;
  searchQuery: string;
  summaryLabel: string;
  extraRows?: React.ReactNode;
}) {
  const Icon = meta.icon;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/70">
              <Icon className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{meta.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline">{meta.live ? summaryLabel : "Coming soon"}</Badge>
      </div>

      {meta.live ? (
        tasks.length || extraRows ? (
          <ul className="space-y-3">
            {extraRows}
            {tasks.map((quest) => (
              <TaskRow key={quest.id} quest={quest} userLevel={userLevel} />
            ))}
          </ul>
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-background/45 p-5 text-sm text-muted-foreground">
            {searchQuery
              ? `No ${meta.title.toLowerCase()} tasks match your search right now.`
              : `No ${meta.title.toLowerCase()} tasks are live right now.`}
          </div>
        )
      ) : (
        <div className="rounded-[1.35rem] border border-dashed border-border/50 bg-background/30 p-5 text-sm text-muted-foreground opacity-80">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Clock3 className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
            {meta.title} is coming soon
          </div>
          <p className="mt-2 leading-6">{meta.comingSoon}</p>
        </div>
      )}
    </section>
  );
}

export default function TasksPage() {
  const questsQuery = useQuests();
  const submissionsQuery = useQuestSubmissions();
  const spinStatus = useSpinStatus();
  const stats = useUserStats();
  const userLevel = stats.data?.user.level;
  const [search, setSearch] = useState("");
  const [isPromotionModalOpen, setPromotionModalOpen] = useState(false);
  const [isPromotionGuideOpen, setPromotionGuideOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    if (!isPromotionModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPromotionModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPromotionModalOpen]);

  const hasTaskData = !!questsQuery.data || !!submissionsQuery.data || !!stats.data || !!spinStatus.data;
  const showSyncBanner = useSmoothBusy(
    hasTaskData && (questsQuery.isFetching || submissionsQuery.isFetching || stats.isFetching || spinStatus.isFetching)
  );
  const isBootstrappingQuests = questsQuery.isLoading && !questsQuery.data;
  const isBootstrappingSubmissions = submissionsQuery.isLoading && !submissionsQuery.data;

  const filteredQuests = useMemo(
    () => (questsQuery.data ?? []).filter((quest) => matchesSearch(quest, deferredSearch)),
    [deferredSearch, questsQuery.data]
  );
  const orderedQuests = useMemo(() => sortByPoints(filteredQuests), [filteredQuests]);

  const sectionedTasks = useMemo(
    () => ({
      daily: getSectionTasks(orderedQuests, "daily"),
      social: getSectionTasks(orderedQuests, "social"),
      others: getSectionTasks(orderedQuests, "others")
    }),
    [orderedQuests]
  );

  const dailyCompletedToday = sectionedTasks.daily.filter((quest) => completedToday(quest.lastCompletedAt)).length;
  const socialCompletedToday = sectionedTasks.social.filter((quest) => completedToday(quest.lastCompletedAt)).length;
  const dailyMaxPerDay = sectionedTasks.daily.length + 1;
  const socialMaxPerDay = stats.data?.limits.maxSocialTasksPerDay ?? sectionedTasks.social.length;
  const pendingProofs = submissionsQuery.data?.filter((item) => item.status === "pending").length ?? 0;
  const submissionsFallback = (
    <Card className="rounded-[1.8rem] border-border/70 bg-card/92 shadow-sm">
      <CardHeader>
        <CardTitle>My proof submissions</CardTitle>
        <CardDescription>Recent proof submissions and their review status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-md border border-border p-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Clear the highest-point tasks first and keep your account moving every time you show up."
        right={
          <Button variant="outline" size="sm" onClick={() => setPromotionModalOpen(true)}>
            <Megaphone className="mr-2 h-4 w-4" />
            Promote with Arcetis
          </Button>
        }
      />

      {showSyncBanner ? <SyncBanner className="mb-6" message="Refreshing tasks..." /> : null}

      <Card className="mb-8 rounded-[1.8rem] border-border/70 bg-card/92 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder="Search by task name, description, platform, or category"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Daily {dailyCompletedToday}/{dailyMaxPerDay} max/day</Badge>
            <Badge variant="outline">Social {socialCompletedToday}/{socialMaxPerDay} max/day</Badge>
            <Badge variant="outline">Others {sectionedTasks.others.length} live</Badge>
            <Badge variant="outline">Pending proofs {pendingProofs}</Badge>
          </div>
        </CardContent>
      </Card>

      {isBootstrappingQuests ? (
        <div className="space-y-8">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="mt-2 h-4 w-72" />
                </div>
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: index < 2 ? 2 : 1 }).map((__, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-[104px] w-full rounded-[1.35rem]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {sectionMeta.map((meta) => {
            let tasks: Quest[] = [];
            let summaryLabel = "Coming soon";
            let extraRows: React.ReactNode = null;

            if (meta.key === "daily") {
              tasks = sectionedTasks.daily;
              summaryLabel = `${tasks.length + 1} live • ${dailyMaxPerDay} max/day`;
              extraRows = (
                <SpinTaskRow
                  canSpin={spinStatus.data?.canSpin}
                  blockedByLevel={spinStatus.data?.blockedByLevel}
                  minLevel={spinStatus.data?.minLevel}
                  cooldownHours={spinStatus.data?.cooldownHours}
                  nextAvailableAt={spinStatus.data?.nextAvailableAt}
                  isLoading={spinStatus.isLoading && !spinStatus.data}
                />
              );
            } else if (meta.key === "social") {
              tasks = sectionedTasks.social;
              summaryLabel = `${tasks.length} live • ${socialMaxPerDay} max/day`;
            } else if (meta.key === "others") {
              tasks = sectionedTasks.others;
              summaryLabel = `${tasks.length} live`;
            }

            return (
              <TaskSectionBlock
                key={meta.key}
                meta={meta}
                tasks={tasks}
                userLevel={userLevel}
                searchQuery={deferredSearch}
                summaryLabel={summaryLabel}
                extraRows={extraRows}
              />
            );
          })}
        </div>
      )}

      <DeferredSection fallback={submissionsFallback}>
        <Card className="mt-10 rounded-[1.8rem] border-border/70 bg-card/92 shadow-sm">
          <CardHeader>
            <CardTitle>My proof submissions</CardTitle>
            <CardDescription>Recent proof submissions and review outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isBootstrappingSubmissions
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-md border border-border p-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-56" />
                    <Skeleton className="mt-2 h-3 w-32" />
                  </div>
                ))
              : submissionsQuery.data
                ? submissionsQuery.data.map((submission) => (
                    <div key={submission.id} className="rounded-md border border-border p-3">
                      <p className="font-medium">{submission.quest?.title ?? "Task"}</p>
                      <p className="text-muted-foreground">
                        Status: {getSubmissionStatusLabel(submission.status)} | Submitted: {formatDateTime(submission.createdAt)}
                      </p>
                      {submission.reviewNote ? <p className="text-muted-foreground">Review: {submission.reviewNote}</p> : null}
                    </div>
                  ))
                : (
                    <p className="text-muted-foreground">Proof submissions are not available right now.</p>
                  )}
            {!isBootstrappingSubmissions && !submissionsQuery.data?.length ? (
              <p className="text-muted-foreground">No proof submissions yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </DeferredSection>

      <Card className="mt-10 overflow-hidden rounded-[2rem] border-[rgba(255,122,24,0.18)] bg-[linear-gradient(135deg,_rgba(18,18,18,0.96),_rgba(34,22,11,0.96)_58%,_rgba(73,33,10,0.92))] text-white shadow-[0_24px_70px_-52px_rgba(255,122,24,0.42)]">
        <CardContent className="space-y-5 p-6 sm:p-7">
          <div className="max-w-3xl">
            <Badge className="border-white/10 bg-white/12 text-white hover:bg-white/12">Promote with Arcetis</Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Get your offer in front of real members.
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/72 sm:text-base">
              Launch a campaign, describe the goal clearly, and let the team review the fit, confirm pricing, and publish a cleaner task for members.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-full bg-[hsl(var(--arcetis-ember))] px-6 text-black hover:bg-[rgba(255,122,24,0.92)]"
              onClick={() => setPromotionModalOpen(true)}
            >
              <Megaphone className="mr-2 h-4 w-4" />
              Launch a campaign
            </Button>
            <Badge variant="outline" className="border-white/15 bg-white/8 px-3 py-2 text-white/80">
              Review usually takes about 2 days
            </Badge>
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-white/8 text-white hover:bg-white/12 hover:text-white"
              onClick={() => setPromotionGuideOpen((current) => !current)}
            >
              {isPromotionGuideOpen ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  What to expect
                </>
              )}
            </Button>
          </div>

          {isPromotionGuideOpen ? (
            <div className="grid gap-3 text-sm text-white/80 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/12 p-3">
                <p className="font-medium text-white">1. Review and fit check</p>
                <p className="mt-1 text-white/70">We usually review promotion requests within about 2 days.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/12 p-3">
                <p className="font-medium text-white">2. Pricing confirmation</p>
                <p className="mt-1 text-white/70">We confirm scope, audience, and pricing before anything goes live.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/12 p-3">
                <p className="font-medium text-white">3. Clean public launch</p>
                <p className="mt-1 text-white/70">Members see one clear task with better proof instructions and fewer follow-up questions.</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isPromotionModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Close promotion request modal"
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
            onClick={() => setPromotionModalOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promotion-request-title"
            className="relative z-[81] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-background shadow-[0_32px_120px_rgba(0,0,0,0.55)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--arcetis-ember))] to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,120,40,0.16),transparent_34%)]" />

            <div className="relative max-h-[88vh] overflow-y-auto p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <Badge variant="outline" className="gap-2 border-[hsl(var(--arcetis-ember)/0.35)]">
                    <Megaphone className="h-3.5 w-3.5 text-[hsl(var(--arcetis-ember))]" />
                    Launch a campaign
                  </Badge>
                  <div>
                    <h2 id="promotion-request-title" className="text-2xl font-semibold tracking-tight">
                      Get your offer in front of members
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      Tell us what you want to promote, how members should complete it, and what proof matters. We usually review requests within about 2 days before confirming scope and pricing.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-10 rounded-full p-0"
                  onClick={() => setPromotionModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <PromotionRequestForm submitLabel="Send for review" onSubmitted={() => setPromotionModalOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

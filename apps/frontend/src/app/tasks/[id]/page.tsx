"use client";

import Link from "next/link";
import { ExternalLink, LockKeyhole } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { useLanguage } from "@/components/i18n/language-provider";
import { Spinner } from "@/components/common/spinner";
import { SyncBanner } from "@/components/common/sync-banner";
import { TaskThumbnail } from "@/components/tasks/task-thumbnail";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useCompleteQuest, useQuestById, useSubmitQuestProof, useUserStats } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { completedToday, getQuestLastActivityAt, questNeedsProof } from "@/lib/quests";

type ProofState = {
  proofUrl: string;
  proofSecondaryUrl: string;
  proofText: string;
  profileProofFile?: File;
  followProofFile?: File;
};

function formatTaskDateTime(value?: string | null) {
  return value ? formatDateTime(value) : "-";
}

function getTaskDetailCopy(language: "en" | "ar") {
  return language === "ar"
    ? {
        fallbackTitle: "تفاصيل المهمة",
        subtitle: "راجع المهمة، وتأكد من قدرتك على تنفيذها، ثم أرسل الروابط أو الصور التي نحتاجها للموافقة.",
        backToTasks: "العودة إلى المهام",
        refreshing: "جارٍ تحديث تفاصيل المهمة...",
        proofRequired: "إثبات مطلوب",
        locked: "مغلق",
        daily: "يومي",
        social: "اجتماعي",
        sponsored: "برعاية",
        reward: "المكافأة",
        levelRequired: "المستوى المطلوب",
        levelValue: (level: number) => `المستوى ${level}+`,
        lastActivity: "آخر نشاط",
        completions: "عدد الإكمال",
        platform: "المنصة",
        proofInstructions: "تعليمات الإثبات",
        latestProofReview: "آخر مراجعة للإثبات",
        status: "الحالة",
        submitted: "تم الإرسال",
        reviewed: "تمت المراجعة",
        note: "ملاحظة",
        approved: "تمت الموافقة",
        rejected: "مرفوض",
        pending: "قيد المراجعة",
        startAndSendConfirmation: "ابدأ وأرسل التأكيد",
        startTaskTitle: "ابدأ المهمة",
        yourLevel: (level: number) => `مستواك الحالي: ${level}`,
        checkingLevel: "جارٍ التحقق من مستواك قبل تفعيل المهمة.",
        levelLockedWarning: (userLevel: number, minLevel: number) =>
          `مستواك الحالي هو ${userLevel}. هذه المهمة تُفتح عند المستوى ${minLevel}.`,
        openTaskLink: "افتح رابط المهمة",
        questCompleted: "تم إكمال المهمة",
        questFailed: "تعذر إكمال المهمة",
        processing: "جارٍ التنفيذ...",
        checkingLevelShort: "جارٍ التحقق من المستوى...",
        requiresLevel: (level: number) => `يتطلب المستوى ${level}`,
        completedToday: "أُنجزت اليوم",
        startTaskButton: "ابدأ المهمة",
        proofPending:
          "الإثبات قيد المراجعة بالفعل. لا يمكنك البدء مرة أخرى حتى تنتهي المراجعة.",
        proofApproved: "تمت الموافقة على هذه المهمة بالفعل لهذا الحساب.",
        proofLink: "رابط الإثبات",
        proofLinkPlaceholder: "الصق رابط المنشور أو الستوري أو التأكيد أو صفحة الدفع",
        secondProofLink: "رابط الإثبات الثاني",
        secondProofPlaceholder: "الصق الرابط الثاني أو التأكيد الإضافي المطلوب",
        uploadProof: "ارفع صورة للإثبات",
        uploadSecondProof: "ارفع صورة ثانية",
        extraNote: "ملاحظة إضافية (اختياري)",
        extraNotePlaceholder: "أضف أي شيء يساعدنا على فهم إثباتك بشكل أسرع",
        proofSubmitted: "تم إرسال الإثبات",
        proofSubmittedHint: "سيقوم المشرف بمراجعة إثبات المهمة.",
        submissionFailed: "فشل إرسال الإثبات",
        sending: "جارٍ الإرسال...",
        submitProof: "إرسال الإثبات",
        notFound: "هذه المهمة غير موجودة أو لم تعد نشطة.",
        never: "أبدًا"
      }
    : {
        fallbackTitle: "Task details",
        subtitle: "Review the task, confirm your access, and send any screenshots or links we need to approve it.",
        backToTasks: "Back to tasks",
        refreshing: "Refreshing task details...",
        proofRequired: "Proof required",
        locked: "Locked",
        reward: "Reward",
        levelRequired: "Level Required",
        levelValue: (level: number) => `Level ${level}+`,
        daily: "DAILY",
        social: "SOCIAL",
        sponsored: "SPONSORED",
        lastActivity: "Last Activity",
        completions: "Completions",
        platform: "Platform",
        proofInstructions: "Proof instructions",
        latestProofReview: "Latest proof review",
        status: "Status",
        submitted: "Submitted",
        reviewed: "Reviewed",
        note: "Note",
        approved: "Approved",
        rejected: "Rejected",
        pending: "Pending",
        startAndSendConfirmation: "Start and send confirmation",
        startTaskTitle: "Start task",
        yourLevel: (level: number) => `Your level: ${level}`,
        checkingLevel: "Checking your level before enabling this task.",
        levelLockedWarning: (userLevel: number, minLevel: number) =>
          `You are level ${userLevel}. This task unlocks at level ${minLevel}.`,
        openTaskLink: "Open task link",
        questCompleted: "Quest completed",
        questFailed: "Quest failed",
        processing: "Processing...",
        checkingLevelShort: "Checking level...",
        requiresLevel: (level: number) => `Requires level ${level}`,
        completedToday: "Completed today",
        startTaskButton: "Start task",
        proofPending: "Proof is already pending review. You cannot start again until the review is complete.",
        proofApproved: "This task has already been approved for your account.",
        proofLink: "Link to your proof",
        proofLinkPlaceholder: "Paste a post, story, checkout, or confirmation link",
        secondProofLink: "Second proof link",
        secondProofPlaceholder: "Paste the second link or confirmation we asked for",
        uploadProof: "Upload a screenshot of your proof",
        uploadSecondProof: "Upload a second screenshot",
        extraNote: "Extra note (optional)",
        extraNotePlaceholder: "Add anything that will help us understand your submission faster",
        proofSubmitted: "Proof submitted",
        proofSubmittedHint: "Admin will verify your quest proof.",
        submissionFailed: "Submission failed",
        sending: "Sending...",
        submitProof: "Submit proof",
        notFound: "This task was not found or is no longer active.",
        never: "Never"
      };
}

function getSubmissionStatusLabel(
  status: "pending" | "approved" | "rejected",
  copy: ReturnType<typeof getTaskDetailCopy>
) {
  if (status === "approved") return copy.approved;
  if (status === "rejected") return copy.rejected;
  return copy.pending;
}

export default function TaskDetailPage() {
  const { language } = useLanguage();
  const copy = getTaskDetailCopy(language);
  const params = useParams<{ id: string }>();
  const questId = params?.id ?? "";
  const questQuery = useQuestById(questId);
  const stats = useUserStats();
  const completeQuest = useCompleteQuest();
  const submitQuestProof = useSubmitQuestProof();
  const toast = useToast();
  const [proof, setProof] = useState<ProofState>({
    proofUrl: "",
    proofSecondaryUrl: "",
    proofText: ""
  });

  const quest = questQuery.data;
  const userLevel = stats.data?.user.level;
  const levelKnown = typeof userLevel === "number";
  const hasTaskData = !!quest || !!stats.data;
  const showSyncBanner = useSmoothBusy(hasTaskData && (questQuery.isFetching || stats.isFetching));

  const requiresProof = quest ? questNeedsProof(quest) : false;
  const latestStatus = quest?.latestSubmission?.status;
  const levelLocked = !!quest && levelKnown ? userLevel < quest.minLevel : false;
  const doneToday = quest ? completedToday(quest.lastCompletedAt) : false;
  const isInstagramSocial =
    quest?.category === "SOCIAL" && (quest.platform ?? "").toLowerCase().includes("instagram");
  const lastActivityAt = quest ? getQuestLastActivityAt(quest) : null;
  const canStartSimpleTask =
    !!quest && levelKnown && !levelLocked && !requiresProof && !doneToday && !completeQuest.isPending;
  const canSubmitProof =
    !!quest &&
    levelKnown &&
    !levelLocked &&
    latestStatus !== "pending" &&
    latestStatus !== "approved" &&
    !submitQuestProof.isPending &&
    (!isInstagramSocial ||
      ((proof.proofUrl || proof.profileProofFile) && (proof.proofSecondaryUrl || proof.followProofFile)));

  return (
    <>
      <PageHeader
        title={quest?.title ?? copy.fallbackTitle}
        subtitle={copy.subtitle}
        right={
          <Button asChild variant="outline" size="sm">
            <Link href="/tasks">{copy.backToTasks}</Link>
          </Button>
        }
      />

      {showSyncBanner ? <SyncBanner className="mb-6" message={copy.refreshing} /> : null}

      {quest ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <TaskThumbnail
                  title={quest.title}
                  category={quest.category}
                  imageUrl={quest.imageUrl}
                  className="h-28 w-full sm:h-28 sm:w-36"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{quest.title}</CardTitle>
                    <Badge variant="outline">
                      {quest.category === "DAILY"
                        ? copy.daily
                        : quest.category === "SOCIAL"
                          ? copy.social
                          : copy.sponsored}
                    </Badge>
                    {requiresProof ? <Badge variant="secondary">{copy.proofRequired}</Badge> : null}
                    {levelLocked ? (
                      <Badge variant="outline" className="gap-1">
                        <LockKeyhole className="h-3 w-3" />
                        {copy.locked}
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className="mt-2">{quest.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em]">{copy.reward}</p>
                  <p className="mt-2 font-medium text-foreground">
                    +{quest.pointsReward} pts / +{quest.xpReward} XP
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em]">{copy.levelRequired}</p>
                  <p className="mt-2 font-medium text-foreground">{copy.levelValue(quest.minLevel)}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em]">{copy.lastActivity}</p>
                  <p className="mt-2 font-medium text-foreground">
                    {lastActivityAt ? formatDateTime(lastActivityAt) : copy.never}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-[0.18em]">{copy.completions}</p>
                  <p className="mt-2 font-medium text-foreground">
                    {quest.completions} / {quest.maxCompletions}
                  </p>
                </div>
              </div>

              {quest.platform ? (
                <p className="text-sm text-muted-foreground">
                  {copy.platform}: <span className="font-medium text-foreground">{quest.platform}</span>
                </p>
              ) : null}

              {quest.proofInstructions ? (
                <div className="rounded-lg border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{copy.proofInstructions}</p>
                  <p className="mt-2">{quest.proofInstructions}</p>
                </div>
              ) : null}

              {quest.latestSubmission ? (
                <div className="rounded-lg border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{copy.latestProofReview}</p>
                  <p className="mt-2">{copy.status}: {getSubmissionStatusLabel(quest.latestSubmission.status, copy)}</p>
                  <p className="mt-1">{copy.submitted}: {formatTaskDateTime(quest.latestSubmission.createdAt)}</p>
                  {quest.latestSubmission.reviewedAt ? (
                    <p className="mt-1">{copy.reviewed}: {formatTaskDateTime(quest.latestSubmission.reviewedAt)}</p>
                  ) : null}
                  {quest.latestSubmission.reviewNote ? (
                    <p className="mt-2">{copy.note}: {quest.latestSubmission.reviewNote}</p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{requiresProof ? copy.startAndSendConfirmation : copy.startTaskTitle}</CardTitle>
              <CardDescription>
                {levelKnown ? copy.yourLevel(userLevel) : copy.checkingLevel}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {levelLocked ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  {copy.levelLockedWarning(userLevel ?? 0, quest.minLevel)}
                </div>
              ) : null}

              {quest.link ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={quest.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {copy.openTaskLink}
                  </Link>
                </Button>
              ) : null}

              {!requiresProof ? (
                <Button
                  className="w-full"
                  disabled={!canStartSimpleTask}
                  onClick={async () => {
                    try {
                      await completeQuest.mutateAsync(quest.id);
                      toast.success(copy.questCompleted, quest.title);
                    } catch (error) {
                      toast.error(copy.questFailed, getApiError(error));
                    }
                  }}
                >
                  {completeQuest.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner />
                      {copy.processing}
                    </span>
                  ) : !levelKnown ? (
                    copy.checkingLevelShort
                  ) : levelLocked ? (
                    copy.requiresLevel(quest.minLevel)
                  ) : doneToday ? (
                    copy.completedToday
                  ) : (
                    copy.startTaskButton
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  {latestStatus === "pending" ? (
                    <div className="rounded-lg border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                      {copy.proofPending}
                    </div>
                  ) : null}

                  {latestStatus === "approved" ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      {copy.proofApproved}
                    </div>
                  ) : null}

                  {latestStatus !== "pending" && latestStatus !== "approved" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="task-proof-url">{copy.proofLink}</Label>
                        <Input
                          id="task-proof-url"
                          placeholder={copy.proofLinkPlaceholder}
                          value={proof.proofUrl}
                          onChange={(event) =>
                            setProof((prev) => ({
                              ...prev,
                              proofUrl: event.target.value
                            }))
                          }
                        />
                      </div>

                      {isInstagramSocial ? (
                        <div className="space-y-2">
                          <Label htmlFor="task-proof-secondary-url">{copy.secondProofLink}</Label>
                          <Input
                            id="task-proof-secondary-url"
                            placeholder={copy.secondProofPlaceholder}
                            value={proof.proofSecondaryUrl}
                            onChange={(event) =>
                              setProof((prev) => ({
                                ...prev,
                                proofSecondaryUrl: event.target.value
                              }))
                            }
                          />
                        </div>
                      ) : null}

                      <div className="space-y-4 rounded-md border border-border p-3">
                        <div className="space-y-2">
                          <Label htmlFor="task-proof-profile">{copy.uploadProof}</Label>
                          <Input
                            id="task-proof-profile"
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              setProof((prev) => ({
                                ...prev,
                                profileProofFile: file
                              }));
                            }}
                          />
                        </div>

                        {isInstagramSocial ? (
                          <div className="space-y-2">
                            <Label htmlFor="task-proof-follow">{copy.uploadSecondProof}</Label>
                            <Input
                              id="task-proof-follow"
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                setProof((prev) => ({
                                  ...prev,
                                  followProofFile: file
                                }));
                              }}
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="task-proof-note">{copy.extraNote}</Label>
                        <Textarea
                          id="task-proof-note"
                          placeholder={copy.extraNotePlaceholder}
                          value={proof.proofText}
                          onChange={(event) =>
                            setProof((prev) => ({
                              ...prev,
                              proofText: event.target.value
                            }))
                          }
                        />
                      </div>

                      <Button
                        className="w-full"
                        disabled={!canSubmitProof}
                        onClick={async () => {
                          try {
                            await submitQuestProof.mutateAsync({
                              questId: quest.id,
                              proofUrl: proof.proofUrl || undefined,
                              proofSecondaryUrl: proof.proofSecondaryUrl || undefined,
                              proofText: proof.proofText || undefined,
                              profileProofFile: proof.profileProofFile,
                              followProofFile: proof.followProofFile
                            });

                            toast.success(copy.proofSubmitted, copy.proofSubmittedHint);
                            setProof({
                              proofUrl: "",
                              proofSecondaryUrl: "",
                              proofText: ""
                            });
                          } catch (error) {
                            toast.error(copy.submissionFailed, getApiError(error));
                          }
                        }}
                      >
                        {submitQuestProof.isPending ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner />
                            {copy.sending}
                          </span>
                        ) : !levelKnown ? (
                          copy.checkingLevelShort
                        ) : levelLocked ? (
                          copy.requiresLevel(quest.minLevel)
                        ) : (
                          copy.submitProof
                        )}
                      </Button>
                    </>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : questQuery.isLoading ? (
        <Card className="max-w-4xl">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Skeleton className="h-28 w-full rounded-xl sm:w-36" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-3xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {copy.notFound}
          </CardContent>
        </Card>
      )}
    </>
  );
}

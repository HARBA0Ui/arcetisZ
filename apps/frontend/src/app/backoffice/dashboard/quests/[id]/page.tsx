"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { useAdminQuestDetails, useUpdateQuest } from "@/backoffice/hooks/useAdmin";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiError } from "@/lib/api";
import { normalizeAssetUrl } from "@/lib/assets";

export default function BackofficeQuestDetailsPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const questId = params?.id;
  const quest = useAdminQuestDetails(questId);
  const updateQuest = useUpdateQuest();

  const [form, setForm] = useState({
    pointsReward: 0,
    xpReward: 0
  });

  useEffect(() => {
    if (!quest.data) {
      return;
    }

    setForm({
      pointsReward: quest.data.pointsReward,
      xpReward: quest.data.xpReward
    });
  }, [quest.data]);

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!questId) {
      return;
    }

    try {
      await updateQuest.mutateAsync({
        id: questId,
        pointsReward: form.pointsReward,
        xpReward: form.xpReward
      });
      toast.success("Quest rewards updated", quest.data?.title ?? "Quest");
    } catch (error) {
      toast.error("Quest update failed", getApiError(error));
    }
  }

  if (quest.isLoading && !quest.data) {
    return <LoadingCard label="Loading quest details..." />;
  }

  if (!quest.data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">This quest could not be found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title={quest.data.title}
        subtitle="Review this task and adjust the live reward values for members."
        right={
          <Button asChild variant="outline">
            <Link href="/backoffice/dashboard/quests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to quests
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{quest.data.category}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {quest.data.completions} / {quest.data.maxCompletions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending proofs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{quest.data.stats.pendingSubmissions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approved proofs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{quest.data.stats.approvedSubmissions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quest summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quest.data.imageUrl ? (
              <img
                src={normalizeAssetUrl(quest.data.imageUrl)}
                alt={quest.data.title}
                className="h-48 w-48 rounded-xl border border-border object-cover"
              />
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{quest.data.description}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {quest.data.platform ? <Badge variant="outline">{quest.data.platform}</Badge> : null}
              {quest.data.link ? <Badge variant="outline">Has task link</Badge> : null}
              <Badge variant="outline">Level {quest.data.minLevel}+</Badge>
              <Badge variant="outline">{quest.data.requiresProof ? "Proof required" : "No proof required"}</Badge>
            </div>

            {quest.data.proofInstructions ? (
              <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-sm font-medium">Proof instructions</p>
                <p className="mt-2 text-sm text-muted-foreground">{quest.data.proofInstructions}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reward values</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quest-points">Points reward</Label>
                <Input
                  id="edit-quest-points"
                  type="number"
                  min={1}
                  value={form.pointsReward}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, pointsReward: Number(event.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quest-xp">XP reward</Label>
                <Input
                  id="edit-quest-xp"
                  type="number"
                  min={1}
                  value={form.xpReward}
                  onChange={(event) => setForm((prev) => ({ ...prev, xpReward: Number(event.target.value) }))}
                />
              </div>

              <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-sm font-medium">Current configuration</p>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <p>Minimum level: {quest.data.minLevel}</p>
                  <p>Completion limit: {quest.data.maxCompletions}</p>
                  <p>Rejected proofs: {quest.data.stats.rejectedSubmissions}</p>
                </div>
              </div>

              <Button disabled={updateQuest.isPending}>
                {updateQuest.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Saving...
                  </span>
                ) : (
                  "Save rewards"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

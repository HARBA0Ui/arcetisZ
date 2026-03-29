"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCreateQuest, useQuests, useUploadQuestImage } from "@/backoffice/hooks/useAdmin";
import { getApiError } from "@/lib/api";
import { normalizeAssetUrl } from "@/lib/assets";

export default function BackofficeQuestsPage() {
  const quests = useQuests();
  const createQuest = useCreateQuest();
  const uploadQuestImage = useUploadQuestImage();
  const toast = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "DAILY" as "DAILY" | "SOCIAL" | "SPONSORED",
    platform: "",
    link: "",
    xpReward: 10,
    pointsReward: 20,
    minLevel: 1
  });
  const [createImage, setCreateImage] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState("");

  useEffect(() => {
    return () => {
      if (createPreview) {
        URL.revokeObjectURL(createPreview);
      }
    };
  }, [createPreview]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      let imageUrl = form.imageUrl.trim() || undefined;

      if (createImage) {
        imageUrl = await uploadQuestImage.mutateAsync(createImage);
      }

      await createQuest.mutateAsync({
        ...form,
        imageUrl,
        platform: form.platform || undefined,
        link: form.link || undefined
      });

      toast.success("Quest created", form.title);
      setForm({
        title: "",
        description: "",
        imageUrl: "",
        category: "DAILY",
        platform: "",
        link: "",
        xpReward: 10,
        pointsReward: 20,
        minLevel: 1
      });
      setCreateImage(null);
      if (createPreview) {
        URL.revokeObjectURL(createPreview);
      }
      setCreatePreview("");
    } catch (error) {
      toast.error("Quest create failed", getApiError(error));
    }
  };

  return (
    <div>
      <SectionHeader title="Quests" subtitle="Create tasks, review the live catalog, and open a detail page to update rewards." />
      {quests.isLoading ? <LoadingCard label="Loading quests..." /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Quest</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-quest-title">Task title</Label>
                <Input
                  id="create-quest-title"
                  placeholder="Follow Arcetis on Instagram, daily check-in..."
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-quest-description">Task description</Label>
                <Textarea
                  id="create-quest-description"
                  placeholder="Explain what the member should do and what counts as a completed task."
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-quest-category">Category</Label>
                  <Select
                    id="create-quest-category"
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        category: event.target.value as "DAILY" | "SOCIAL" | "SPONSORED"
                      }))
                    }
                  >
                    <option value="DAILY">DAILY</option>
                    <option value="SOCIAL">SOCIAL</option>
                    <option value="SPONSORED">SPONSORED</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-quest-platform">Platform</Label>
                  <Input
                    id="create-quest-platform"
                    placeholder="Instagram, website, Discord..."
                    value={form.platform}
                    onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-quest-link">Task link</Label>
                  <Input
                    id="create-quest-link"
                    placeholder="https://task-link.com"
                    value={form.link}
                    onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-quest-level">Minimum level</Label>
                  <Input
                    id="create-quest-level"
                    type="number"
                    min={1}
                    value={form.minLevel}
                    onChange={(event) => setForm((prev) => ({ ...prev, minLevel: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-quest-xp">XP reward</Label>
                  <Input
                    id="create-quest-xp"
                    type="number"
                    min={1}
                    value={form.xpReward}
                    onChange={(event) => setForm((prev) => ({ ...prev, xpReward: Number(event.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-quest-points">Points reward</Label>
                  <Input
                    id="create-quest-points"
                    type="number"
                    min={1}
                    value={form.pointsReward}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, pointsReward: Number(event.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-quest-image-url">External image URL</Label>
                <Input
                  id="create-quest-image-url"
                  placeholder="https://image-link.com/task.png"
                  value={form.imageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-quest-image-file">Upload image</Label>
                <Input
                  id="create-quest-image-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setCreateImage(file);
                    if (createPreview) {
                      URL.revokeObjectURL(createPreview);
                    }
                    setCreatePreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                {createPreview ? (
                  <img
                    src={createPreview}
                    alt="Quest preview"
                    className="h-24 w-24 rounded-md border border-border object-cover"
                  />
                ) : null}
              </div>

              <Button className="w-full" disabled={createQuest.isPending || uploadQuestImage.isPending}>
                {createQuest.isPending || uploadQuestImage.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Creating...
                  </span>
                ) : (
                  "Create Quest"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quest Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quest</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(quests.data ?? []).map((quest) => (
                  <TableRow key={quest.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {quest.imageUrl ? (
                          <img
                            src={normalizeAssetUrl(quest.imageUrl)}
                            alt={quest.title}
                            className="h-8 w-8 rounded-md border border-border object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md border border-border bg-muted" />
                        )}
                        <span>{quest.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{quest.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {quest.pointsReward} pts / {quest.xpReward} XP
                    </TableCell>
                    <TableCell>{quest.minLevel}+</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/backoffice/dashboard/quests/${quest.id}`}>
                          View details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import {
  useAdminRewardDetails,
  useDeleteReward,
  useUpdateReward,
  useUploadRewardImage
} from "@/backoffice/hooks/useAdmin";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiError } from "@/lib/api";
import { normalizeAssetUrl } from "@/lib/assets";
import { formatNumber } from "@/lib/format";
import { getRewardStartingPointsCost, getRewardStartingTndPrice } from "@/lib/reward-options";
import type { RewardDeliveryField, RewardPlan } from "@/lib/types";

type EditablePlan = RewardPlan;
type EditableField = RewardDeliveryField;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function createPlan(seed = 1): EditablePlan {
  return { id: `plan_${seed}`, label: "", pointsCost: 1000, tndPrice: undefined };
}

function createField(seed = 1): EditableField {
  return { id: `field_${seed}`, label: "", placeholder: "", required: true, type: "TEXT", retention: "persistent" };
}

function cleanPlans(plans: EditablePlan[]) {
  return plans
    .filter((plan) => plan.label.trim())
    .map((plan, index) => ({
      id: slugify(plan.id || plan.label) || `plan_${index + 1}`,
      label: plan.label.trim(),
      pointsCost: Number(plan.pointsCost),
      ...(typeof plan.tndPrice === "number" && Number.isFinite(plan.tndPrice) ? { tndPrice: Number(plan.tndPrice) } : {})
    }));
}

function cleanFields(fields: EditableField[]) {
  return fields
    .filter((field) => field.label.trim())
    .map((field, index) => ({
      id: slugify(field.id || field.label) || `field_${index + 1}`,
      label: field.label.trim(),
      placeholder: field.placeholder?.trim() || undefined,
      required: field.required ?? true,
      type: field.type ?? "TEXT",
      retention: field.retention ?? (field.type === "SECRET" ? "until_processed" : "persistent")
    }));
}

export default function BackofficeProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const toast = useToast();
  const rewardId = params?.id;
  const reward = useAdminRewardDetails(rewardId);
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();
  const uploadRewardImage = useUploadRewardImage();

  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsCost: 0,
    tndPrice: 0,
    minLevel: 1,
    minAccountAge: 0,
    stock: 0,
    imageUrl: ""
  });
  const [plans, setPlans] = useState<EditablePlan[]>([]);
  const [deliveryFields, setDeliveryFields] = useState<EditableField[]>([]);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState("");

  useEffect(() => {
    if (!reward.data) {
      return;
    }

    setForm({
      title: reward.data.title,
      description: reward.data.description,
      pointsCost: reward.data.pointsCost,
      tndPrice: reward.data.tndPrice ?? 0,
      minLevel: reward.data.minLevel,
      minAccountAge: reward.data.minAccountAge,
      stock: reward.data.stock,
      imageUrl: reward.data.imageUrl ?? ""
    });
    setPlans(reward.data.plans?.length ? reward.data.plans : [createPlan(1)]);
    setDeliveryFields(reward.data.deliveryFields ?? []);
  }, [reward.data]);

  useEffect(() => {
    return () => {
      if (editPreview) {
        URL.revokeObjectURL(editPreview);
      }
    };
  }, [editPreview]);

  const cleanedPlans = useMemo(() => cleanPlans(plans), [plans]);
  const cleanedFields = useMemo(() => cleanFields(deliveryFields), [deliveryFields]);

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rewardId) {
      return;
    }

    try {
      let imageUrl = form.imageUrl || undefined;

      if (editImage) {
        imageUrl = await uploadRewardImage.mutateAsync(editImage);
      }

      const effectivePointsCost = cleanedPlans.length ? Math.min(...cleanedPlans.map((plan) => plan.pointsCost)) : form.pointsCost;
      const tndValues = cleanedPlans.map((plan) => plan.tndPrice).filter((value): value is number => typeof value === "number");

      await updateReward.mutateAsync({
        id: rewardId,
        ...form,
        imageUrl,
        pointsCost: effectivePointsCost,
        tndPrice: tndValues.length ? Math.min(...tndValues) : form.tndPrice || undefined,
        plans: cleanedPlans.length ? cleanedPlans : undefined,
        deliveryFields: cleanedFields.length ? cleanedFields : undefined
      });

      toast.success("Product updated", form.title);
      setEditImage(null);
      if (editPreview) {
        URL.revokeObjectURL(editPreview);
      }
      setEditPreview("");
    } catch (error) {
      toast.error("Product update failed", getApiError(error));
    }
  }

  async function handleDelete() {
    if (!reward.data || !rewardId || !window.confirm(`Delete ${reward.data.title}?`)) {
      return;
    }

    try {
      await deleteReward.mutateAsync(rewardId);
      toast.success("Product deleted", reward.data.title);
      startNavigation("/backoffice/dashboard/products");
      router.replace("/backoffice/dashboard/products");
    } catch (error) {
      toast.error("Delete failed", getApiError(error));
    }
  }

  if (reward.isLoading && !reward.data) {
    return <LoadingCard label="Loading product details..." />;
  }

  if (!reward.data) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">This product could not be found.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title={reward.data.title}
        subtitle="Update plans, TND pricing, buyer info fields, and redemption settings for this product."
        right={
          <Button asChild variant="outline">
            <Link href="/backoffice/dashboard/products"><ArrowLeft className="mr-2 h-4 w-4" />Back to products</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total redemptions</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold tracking-tight">{reward.data.stats.totalRedemptions}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Pending reviews</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold tracking-tight">{reward.data.stats.pendingRedemptions}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Approved</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold tracking-tight">{reward.data.stats.approvedRedemptions}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader><CardTitle>Edit Product</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-product-title">Product name</Label>
                <Input id="edit-product-title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-product-description">Description</Label>
                <Textarea id="edit-product-description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-product-points">Fallback points cost</Label>
                  <Input id="edit-product-points" type="number" min={1} value={form.pointsCost} onChange={(event) => setForm((prev) => ({ ...prev, pointsCost: Number(event.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-tnd">Fallback TND price</Label>
                  <Input id="edit-product-tnd" type="number" min={0} step="0.01" value={form.tndPrice} onChange={(event) => setForm((prev) => ({ ...prev, tndPrice: Number(event.target.value) }))} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-product-stock">Stock</Label>
                  <Input id="edit-product-stock" type="number" min={0} value={form.stock} onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-level">Minimum level</Label>
                  <Input id="edit-product-level" type="number" min={1} value={form.minLevel} onChange={(event) => setForm((prev) => ({ ...prev, minLevel: Number(event.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-age">Minimum account age (days)</Label>
                  <Input id="edit-product-age" type="number" min={0} value={form.minAccountAge} onChange={(event) => setForm((prev) => ({ ...prev, minAccountAge: Number(event.target.value) }))} />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Service plans</p>
                    <p className="text-sm text-muted-foreground">Each plan can carry its own points value and TND price.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPlans((prev) => [...prev, createPlan(prev.length + 1)])}>
                    <Plus className="mr-2 h-4 w-4" /> Add plan
                  </Button>
                </div>
                <div className="space-y-3">
                  {plans.map((plan, index) => (
                    <div key={`${plan.id}-${index}`} className="grid gap-3 rounded-xl border border-border/70 bg-background/60 p-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
                      <Input placeholder="Plan label" value={plan.label} onChange={(event) => setPlans((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value, id: slugify(event.target.value) || item.id } : item))} />
                      <Input type="number" min={1} placeholder="Points" value={plan.pointsCost} onChange={(event) => setPlans((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, pointsCost: Number(event.target.value) } : item))} />
                      <Input type="number" min={0} step="0.01" placeholder="TND" value={plan.tndPrice ?? ""} onChange={(event) => setPlans((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, tndPrice: event.target.value ? Number(event.target.value) : undefined } : item))} />
                      <Button type="button" variant="outline" className="h-10 w-10 p-0" onClick={() => setPlans((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Information needed</p>
                    <p className="text-sm text-muted-foreground">Collect the account details or identifiers required for delivery, then decide if they should be purged after review.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDeliveryFields((prev) => [...prev, createField(prev.length + 1)])}><Plus className="mr-2 h-4 w-4" /> Add field</Button>
                </div>
                <div className="space-y-3">
                  {deliveryFields.map((field, index) => (
                    <div key={`${field.id}-${index}`} className="grid gap-3 rounded-xl border border-border/70 bg-background/60 p-3 md:grid-cols-[1fr_1fr_0.9fr_0.9fr_auto_auto]">
                      <Input placeholder="Label" value={field.label} onChange={(event) => setDeliveryFields((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value, id: slugify(event.target.value) || item.id } : item))} />
                      <Input placeholder="Placeholder" value={field.placeholder ?? ""} onChange={(event) => setDeliveryFields((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, placeholder: event.target.value } : item))} />
                      <Select
                        value={field.type ?? "TEXT"}
                        onChange={(event) =>
                          setDeliveryFields((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    type: event.target.value as EditableField["type"],
                                    retention:
                                      event.target.value === "SECRET" && item.retention !== "until_processed"
                                        ? "until_processed"
                                        : item.retention ?? "persistent"
                                  }
                                : item
                            )
                          )
                        }
                      >
                        <option value="TEXT">Text</option>
                        <option value="EMAIL">Email</option>
                        <option value="USERNAME">Username</option>
                        <option value="GAME_ID">Game ID</option>
                        <option value="SECRET">Secret</option>
                        <option value="LINK">Link</option>
                      </Select>
                      <Select
                        value={field.retention ?? "persistent"}
                        onChange={(event) =>
                          setDeliveryFields((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    retention: event.target.value as EditableField["retention"]
                                  }
                                : item
                            )
                          )
                        }
                      >
                        <option value="persistent">Keep after review</option>
                        <option value="until_processed">Purge after review</option>
                      </Select>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={field.required ?? true} onChange={(event) => setDeliveryFields((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, required: event.target.checked } : item))} />Required</label>
                      <Button type="button" variant="outline" className="h-10 w-10 p-0" onClick={() => setDeliveryFields((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button disabled={updateReward.isPending || uploadRewardImage.isPending}>{updateReward.isPending || uploadRewardImage.isPending ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Saving...</span> : "Save changes"}</Button>
                <Button type="button" variant="outline" className="gap-2" disabled={deleteReward.isPending} onClick={handleDelete}>{deleteReward.isPending ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}Delete product</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Image and access</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product-image">Replace image</Label>
              <Input id="edit-product-image" type="file" accept="image/*" onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setEditImage(file);
                if (editPreview) {
                  URL.revokeObjectURL(editPreview);
                }
                setEditPreview(file ? URL.createObjectURL(file) : "");
              }} />
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">From {formatNumber(getRewardStartingPointsCost(reward.data))} pts</Badge>
                {typeof getRewardStartingTndPrice(reward.data) === "number" ? <Badge variant="outline">From {formatNumber(getRewardStartingTndPrice(reward.data) ?? 0, { maximumFractionDigits: 2 })} TND</Badge> : null}
              <Badge variant="outline">Level {reward.data.minLevel}+</Badge>
              <Badge variant="outline">{reward.data.minAccountAge} day age</Badge>
              <Badge variant="outline">Stock {reward.data.stock}</Badge>
            </div>

            {reward.data.imageUrl ? <img src={normalizeAssetUrl(reward.data.imageUrl)} alt={reward.data.title} className="h-40 w-40 rounded-xl border border-border object-cover" /> : <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No image</div>}
            {editPreview ? <img src={editPreview} alt="Updated preview" className="h-40 w-40 rounded-xl border border-border object-cover" /> : null}

            <div className="rounded-xl border border-border/70 bg-background/60 p-4 text-sm">
              <p className="font-medium">Configured delivery fields</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {reward.data.deliveryFields?.length ? reward.data.deliveryFields.map((field) => <Badge key={field.id} variant="outline">{field.label} · {(field.type ?? "TEXT").toLowerCase()} · {field.retention === "until_processed" ? "purge" : "keep"}</Badge>) : <span className="text-muted-foreground">No custom fields yet.</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


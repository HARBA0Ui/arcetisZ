"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { useCreateReward, useUploadRewardImage } from "@/backoffice/hooks/useAdmin";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiError } from "@/lib/api";
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
  return {
    id: `plan_${seed}`,
    label: "",
    pointsCost: 1000,
    tndPrice: undefined
  };
}

function createField(seed = 1): EditableField {
  return {
    id: `field_${seed}`,
    label: "",
    placeholder: "",
    required: true,
    type: "TEXT",
    retention: "persistent"
  };
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

export default function BackofficeCreateProductPage() {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const createReward = useCreateReward();
  const uploadRewardImage = useUploadRewardImage();
  const toast = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsCost: 1000,
    tndPrice: 0,
    minLevel: 1,
    minAccountAge: 0,
    stock: 10
  });
  const [plans, setPlans] = useState<EditablePlan[]>([createPlan(1)]);
  const [deliveryFields, setDeliveryFields] = useState<EditableField[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const cleanedPlans = useMemo(() => cleanPlans(plans), [plans]);
  const cleanedFields = useMemo(() => cleanFields(deliveryFields), [deliveryFields]);

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await uploadRewardImage.mutateAsync(imageFile);
      }

      const effectivePointsCost = cleanedPlans.length
        ? Math.min(...cleanedPlans.map((plan) => plan.pointsCost))
        : form.pointsCost;
      const tndValues = cleanedPlans
        .map((plan) => plan.tndPrice)
        .filter((value): value is number => typeof value === "number");

      const created = await createReward.mutateAsync({
        ...form,
        pointsCost: effectivePointsCost,
        tndPrice: tndValues.length ? Math.min(...tndValues) : form.tndPrice || undefined,
        plans: cleanedPlans.length ? cleanedPlans : undefined,
        deliveryFields: cleanedFields.length ? cleanedFields : undefined,
        imageUrl
      });

      toast.success("Product created", form.title);

      const nextPath = created.reward?.id
        ? `/backoffice/dashboard/products/${created.reward.id}`
        : "/backoffice/dashboard/products";

      startNavigation(nextPath);
      router.replace(nextPath);
    } catch (error) {
      toast.error("Product create failed", getApiError(error));
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Create Product"
        subtitle="Add a new product with plans, TND pricing, stock, and the exact delivery info buyers must provide."
        right={
          <Button asChild variant="outline">
            <Link href="/backoffice/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to products
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>New product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="create-product-title">Product name</Label>
              <Input
                id="create-product-title"
                placeholder="ChatGPT Plus, Free Fire top-up, Canva invite..."
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-product-description">Description</Label>
              <Textarea
                id="create-product-description"
                placeholder="What members receive and how delivery works"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-product-cost">Fallback points cost</Label>
                <Input
                  id="create-product-cost"
                  type="number"
                  min={1}
                  value={form.pointsCost}
                  onChange={(event) => setForm((prev) => ({ ...prev, pointsCost: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-product-tnd">Fallback TND price</Label>
                <Input
                  id="create-product-tnd"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.tndPrice}
                  onChange={(event) => setForm((prev) => ({ ...prev, tndPrice: Number(event.target.value) }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="create-product-stock">Stock</Label>
                <Input
                  id="create-product-stock"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-product-level">Minimum level</Label>
                <Input
                  id="create-product-level"
                  type="number"
                  min={1}
                  value={form.minLevel}
                  onChange={(event) => setForm((prev) => ({ ...prev, minLevel: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-product-age">Minimum account age (days)</Label>
                <Input
                  id="create-product-age"
                  type="number"
                  min={0}
                  value={form.minAccountAge}
                  onChange={(event) => setForm((prev) => ({ ...prev, minAccountAge: Number(event.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Service plans</p>
                  <p className="text-sm text-muted-foreground">
                    Add versions like 1 month, 12 months, or manual processing.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPlans((prev) => [...prev, createPlan(prev.length + 1)])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add plan
                </Button>
              </div>
              <div className="space-y-3">
                {plans.map((plan, index) => (
                  <div
                    key={`${plan.id}-${index}`}
                    className="grid gap-3 rounded-xl border border-border/70 bg-background/60 p-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
                  >
                    <Input
                      placeholder="Plan label"
                      value={plan.label}
                      onChange={(event) =>
                        setPlans((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, label: event.target.value, id: slugify(event.target.value) || item.id }
                              : item
                          )
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Points"
                      value={plan.pointsCost}
                      onChange={(event) =>
                        setPlans((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, pointsCost: Number(event.target.value) } : item
                          )
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="TND"
                      value={plan.tndPrice ?? ""}
                      onChange={(event) =>
                        setPlans((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, tndPrice: event.target.value ? Number(event.target.value) : undefined }
                              : item
                          )
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-10 p-0"
                      onClick={() => setPlans((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Information needed</p>
                  <p className="text-sm text-muted-foreground">
                    Ask for email, game ID, password, or any delivery field the order needs.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeliveryFields((prev) => [...prev, createField(prev.length + 1)])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add field
                </Button>
              </div>
              <div className="space-y-3">
                {deliveryFields.map((field, index) => (
                  <div
                    key={`${field.id}-${index}`}
                    className="grid gap-3 rounded-xl border border-border/70 bg-background/60 p-3 md:grid-cols-[1fr_1fr_0.9fr_0.9fr_auto_auto]"
                  >
                    <Input
                      placeholder="Label"
                      value={field.label}
                      onChange={(event) =>
                        setDeliveryFields((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, label: event.target.value, id: slugify(event.target.value) || item.id }
                              : item
                          )
                        )
                      }
                    />
                    <Input
                      placeholder="Placeholder"
                      value={field.placeholder ?? ""}
                      onChange={(event) =>
                        setDeliveryFields((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, placeholder: event.target.value } : item
                          )
                        )
                      }
                    />
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
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.required ?? true}
                        onChange={(event) =>
                          setDeliveryFields((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, required: event.target.checked } : item
                            )
                          )
                        }
                      />
                      Required
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-10 p-0"
                      onClick={() =>
                        setDeliveryFields((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-product-image">Product image</Label>
              <Input
                id="create-product-image"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setImageFile(nextFile);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
                }}
              />
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Create preview"
                  className="h-24 w-24 rounded-md border border-border object-cover"
                />
              ) : null}
            </div>

            <Button className="w-full" disabled={createReward.isPending || uploadRewardImage.isPending}>
              {createReward.isPending || uploadRewardImage.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Creating...
                </span>
              ) : (
                "Create Product"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

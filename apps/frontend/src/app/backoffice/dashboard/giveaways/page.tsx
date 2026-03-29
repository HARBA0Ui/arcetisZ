"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, ImagePlus, Plus, Search, Trash2, Trophy } from "lucide-react";
import { PaginationControls } from "@/backoffice/components/backoffice/pagination-controls";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import {
  useAdminGiveaways,
  useCreateGiveaway,
  useUploadGiveawayImage
} from "@/backoffice/hooks/useAdmin";
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
import { normalizeAssetUrl } from "@/lib/assets";
import { getApiError } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import type { GiveawayField } from "@/lib/types";

type EditableField = GiveawayField;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function createField(seed = 1): EditableField {
  return {
    id: `field_${seed}`,
    label: "",
    placeholder: "",
    required: true,
    type: "TEXT"
  };
}

function cleanFields(fields: EditableField[]) {
  return fields
    .filter((field) => field.label.trim())
    .map((field, index) => ({
      id: slugify(field.id || field.label) || `field_${index + 1}`,
      label: field.label.trim(),
      placeholder: field.placeholder?.trim() || undefined,
      required: field.required ?? true,
      type: field.type ?? "TEXT"
    }));
}

export default function BackofficeGiveawaysPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    prizeSummary: "",
    imageUrl: "",
    durationDays: 7,
    winnerCount: 1,
    minLevel: 1,
    minAccountAge: 0,
    allowEntryEdits: false,
    requiresJustification: false,
    justificationLabel: "Upload 1 to 3 screenshots that support your entry"
  });
  const [fields, setFields] = useState<EditableField[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(true);
  const giveaways = useAdminGiveaways({
    q: query || undefined,
    page,
    pageSize: 10
  });
  const createGiveaway = useCreateGiveaway();
  const uploadGiveawayImage = useUploadGiveawayImage();
  const toast = useToast();
  const cleanedFields = useMemo(() => cleanFields(fields), [fields]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      let imageUrl = form.imageUrl.trim() || undefined;

      if (imageFile) {
        imageUrl = await uploadGiveawayImage.mutateAsync(imageFile);
      }

      await createGiveaway.mutateAsync({
        title: form.title,
        description: form.description,
        prizeSummary: form.prizeSummary || undefined,
        imageUrl,
        durationDays: form.durationDays,
        winnerCount: form.winnerCount,
        minLevel: form.minLevel,
        minAccountAge: form.minAccountAge,
        allowEntryEdits: form.allowEntryEdits,
        requiresJustification: form.requiresJustification,
        justificationLabel: form.requiresJustification ? form.justificationLabel : undefined,
        inputFields: cleanedFields.length ? cleanedFields : undefined
      });

      toast.success("Giveaway created", form.title);
      setForm({
        title: "",
        description: "",
        prizeSummary: "",
        imageUrl: "",
        durationDays: 7,
        winnerCount: 1,
        minLevel: 1,
        minAccountAge: 0,
        allowEntryEdits: false,
        requiresJustification: false,
        justificationLabel: "Upload 1 to 3 screenshots that support your entry"
      });
      setFields([]);
      setImageFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
      setPage(1);
    } catch (error) {
      toast.error("Create giveaway failed", getApiError(error));
    }
  }

  const posterPreview = previewUrl || form.imageUrl.trim();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Giveaways"
        subtitle="Launch one clean live giveaway at a time, add a poster if needed, and keep proof requirements simple for members."
        right={
          <Button variant="outline" onClick={() => setIsCreateOpen((current) => !current)}>
            {isCreateOpen ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Collapse create form
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Open create form
              </>
            )}
          </Button>
        }
      />

      {giveaways.isLoading && !giveaways.data ? <LoadingCard label="Loading giveaways..." /> : null}

      {isCreateOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>Create giveaway</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitCreate} className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="giveaway-title">Giveaway title</Label>
                  <Input
                    id="giveaway-title"
                    placeholder="PlayStation voucher drop, premium account giveaway..."
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="giveaway-description">Description</Label>
                  <Textarea
                    id="giveaway-description"
                    placeholder="Explain the prize, who should apply, and what makes a strong entry."
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="giveaway-prize">Prize summary</Label>
                    <Input
                      id="giveaway-prize"
                      placeholder="1 winner, 50 DT voucher"
                      value={form.prizeSummary}
                      onChange={(event) => setForm((prev) => ({ ...prev, prizeSummary: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="giveaway-poster-url">Poster image URL</Label>
                    <Input
                      id="giveaway-poster-url"
                      placeholder="https://... or /uploads/..."
                      value={form.imageUrl}
                      onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="giveaway-duration">Duration</Label>
                    <div className="relative">
                      <Input
                        id="giveaway-duration"
                        type="number"
                        min={1}
                        max={365}
                        value={form.durationDays}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            durationDays: Math.max(1, Math.min(365, Number(event.target.value) || 1))
                          }))
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        days
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="giveaway-winner-count">Winner slots</Label>
                    <Input
                      id="giveaway-winner-count"
                      type="number"
                      min={1}
                      max={100}
                      value={form.winnerCount}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          winnerCount: Math.max(1, Math.min(100, Number(event.target.value) || 1))
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="giveaway-min-level">Minimum level</Label>
                    <Input
                      id="giveaway-min-level"
                      type="number"
                      min={1}
                      max={100}
                      value={form.minLevel}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          minLevel: Math.max(1, Math.min(100, Number(event.target.value) || 1))
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="giveaway-min-account-age">Minimum account age</Label>
                    <div className="relative">
                      <Input
                        id="giveaway-min-account-age"
                        type="number"
                        min={0}
                        max={3650}
                        value={form.minAccountAge}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            minAccountAge: Math.max(0, Math.min(3650, Number(event.target.value) || 0))
                          }))
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
                    <p className="text-sm font-medium text-foreground">Optional poster</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add a poster image to make the current giveaway easier to notice on the frontoffice.
                    </p>
                    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/55 px-4 py-3 text-sm text-muted-foreground hover:border-[hsl(var(--arcetis-ember))]/40 hover:text-foreground">
                      <ImagePlus className="h-4 w-4" />
                      <span>{imageFile ? imageFile.name : "Upload poster image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setImageFile(file);

                          if (previewUrl) {
                            URL.revokeObjectURL(previewUrl);
                          }

                          setPreviewUrl(file ? URL.createObjectURL(file) : "");
                        }}
                      />
                    </label>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/55">
                    {posterPreview ? (
                      <img
                        src={normalizeAssetUrl(posterPreview)}
                        alt="Giveaway poster preview"
                        className="aspect-[16/9] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-background/60 p-4 text-center text-sm text-muted-foreground">
                        Poster preview will show here.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/45 p-4 text-sm">
                      <input
                        type="checkbox"
                        checked={form.allowEntryEdits}
                        onChange={(event) => setForm((prev) => ({ ...prev, allowEntryEdits: event.target.checked }))}
                      />
                      <span>
                        <span className="block font-medium text-foreground">Allow entry edits</span>
                        <span className="mt-1 block text-muted-foreground">
                          Members can update a pending entry until the giveaway closes.
                        </span>
                      </span>
                    </label>

                    <div className="rounded-2xl border border-border/70 bg-background/45 p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Closing logic</p>
                      <p className="mt-1">
                        This giveaway closes automatically when the duration ends or when all winner slots are filled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">Optional extra fields</p>
                    <p className="text-sm text-muted-foreground">
                      Ask for game ID, account email, username, or anything the giveaway actually needs.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Keep this minimal. Too many required fields will reduce entries. Max 8 custom fields.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFields((prev) => [...prev, createField(prev.length + 1)])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add field
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.length ? (
                    fields.map((field, index) => (
                      <div
                        key={`${field.id}-${index}`}
                        className="grid gap-3 rounded-xl border border-border/70 bg-background/60 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_100px_44px]"
                      >
                        <Input
                          placeholder="Field label"
                          value={field.label}
                          onChange={(event) =>
                            setFields((prev) =>
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
                            setFields((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, placeholder: event.target.value } : item
                              )
                            )
                          }
                        />
                        <Select
                          value={field.type ?? "TEXT"}
                          onChange={(event) =>
                            setFields((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, type: event.target.value as EditableField["type"] } : item
                              )
                            )
                          }
                        >
                          <option value="TEXT">Text</option>
                          <option value="EMAIL">Email</option>
                          <option value="USERNAME">Username</option>
                          <option value="GAME_ID">Game ID</option>
                          <option value="LINK">Link</option>
                        </Select>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={field.required ?? true}
                            onChange={(event) =>
                              setFields((prev) =>
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
                          onClick={() => setFields((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                      No custom fields yet. Add them only if this giveaway needs extra user info.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                <div className="flex items-center gap-2">
                  <input
                    id="giveaway-justification-required"
                    type="checkbox"
                    checked={form.requiresJustification}
                    onChange={(event) => setForm((prev) => ({ ...prev, requiresJustification: event.target.checked }))}
                  />
                  <Label htmlFor="giveaway-justification-required">Require proof images</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  If enabled, members must upload between 1 and 3 images before they can submit the giveaway entry.
                </p>
                {form.requiresJustification ? (
                  <div className="space-y-2">
                    <Label htmlFor="giveaway-justification-label">Proof instruction label</Label>
                    <Input
                      id="giveaway-justification-label"
                      value={form.justificationLabel}
                      onChange={(event) => setForm((prev) => ({ ...prev, justificationLabel: event.target.value }))}
                      placeholder="Upload 1 to 3 screenshots that support your entry"
                    />
                  </div>
                ) : null}
              </div>

              <Button className="w-full" disabled={createGiveaway.isPending || uploadGiveawayImage.isPending}>
                {createGiveaway.isPending || uploadGiveawayImage.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Creating...
                  </span>
                ) : (
                  "Create giveaway"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {giveaways.data ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Giveaway catalog</CardTitle>
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                  placeholder="Search giveaways"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giveaway</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Closes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giveaways.data.items.map((giveaway) => (
                  <TableRow key={giveaway.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {giveaway.imageUrl ? (
                          <img
                            src={normalizeAssetUrl(giveaway.imageUrl)}
                            alt={giveaway.title}
                            className="h-12 w-12 rounded-xl border border-border/70 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
                            <Trophy className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{giveaway.title}</div>
                          <div className="text-xs text-muted-foreground">{giveaway.prizeSummary || "No prize summary"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={giveaway.status === "ACTIVE" ? "secondary" : "outline"}>{giveaway.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{formatNumber(giveaway.entryCount ?? 0)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(giveaway.selectedCount ?? 0)} / {formatNumber(giveaway.winnerCount ?? 1)} selected
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(giveaway.endsAt)}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/backoffice/dashboard/giveaways/${giveaway.id}`}>
                          Open details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <PaginationControls
              page={giveaways.data.page}
              totalPages={giveaways.data.totalPages}
              total={giveaways.data.total}
              itemLabel="giveaway"
              onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
              onNext={() => setPage((current) => Math.min(current + 1, giveaways.data.totalPages))}
            />
          </CardContent>
        </Card>
      ) : giveaways.isLoading ? null : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Giveaways are not available right now.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

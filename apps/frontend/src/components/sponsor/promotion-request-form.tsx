"use client";

import { FormEvent, useEffect, useState } from "react";
import { Clock3, Megaphone, Sparkles } from "lucide-react";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/useAuth";
import { useCreateSponsorRequest } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { isOtherSponsorCategory, sponsorCategoryOptions } from "@/lib/sponsor-requests";
import type { SponsorRequestCategory } from "@/lib/types";

type PromotionRequestFormProps = {
  submitLabel?: string;
  onSubmitted?: () => void;
};

type PromotionRequestFormState = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  category: SponsorRequestCategory;
  title: string;
  description: string;
  otherReason: string;
  platform: string;
  landingUrl: string;
  proofRequirements: string;
  maxCompletions: number;
};

const categoryCopy = {
  SOCIAL_MEDIA: {
    label: "Social Media",
    description: "Instagram, TikTok, X, YouTube, and short-form promotion."
  },
  PRODUCT_PROMOTION: {
    label: "Website / Product",
    description: "Landing pages, products, tools, and direct traffic campaigns."
  },
  COMMUNITY: {
    label: "Community",
    description: "Discords, Telegram groups, forums, or member communities."
  },
  EVENT_CAMPAIGN: {
    label: "Event",
    description: "Launches, activations, tournaments, and limited-time campaigns."
  },
  CONTENT_CREATOR: {
    label: "Other",
    description: "Anything outside the main buckets, with a short reason."
  }
} as const;

const participantOptions = [25, 50, 100, 250, 500, 1000];

export function PromotionRequestForm({ submitLabel, onSubmitted }: PromotionRequestFormProps) {
  const me = useMe();
  const createSponsorRequest = useCreateSponsorRequest();
  const toast = useToast();
  const [form, setForm] = useState<PromotionRequestFormState>({
    companyName: "",
    contactName: "",
    contactEmail: "",
    category: "SOCIAL_MEDIA",
    title: "",
    description: "",
    otherReason: "",
    platform: "",
    landingUrl: "",
    proofRequirements: "",
    maxCompletions: participantOptions[0]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const isOther = isOtherSponsorCategory(form.category);
  const resolvedSubmitLabel = submitLabel ?? "Send for review";

  useEffect(() => {
    if (!me.data?.email || form.contactEmail) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      contactEmail: me.data?.email ?? ""
    }));
  }, [form.contactEmail, me.data?.email]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createSponsorRequest.mutateAsync({
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        imageFile: imageFile ?? undefined,
        otherReason: isOther ? form.otherReason.trim() : undefined,
        platform: form.platform.trim() || undefined,
        landingUrl: form.landingUrl.trim() || undefined,
        proofRequirements: form.proofRequirements.trim() || undefined,
        requestedXpReward: 30,
        requestedPointsReward: 50,
        maxCompletions: form.maxCompletions,
        minLevel: 1
      });

      toast.success(
        "Campaign request sent",
        "We will review it, reach out to confirm scope and pricing, and then publish it if approved."
      );
      setForm({
        companyName: "",
        contactName: "",
        contactEmail: me.data?.email ?? "",
        category: "SOCIAL_MEDIA",
        title: "",
        description: "",
        otherReason: "",
        platform: "",
        landingUrl: "",
        proofRequirements: "",
        maxCompletions: participantOptions[0]
      });
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview("");
      onSubmitted?.();
    } catch (error) {
      toast.error("Request failed", getApiError(error));
    }
  }

  const selectedCategory = categoryCopy[form.category];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-[1.2rem] border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Clock3 className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
            Review time
          </div>
          <p className="mt-2">Usually about 2 days before we reply with the next step.</p>
        </div>
        <div className="rounded-[1.2rem] border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Megaphone className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
            Scope first
          </div>
          <p className="mt-2">We review the goal, audience, and proof flow before anything goes live.</p>
        </div>
        <div className="rounded-[1.2rem] border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
            Pricing confirmation
          </div>
          <p className="mt-2">Pricing is confirmed with you after review, then the task is published if approved.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="promotion-company-name">Brand / Project</Label>
          <Input
            id="promotion-company-name"
            value={form.companyName}
            onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
            placeholder="Your brand or project name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-contact-name">Contact name</Label>
          <Input
            id="promotion-contact-name"
            value={form.contactName}
            onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
            placeholder="Who should we speak with?"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-contact-email">Contact email</Label>
          <Input
            id="promotion-contact-email"
            type="email"
            value={form.contactEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
            placeholder="brand@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-category">Campaign type</Label>
          <Select
            id="promotion-category"
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                category: event.target.value as SponsorRequestCategory
              }))
            }
          >
            {sponsorCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {categoryCopy[option.value].label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>
        </div>

        {isOther ? (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="promotion-other-reason">Why does this fit Other?</Label>
            <Textarea
              id="promotion-other-reason"
              rows={2}
              value={form.otherReason}
              onChange={(event) => setForm((prev) => ({ ...prev, otherReason: event.target.value }))}
              placeholder="Tell us why this request does not fit the main campaign types."
              required
            />
          </div>
        ) : null}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="promotion-title">Campaign title</Label>
          <Input
            id="promotion-title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder={`Launch ${categoryCopy[form.category].label.toLowerCase()} campaign`}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="promotion-description">What do you want members to do?</Label>
          <Textarea
            id="promotion-description"
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Explain the offer, target audience, expected action, and why it fits Arcetis."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-platform">Platform / destination</Label>
          <Input
            id="promotion-platform"
            value={form.platform}
            onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value }))}
            placeholder="Instagram, website, Discord, app..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-link">Link</Label>
          <Input
            id="promotion-link"
            type="url"
            value={form.landingUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, landingUrl: event.target.value }))}
            placeholder="https://your-link.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-max-completions">How many members should complete this?</Label>
          <Select
            id="promotion-max-completions"
            value={String(form.maxCompletions)}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                maxCompletions: Number(event.target.value)
              }))
            }
          >
            {participantOptions.map((value) => (
              <option key={value} value={value}>
                {formatNumber(value)} people
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">Choose a clear target so we can size the campaign properly.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-proof-requirements">Proof requirements</Label>
          <Textarea
            id="promotion-proof-requirements"
            rows={3}
            value={form.proofRequirements}
            onChange={(event) => setForm((prev) => ({ ...prev, proofRequirements: event.target.value }))}
            placeholder="Example: screenshot of the follow, joined community, post, or checkout page."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="promotion-image">Campaign image (optional)</Label>
          <Input
            id="promotion-image"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setImageFile(file);
              if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
              }
              setImagePreview(file ? URL.createObjectURL(file) : "");
            }}
          />
          <p className="text-xs text-muted-foreground">Add product art, campaign artwork, or a logo to make the request clearer.</p>
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Campaign preview"
              className="h-24 w-24 rounded-xl border border-border object-cover"
            />
          ) : null}
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Megaphone className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
          What happens next
        </div>
        <p className="mt-2">
          We review the request, reach out to confirm scope and pricing, then publish it as a clean Arcetis task if approved.
        </p>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={createSponsorRequest.isPending}>
        {createSponsorRequest.isPending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            Sending...
          </span>
        ) : (
          resolvedSubmitLabel
        )}
      </Button>
    </form>
  );
}


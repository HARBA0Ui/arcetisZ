import type { SponsorRequestCategory } from "@/lib/types";

export const sponsorCategoryOptions: Array<{
  value: SponsorRequestCategory;
  label: string;
  description: string;
}> = [
  {
    value: "SOCIAL_MEDIA",
    label: "Social Media",
    description: "Instagram, TikTok, X, YouTube, and short-form promotion."
  },
  {
    value: "PRODUCT_PROMOTION",
    label: "Website",
    description: "Landing pages, products, tools, and direct traffic campaigns."
  },
  {
    value: "COMMUNITY",
    label: "Community",
    description: "Discords, Telegram groups, forums, or member communities."
  },
  {
    value: "EVENT_CAMPAIGN",
    label: "Event",
    description: "Launches, activations, meetups, tournaments, or timed campaigns."
  },
  {
    value: "CONTENT_CREATOR",
    label: "Other",
    description: "Anything outside the main buckets, with a short reason."
  }
];

export function formatSponsorCategory(category: SponsorRequestCategory) {
  return sponsorCategoryOptions.find((option) => option.value === category)?.label ?? category;
}

export function isOtherSponsorCategory(category: SponsorRequestCategory) {
  return category === "CONTENT_CREATOR";
}

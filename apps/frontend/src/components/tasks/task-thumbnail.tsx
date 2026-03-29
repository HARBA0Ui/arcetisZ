"use client";

import { useState } from "react";
import type { QuestCategory } from "@/lib/types";
import { normalizeAssetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

const fallbackStyles: Record<QuestCategory, string> = {
  DAILY: "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.32),_transparent_55%),linear-gradient(135deg,_rgba(16,16,16,0.95),_rgba(62,62,62,0.85))]",
  SOCIAL: "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.28),_transparent_55%),linear-gradient(135deg,_rgba(10,10,10,0.96),_rgba(24,92,92,0.82))]",
  SPONSORED: "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.24),_transparent_55%),linear-gradient(135deg,_rgba(10,10,10,0.96),_rgba(110,74,26,0.84))]"
};

export function TaskThumbnail({
  title,
  category,
  imageUrl,
  className
}: {
  title: string;
  category: QuestCategory;
  imageUrl?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = !failed ? normalizeAssetUrl(imageUrl) : "";

  if (src) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border/70 bg-card", className)}>
        <img
          src={src}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end overflow-hidden rounded-xl border border-border/70 p-3 text-white shadow-sm",
        fallbackStyles[category],
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">{category}</p>
        <p className="mt-2 line-clamp-2 text-sm font-semibold">{title}</p>
      </div>
    </div>
  );
}

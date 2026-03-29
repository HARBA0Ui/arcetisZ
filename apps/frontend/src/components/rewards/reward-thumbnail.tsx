"use client";

import { useState } from "react";
import { normalizeAssetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

const fallbackStyles = [
  "bg-[radial-gradient(circle_at_24%_18%,_rgba(255,255,255,0.18),_transparent_28%),radial-gradient(circle_at_88%_88%,_rgba(255,122,24,0.22),_transparent_34%),linear-gradient(160deg,_rgba(12,12,12,0.98),_rgba(41,47,63,0.94))]",
  "bg-[radial-gradient(circle_at_18%_15%,_rgba(255,255,255,0.16),_transparent_30%),radial-gradient(circle_at_90%_92%,_rgba(255,122,24,0.18),_transparent_36%),linear-gradient(155deg,_rgba(10,10,10,0.98),_rgba(53,58,74,0.92))]",
  "bg-[radial-gradient(circle_at_20%_14%,_rgba(255,255,255,0.16),_transparent_28%),radial-gradient(circle_at_84%_90%,_rgba(255,122,24,0.2),_transparent_38%),linear-gradient(155deg,_rgba(11,11,11,0.98),_rgba(34,39,52,0.94))]"
];

function getFallbackStyle(title: string) {
  const seed = title.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
  return fallbackStyles[seed % fallbackStyles.length];
}

export function RewardThumbnail({
  title,
  imageUrl,
  className
}: {
  title: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = !failed ? normalizeAssetUrl(imageUrl) : "";

  if (src) {
    return (
      <div className={cn("overflow-hidden rounded-[1.25rem] border border-border/70 bg-card shadow-[0_16px_40px_-32px_rgba(0,0,0,0.45)]", className)}>
        <img
          src={src}
          alt={title}
          className="h-full w-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-end overflow-hidden rounded-[1.25rem] border border-border/70 p-4 text-white shadow-[0_16px_40px_-32px_rgba(0,0,0,0.55)]",
        getFallbackStyle(title),
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/72">Reward Snapshot</p>
        <p className="mt-2 line-clamp-3 text-lg font-semibold leading-tight tracking-tight">{title}</p>
      </div>
    </div>
  );
}

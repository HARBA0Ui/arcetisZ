"use client";

import { PrizeWheel } from "@mertercelik/react-prize-wheel";
import type { PrizeWheelRef, Sector } from "@mertercelik/react-prize-wheel";
import type { RefObject } from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { SpinItem } from "@/lib/types";

const WHEEL_COLORS: [string, string] = ["#180b05", "#5d2508"];

type PrizeWheelDisplayProps = {
  items: SpinItem[];
  prizeWheelRef?: RefObject<PrizeWheelRef | null>;
  onSpinStart?: () => void;
  onSpinEnd?: () => void;
  spinPhase?: "idle" | "requesting" | "spinning";
  size?: "default" | "compact";
  className?: string;
};

export function PrizeWheelDisplay({
  items,
  prizeWheelRef,
  onSpinStart,
  onSpinEnd,
  spinPhase = "idle",
  size = "default",
  className
}: PrizeWheelDisplayProps) {
  const wheelSectors = useMemo<Sector[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        label: item.label,
        text: item.label,
        probability: item.weight
      })),
    [items]
  );

  const canRenderWheel = wheelSectors.length >= 2 && wheelSectors.length <= 24;
  const isCompact = size === "compact";

  if (!canRenderWheel) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 text-center text-sm text-muted-foreground",
          isCompact ? "h-64 max-w-[19rem]" : "h-72 max-w-[23rem]",
          className
        )}
      >
        The wheel needs between 2 and 24 rewards before it can spin.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "arcetis-prize-wheel relative w-full",
        isCompact ? "max-w-[19rem]" : "max-w-[23rem]",
        className
      )}
      data-phase={spinPhase}
    >
      <div
        className={cn(
          "pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(255,129,56,0.3),transparent_66%)] blur-3xl",
          isCompact ? "inset-6" : "inset-8"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute rounded-full bg-white/10 blur-2xl dark:bg-white/5",
          isCompact ? "inset-x-10 top-2 h-16" : "inset-x-14 top-2 h-20"
        )}
      />
      <div
        className={cn(
          "relative rounded-[2rem] border border-border/70 bg-gradient-to-b from-white/6 to-transparent backdrop-blur-sm",
          isCompact ? "p-2.5" : "p-3"
        )}
      >
        <PrizeWheel
          ref={prizeWheelRef}
          sectors={wheelSectors}
          onSpinStart={onSpinStart}
          onSpinEnd={onSpinEnd}
          duration={4.8}
          minSpins={7}
          maxSpins={9}
          frameColor="#16110d"
          middleColor="#0e0a08"
          middleDotColor="#ffb067"
          winIndicatorColor="#f7efe7"
          winIndicatorDotColor="#ff8f3a"
          sticksColor="#f39a58"
          wheelColors={WHEEL_COLORS}
          borderColor="#f39a58"
          borderWidth={3}
          textColor="#fff7ef"
          textFontSize={isCompact ? 16 : 18}
          wheelShadowColor="#000"
          wheelShadowOpacity={0.3}
          middleShadowColor="#000"
          middleShadowOpacity={0.22}
          indicatorShadowColor="#000"
          indicatorShadowOpacity={0.28}
        />
      </div>
    </div>
  );
}

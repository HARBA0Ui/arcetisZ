"use client";

import { Coins, Crown, Gem, Gift, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpinItem } from "@/lib/types";

const wheelColors = ["#0f172a", "#1e293b", "#334155", "#0f766e", "#a16207", "#9a3412", "#14532d"];

const iconByName = {
  Sparkles,
  Coins,
  Star,
  Zap,
  Gem,
  Crown,
  Gift,
  ShieldCheck
} as const;

function polarToCartesian(angleInDegrees: number, radius: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: Math.cos(angleInRadians) * radius,
    y: Math.sin(angleInRadians) * radius
  };
}

function describeSegmentPath(startAngle: number, endAngle: number, radius: number) {
  const start = polarToCartesian(startAngle, radius);
  const end = polarToCartesian(endAngle, radius);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M 0 0`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

function splitLabel(label: string) {
  const words = label.trim().split(/\s+/);

  if (words.length <= 1) return [label];
  if (words.length === 2) return words;

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

type SpinWheelGraphicProps = {
  items: SpinItem[];
  rotation?: number;
  className?: string;
  compact?: boolean;
  durationMs?: number;
  timingFunction?: string;
};

export function SpinWheelGraphic({
  items,
  rotation = 0,
  className,
  compact = false,
  durationMs = 2200,
  timingFunction = "cubic-bezier(.2,.9,.2,1)"
}: SpinWheelGraphicProps) {
  const visibleItems = items.slice(0, 8);
  const segmentAngle = visibleItems.length ? 360 / visibleItems.length : 0;
  const densityScale = visibleItems.length >= 8 ? 1 : visibleItems.length >= 6 ? 1.08 : 1.16;
  const labelRadius = (compact ? 60 : 63) * densityScale;
  const iconSize = (compact ? 12.5 : 14) * densityScale;
  const iconOffsetY = compact ? -12 : -13.5;
  const textBaseY = compact ? 3.4 : 4.4;
  const fontSize = (compact ? 10.25 : 11.5) * densityScale;
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-x-8 border-b-[14px] border-x-transparent border-b-foreground" />

      <div
        className="arcetis-wheel h-full w-full will-change-transform transition-transform motion-reduce:transition-none"
        style={{
          transform: `rotate(${rotation}deg)`,
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: timingFunction
        }}
      >
        <svg viewBox="-100 -100 200 200" className="h-full w-full overflow-visible">
          {visibleItems.map((item, index) => {
            const startAngle = -90 + index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const middleAngle = startAngle + segmentAngle / 2;
            const labelPosition = polarToCartesian(middleAngle, labelRadius);
            const Icon = iconByName[item.icon as keyof typeof iconByName] ?? Gift;
            const lines = splitLabel(item.label);

            return (
              <g key={item.id}>
                <path d={describeSegmentPath(startAngle, endAngle, 96)} fill={wheelColors[index % wheelColors.length]} />
                <g
                  transform={`translate(${labelPosition.x} ${labelPosition.y}) rotate(${-normalizedRotation})`}
                  style={{ transformOrigin: "center", transformBox: "fill-box" }}
                >
                  <g transform={`translate(${-iconSize / 2} ${iconOffsetY})`}>
                    <Icon width={iconSize} height={iconSize} strokeWidth={2.2} color="white" />
                  </g>
                  <text
                    y={textBaseY}
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="700"
                    textAnchor="middle"
                    paintOrder="stroke"
                    stroke="rgba(0,0,0,0.38)"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {lines.map((line, lineIndex) => (
                      <tspan key={`${item.id}-${lineIndex}`} x="0" dy={lineIndex === 0 ? 0 : "1.05em"}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              </g>
            );
          })}

          <circle cx="0" cy="0" r="96" fill="none" stroke="rgba(226,232,240,0.88)" strokeWidth="4" />
          <circle cx="0" cy="0" r={compact ? 20 : 18} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.25" />
        </svg>
      </div>
    </div>
  );
}

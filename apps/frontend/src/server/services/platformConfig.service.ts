import { prisma } from "../utils/prisma";

export type SpinItem = {
  id: string;
  label: string;
  points: number;
  xp: number;
  weight: number;
  icon?: string;
};

export const DEFAULT_SPIN_ITEMS: SpinItem[] = [
  { id: "tiny", label: "Tiny Boost", points: 5, xp: 2, weight: 35, icon: "Sparkles" },
  { id: "small", label: "Small Win", points: 10, xp: 5, weight: 28, icon: "Coins" },
  { id: "steady", label: "Steady Gain", points: 15, xp: 8, weight: 18, icon: "Star" },
  { id: "solid", label: "Solid Reward", points: 20, xp: 10, weight: 10, icon: "Zap" },
  { id: "rare", label: "Rare Hit", points: 50, xp: 25, weight: 6, icon: "Gem" },
  { id: "jackpot", label: "Jackpot", points: 100, xp: 50, weight: 3, icon: "Crown" }
];

function normalizeSpinItems(input: unknown): SpinItem[] {
  if (!Array.isArray(input)) return DEFAULT_SPIN_ITEMS;

  const parsed: SpinItem[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id : "";
    const label = typeof item.label === "string" ? item.label : "";
    const points = typeof item.points === "number" ? Math.floor(item.points) : NaN;
    const xp = typeof item.xp === "number" ? Math.floor(item.xp) : NaN;
    const weight = typeof item.weight === "number" ? item.weight : NaN;
    const icon = typeof item.icon === "string" ? item.icon : undefined;

    if (!id || !label || Number.isNaN(points) || Number.isNaN(xp) || Number.isNaN(weight)) {
      continue;
    }

    if (weight <= 0) continue;

    parsed.push({
      id,
      label,
      points: Math.max(0, points),
      xp: Math.max(0, xp),
      weight: Math.max(0, weight),
      icon
    });
  }

  if (!parsed.length) return DEFAULT_SPIN_ITEMS;
  return parsed;
}

export async function getPlatformConfig() {
  const existing = await prisma.platformConfig.findFirst();
  if (existing) {
    if (!existing.spinItems || !Array.isArray(existing.spinItems)) {
      return prisma.platformConfig.update({
        where: { id: existing.id },
        data: {
          spinItems: DEFAULT_SPIN_ITEMS
        }
      });
    }
    return existing;
  }

  return prisma.platformConfig.create({
    data: {
      maxXpPerDay: 200,
      maxPointsPerDay: 300,
      maxSocialTasksPerDay: 2,
      redemptionCooldownHours: 48,
      maxReferralsPerDay: 10,
      referralRewardLevel: 2,
      referralPointsReward: 200,
      referralXpReward: 100,
      maxSponsorRequestsPerUser: 3,
      sponsorRequestWindowDays: 30,
      spinCooldownHours: 24,
      spinMinLevel: 2,
      spinItems: DEFAULT_SPIN_ITEMS
    }
  });
}

export async function updatePlatformConfig(values: Record<string, unknown>) {
  const config = await getPlatformConfig();
  const nextValues = { ...values };

  if ("spinItems" in nextValues) {
    nextValues.spinItems = normalizeSpinItems(nextValues.spinItems);
  }

  return prisma.platformConfig.update({
    where: { id: config.id },
    data: nextValues
  });
}


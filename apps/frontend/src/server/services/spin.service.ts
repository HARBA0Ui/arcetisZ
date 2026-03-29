import { ApiError } from "../utils/http";
import { dayBounds, hoursBetween } from "../utils/date";
import { prisma } from "../utils/prisma";
import { awardProgress, getUserOrThrow } from "./user.service";
import { getPlatformConfig, type SpinItem } from "./platformConfig.service";

function getSpinItems(raw: unknown): SpinItem[] {
  if (!Array.isArray(raw)) return [];

  const parsed: SpinItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const value = item as Record<string, unknown>;
    if (
      typeof value.id !== "string" ||
      typeof value.label !== "string" ||
      typeof value.points !== "number" ||
      typeof value.xp !== "number" ||
      typeof value.weight !== "number"
    ) {
      continue;
    }

    if (value.weight <= 0) continue;

    const icon = typeof value.icon === "string" ? value.icon : undefined;

    parsed.push({
      id: value.id,
      label: value.label,
      points: Math.max(0, Math.floor(value.points)),
      xp: Math.max(0, Math.floor(value.xp)),
      weight: Math.max(0, value.weight),
      icon
    });
  }

  return parsed;
}

function weightedPick(items: SpinItem[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const random = Math.random() * total;
  let acc = 0;

  for (let index = 0; index < items.length; index += 1) {
    acc += items[index].weight;
    if (random <= acc) {
      return { item: items[index], index };
    }
  }

  return { item: items[items.length - 1], index: items.length - 1 };
}

function nextSpinAt(lastSpinAt: Date, cooldownHours: number) {
  return new Date(lastSpinAt.getTime() + cooldownHours * 60 * 60 * 1000);
}

export async function getSpinStatus(userId: string) {
  const [user, config] = await Promise.all([getUserOrThrow(userId), getPlatformConfig()]);
  const items = getSpinItems(config.spinItems);

  if (!items.length) {
    throw new ApiError(500, "Spin wheel is not configured");
  }

  let canSpin = true;
  let nextAvailableAt: Date | null = null;

  if (user.lastSpinAt) {
    const elapsedHours = hoursBetween(new Date(), user.lastSpinAt);
    if (elapsedHours < config.spinCooldownHours) {
      canSpin = false;
      nextAvailableAt = nextSpinAt(user.lastSpinAt, config.spinCooldownHours);
    }
  }

  return {
    minLevel: config.spinMinLevel,
    cooldownHours: config.spinCooldownHours,
    canSpin: canSpin && user.level >= config.spinMinLevel,
    blockedByLevel: user.level < config.spinMinLevel,
    userLevel: user.level,
    lastSpinAt: user.lastSpinAt,
    spinCountToday: user.spinCountToday,
    nextAvailableAt,
    items
  };
}

export async function spinWheel(userId: string) {
  const [user, config] = await Promise.all([getUserOrThrow(userId), getPlatformConfig()]);

  if (user.level < config.spinMinLevel) {
    throw new ApiError(403, `Spin wheel requires level ${config.spinMinLevel}`);
  }

  if (user.lastSpinAt && hoursBetween(new Date(), user.lastSpinAt) < config.spinCooldownHours) {
    throw new ApiError(429, "Spin already used. Try again after cooldown.");
  }

  const items = getSpinItems(config.spinItems);
  if (!items.length) {
    throw new ApiError(500, "Spin wheel is not configured");
  }

  const selected = weightedPick(items);
  const now = new Date();
  const { start: todayStart } = dayBounds(now);
  const spinCountToday = user.lastSpinAt && user.lastSpinAt >= todayStart ? user.spinCountToday + 1 : 1;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastSpinAt: now,
      spinCountToday
    }
  });

  const awarded = await awardProgress({
    userId: user.id,
    xp: selected.item.xp,
    points: selected.item.points,
    source: "DAILY_SPIN",
    strictCaps: false,
    triggerReferralCheck: true
  });

  return {
    item: selected.item,
    index: selected.index,
    awardedXp: awarded.awardedXp,
    awardedPoints: awarded.awardedPoints,
    capped: awarded.capped,
    nextAvailableAt: nextSpinAt(now, config.spinCooldownHours)
  };
}


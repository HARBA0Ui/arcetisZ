import type { Reward, RewardDeliveryField, RewardPlan, User } from "@/lib/types";

export type RewardTargetUser = Pick<User, "points" | "level" | "createdAt">;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getRewardPlans(reward: Reward): RewardPlan[] {
  if (reward.plans?.length) {
    return reward.plans;
  }

  return [
    {
      id: `${reward.id}-default`,
      label: "Standard",
      pointsCost: reward.pointsCost,
      tndPrice: reward.tndPrice ?? undefined
    }
  ];
}

export function getRewardDeliveryFields(reward: Reward): RewardDeliveryField[] {
  return reward.deliveryFields ?? [];
}

export function getSelectedRewardPlan(reward: Reward, planId?: string | null) {
  const plans = getRewardPlans(reward);
  return plans.find((plan) => plan.id === planId) ?? plans[0] ?? null;
}

export function getRewardStartingPointsCost(reward: Reward) {
  return getRewardPlans(reward).reduce((lowest, plan) => Math.min(lowest, plan.pointsCost), reward.pointsCost);
}

export function getRewardStartingTndPrice(reward: Reward) {
  const candidates = getRewardPlans(reward)
    .map((plan) => plan.tndPrice)
    .filter((value): value is number => isFiniteNumber(value));

  if (isFiniteNumber(reward.tndPrice)) {
    candidates.push(reward.tndPrice);
  }

  if (!candidates.length) {
    return null;
  }

  return Math.min(...candidates);
}

export function rewardHasSelectablePlans(reward: Reward) {
  return getRewardPlans(reward).length > 1;
}

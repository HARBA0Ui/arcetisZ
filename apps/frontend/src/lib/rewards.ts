import { getRewardStartingPointsCost } from "@/lib/reward-options";
import { formatNumber } from "@/lib/format";
import type { Reward, User } from "@/lib/types";

type RewardTargetUser = Pick<User, "points" | "level" | "createdAt">;

export type RewardTarget = {
  reward: Reward;
  canRedeemNow: boolean;
  pointsNeeded: number;
  levelNeeded: number;
  daysNeeded: number;
};

function compareRewardCost(left: Reward, right: Reward) {
  return (
    getRewardStartingPointsCost(left) - getRewardStartingPointsCost(right) ||
    left.minLevel - right.minLevel ||
    left.minAccountAge - right.minAccountAge
  );
}

function compareRewardReachability(left: Reward, right: Reward, user: RewardTargetUser | null | undefined) {
  const level = user?.level ?? 1;
  const points = user?.points ?? 0;
  const accountAgeDays = getAccountAgeDays(user?.createdAt);
  const leftLevelGap = Math.max(left.minLevel - level, 0);
  const rightLevelGap = Math.max(right.minLevel - level, 0);
  const leftAgeGap = Math.max(left.minAccountAge - accountAgeDays, 0);
  const rightAgeGap = Math.max(right.minAccountAge - accountAgeDays, 0);
  const leftPointsGap = Math.max(getRewardStartingPointsCost(left) - points, 0);
  const rightPointsGap = Math.max(getRewardStartingPointsCost(right) - points, 0);

  return (
    leftLevelGap - rightLevelGap ||
    leftAgeGap - rightAgeGap ||
    leftPointsGap - rightPointsGap ||
    compareRewardCost(left, right)
  );
}

export function getAccountAgeDays(createdAt?: string | null) {
  if (!createdAt) return 0;

  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) return 0;

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - createdAtDate.getTime()) / millisecondsPerDay));
}

export function canUserRedeemReward(reward: Reward, user?: RewardTargetUser | null) {
  if (!reward || reward.stock <= 0) {
    return false;
  }

  const points = user?.points ?? 0;
  const level = user?.level ?? 1;
  const accountAgeDays = getAccountAgeDays(user?.createdAt);

  return points >= getRewardStartingPointsCost(reward) && level >= reward.minLevel && accountAgeDays >= reward.minAccountAge;
}

export function getNextRewardTarget(rewards: Reward[], user?: RewardTargetUser | null): RewardTarget | null {
  const stockedRewards = rewards.filter((reward) => reward.stock > 0);
  if (!stockedRewards.length) {
    return null;
  }

  const accessibleRewards = stockedRewards
    .filter((reward) => {
      const level = user?.level ?? 1;
      const accountAgeDays = getAccountAgeDays(user?.createdAt);

      return level >= reward.minLevel && accountAgeDays >= reward.minAccountAge;
    })
    .sort(compareRewardCost);

  const affordableRewards = accessibleRewards
    .filter((reward) => canUserRedeemReward(reward, user))
    .sort((left, right) => compareRewardCost(right, left));

  const reward =
    affordableRewards[0] ??
    accessibleRewards[0] ??
    stockedRewards.slice().sort((left, right) => compareRewardReachability(left, right, user))[0];

  if (!reward) {
    return null;
  }

  const points = user?.points ?? 0;
  const level = user?.level ?? 1;
  const accountAgeDays = getAccountAgeDays(user?.createdAt);
  const startingCost = getRewardStartingPointsCost(reward);

  return {
    reward,
    canRedeemNow: canUserRedeemReward(reward, user),
    pointsNeeded: Math.max(startingCost - points, 0),
    levelNeeded: Math.max(reward.minLevel - level, 0),
    daysNeeded: Math.max(reward.minAccountAge - accountAgeDays, 0)
  };
}

export function getRewardTargetStatusLabel(target: RewardTarget) {
  if (target.canRedeemNow) {
    return "Ready now";
  }

  if (!target.levelNeeded && !target.daysNeeded && target.pointsNeeded > 0) {
    return `Need ${formatNumber(target.pointsNeeded)} pts`;
  }

  if (target.levelNeeded > 0) {
    return `Lvl ${target.reward.minLevel}`;
  }

  if (target.daysNeeded > 0) {
    return `${target.daysNeeded}d lock`;
  }

  return "Next up";
}

export function getRewardTargetSummary(target: RewardTarget) {
  if (target.canRedeemNow) {
    return "Your current balance already covers this reward.";
  }

  const blockers: string[] = [];

  if (target.levelNeeded > 0) {
    blockers.push(`reach level ${target.reward.minLevel}`);
  }

  if (target.daysNeeded > 0) {
    blockers.push(`wait ${target.daysNeeded} more ${target.daysNeeded === 1 ? "day" : "days"}`);
  }

  if (target.pointsNeeded > 0) {
    blockers.push(`bank ${formatNumber(target.pointsNeeded)} more points`);
  }

  return blockers.length ? `To unlock this next, ${blockers.join(" and ")}.` : "This is your next reward target.";
}

import { ApiError } from "../utils/http";
import { dayBounds } from "../utils/date";
import { prisma } from "../utils/prisma";
import { getPlatformConfig } from "./platformConfig.service";
import { getUserOrThrow } from "./user.service";

export async function useReferralCode(userId: string, referralCode: string) {
  const [user, referrer, config] = await Promise.all([
    getUserOrThrow(userId),
    prisma.user.findUnique({ where: { referralCode } }),
    getPlatformConfig()
  ]);

  if (!referrer) {
    throw new ApiError(404, "Referral code not found");
  }

  if (referrer.id === user.id) {
    throw new ApiError(400, "You cannot use your own referral code");
  }

  if (user.referredById) {
    throw new ApiError(400, "Referral code already used");
  }

  const { start, end } = dayBounds();
  const usedToday = await prisma.referral.count({
    where: {
      referrerId: referrer.id,
      createdAt: { gte: start, lt: end }
    }
  });

  if (usedToday >= config.maxReferralsPerDay) {
    throw new ApiError(429, "Referrer has reached daily referral limit");
  }

  const referral = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredUserId: user.id,
      rewarded: false
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { referredById: referrer.id }
  });

  return referral;
}

export async function getReferralStats(userId: string) {
  const [user, total, rewarded, pending, config] = await Promise.all([
    getUserOrThrow(userId),
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, rewarded: true } }),
    prisma.referral.count({ where: { referrerId: userId, rewarded: false } }),
    getPlatformConfig()
  ]);

  return {
    referralCode: user.referralCode,
    total,
    rewarded,
    pending,
    rules: {
      maxReferralsPerDay: config.maxReferralsPerDay,
      referralRewardLevel: config.referralRewardLevel,
      referralPointsReward: config.referralPointsReward,
      referralXpReward: config.referralXpReward
    }
  };
}

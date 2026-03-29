import { ApiError } from "../utils/http";
import { dayBounds } from "../utils/date";
import { levelFromXp, xpProgress } from "../utils/level";
import { prisma } from "../utils/prisma";
import { getPlatformConfig } from "./platformConfig.service";

type AwardProgressInput = {
  userId: string;
  xp: number;
  points: number;
  source: string;
  strictCaps?: boolean;
  triggerReferralCheck?: boolean;
};

export async function getUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
}

export function sanitizeUser(user: {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  emailVerifiedAt?: Date | null;
  points: number;
  xp: number;
  level: number;
  loginStreak: number;
  referralCode: string;
  createdAt: Date;
  lastLogin: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    points: user.points,
    xp: user.xp,
    level: user.level,
    loginStreak: user.loginStreak,
    referralCode: user.referralCode,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString() ?? null
  };
}

export async function getDailyEarned(userId: string, date = new Date()) {
  const { start, end } = dayBounds(date);

  const [xp, points] = await Promise.all([
    prisma.xPTransaction.aggregate({
      where: {
        userId,
        createdAt: { gte: start, lt: end },
        amount: { gt: 0 }
      },
      _sum: { amount: true }
    }),
    prisma.pointsTransaction.aggregate({
      where: {
        userId,
        createdAt: { gte: start, lt: end },
        amount: { gt: 0 }
      },
      _sum: { amount: true }
    })
  ]);

  return {
    xp: xp._sum.amount ?? 0,
    points: points._sum.amount ?? 0
  };
}

export async function awardProgress({
  userId,
  xp,
  points,
  source,
  strictCaps = true,
  triggerReferralCheck = true
}: AwardProgressInput) {
  if (xp < 0 || points < 0) {
    throw new ApiError(400, "XP and points must be non-negative");
  }

  const [user, config, dailyEarned] = await Promise.all([
    getUserOrThrow(userId),
    getPlatformConfig(),
    getDailyEarned(userId)
  ]);

  const availableXp = Math.max(config.maxXpPerDay - dailyEarned.xp, 0);
  const availablePoints = Math.max(config.maxPointsPerDay - dailyEarned.points, 0);

  const awardedXp = Math.min(xp, availableXp);
  const awardedPoints = Math.min(points, availablePoints);

  if (strictCaps && (awardedXp < xp || awardedPoints < points)) {
    throw new ApiError(429, "Daily XP or points cap reached");
  }

  if (awardedXp === 0 && awardedPoints === 0) {
    return {
      user,
      awardedXp,
      awardedPoints,
      capped: xp > 0 || points > 0
    };
  }

  let updatedUser = user;

  await prisma.$transaction(async (tx) => {
    if (awardedXp > 0) {
      await tx.xPTransaction.create({
        data: {
          userId,
          amount: awardedXp,
          source
        }
      });
    }

    if (awardedPoints > 0) {
      await tx.pointsTransaction.create({
        data: {
          userId,
          amount: awardedPoints,
          source
        }
      });
    }

    const progressed = await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: awardedXp },
        points: { increment: awardedPoints }
      }
    });

    const computedLevel = levelFromXp(progressed.xp);

    if (progressed.level !== computedLevel) {
      updatedUser = await tx.user.update({
        where: { id: userId },
        data: { level: computedLevel }
      });
    } else {
      updatedUser = progressed;
    }
  });

  if (triggerReferralCheck) {
    await rewardReferrerIfQualified(userId, user.level, updatedUser.level);
  }

  return {
    user: updatedUser,
    awardedXp,
    awardedPoints,
    capped: awardedXp < xp || awardedPoints < points
  };
}

async function rewardReferrerIfQualified(
  referredUserId: string,
  previousLevel: number,
  currentLevel: number
) {
  const config = await getPlatformConfig();

  if (previousLevel >= config.referralRewardLevel || currentLevel < config.referralRewardLevel) {
    return;
  }

  const referral = await prisma.referral.findUnique({
    where: { referredUserId },
    include: { referrer: true }
  });

  if (!referral || referral.rewarded) {
    return;
  }

  await prisma.referral.update({
    where: { id: referral.id },
    data: { rewarded: true }
  });

  await awardProgress({
    userId: referral.referrerId,
    xp: config.referralXpReward,
    points: config.referralPointsReward,
    source: "REFERRAL_BONUS",
    strictCaps: false,
    triggerReferralCheck: false
  });
}

export async function getUserStats(userId: string) {
  const [user, config] = await Promise.all([getUserOrThrow(userId), getPlatformConfig()]);

  const [dailyEarned, completedQuests, redemptions, leaderboardRank] = await Promise.all([
    getDailyEarned(userId),
    prisma.questCompletion.count({ where: { userId } }),
    prisma.redemption.count({ where: { userId } }),
    prisma.user.count({
      where: {
        OR: [
          { points: { gt: user.points } },
          {
            points: user.points,
            xp: { gt: user.xp }
          }
        ]
      }
    })
  ]);

  const progress = xpProgress(user.xp);

  return {
    ...progress,
    user: sanitizeUser(user),
    dailyEarned,
    limits: {
      maxXpPerDay: config.maxXpPerDay,
      maxPointsPerDay: config.maxPointsPerDay,
      maxSocialTasksPerDay: config.maxSocialTasksPerDay
    },
    completedQuests,
    redemptions,
    leaderboardRank: leaderboardRank + 1
  };
}

export async function updateUserSettings(input: {
  userId: string;
  email?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const user = await getUserOrThrow(input.userId);
  const nextEmail = input.email?.toLowerCase().trim();
  const nextUsername = input.username?.trim();
  const wantsEmailChange = !!nextEmail && nextEmail !== user.email;
  const wantsPasswordChange = !!input.newPassword;
  const wantsUsernameChange = !!nextUsername && nextUsername !== user.username;

  if (!wantsEmailChange && !wantsPasswordChange && !wantsUsernameChange) {
    throw new ApiError(400, "No changes provided");
  }

  if ((wantsEmailChange || wantsPasswordChange) && !input.currentPassword) {
    throw new ApiError(400, "Current password is required");
  }

  if (wantsEmailChange) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true }
    });

    if (emailTaken && emailTaken.id !== user.id) {
      throw new ApiError(409, "Email already in use");
    }
  }

  if (wantsUsernameChange) {
    const usernameTaken = await prisma.user.findUnique({
      where: { username: nextUsername },
      select: { id: true }
    });

    if (usernameTaken && usernameTaken.id !== user.id) {
      throw new ApiError(409, "Username already in use");
    }
  }

  if (input.currentPassword && (wantsEmailChange || wantsPasswordChange)) {
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.default.compare(input.currentPassword, user.password);

    if (!valid) {
      throw new ApiError(401, "Current password is incorrect");
    }
  }

  let hashedPassword: string | undefined;
  if (input.newPassword) {
    const bcrypt = await import("bcryptjs");
    hashedPassword = await bcrypt.default.hash(input.newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: nextEmail ?? undefined,
      username: nextUsername ?? undefined,
      password: hashedPassword ?? undefined
    }
  });

  return sanitizeUser(updated);
}

export async function getLeaderboard(limit = 10) {
  return prisma.user.findMany({
    orderBy: [{ points: "desc" }, { xp: "desc" }],
    take: limit,
    select: {
      id: true,
      username: true,
      level: true,
      points: true,
      xp: true
    }
  });
}

import bcrypt from "bcryptjs";
import type { Prisma, RedemptionStatus } from "@prisma/client";
import { ApiError } from "../utils/http";
import { prisma } from "../utils/prisma";
import { createNotification } from "./notification.service";
import { getPlatformConfig, updatePlatformConfig } from "./platformConfig.service";
import {
  approveRedemption,
  expirePendingRedemptions,
  materializeAdminRedemption,
  rejectRedemption
} from "./reward.service";

type AdminCollectionQuery = {
  q?: string;
  page: number;
  pageSize: number;
};

type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function buildRecentActivity(days = 7) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });

  return Array.from({ length: days }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return {
      key: current.toISOString().slice(0, 10),
      date: current.toISOString(),
      label: formatter.format(current),
      users: 0,
      sponsorRequests: 0,
      redemptions: 0
    };
  });
}

function incrementRecentActivity(
  buckets: ReturnType<typeof buildRecentActivity>,
  items: Array<{ createdAt: Date }>,
  key: "users" | "sponsorRequests" | "redemptions"
) {
  const map = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const item of items) {
    const bucketKey = item.createdAt.toISOString().slice(0, 10);
    const bucket = map.get(bucketKey);

    if (bucket) {
      bucket[key] += 1;
    }
  }
}

function getPagination(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    skip
  };
}

async function createPaginatedResult<T>(
  totalPromise: Promise<number>,
  itemsPromiseFactory: (skip: number, take: number) => Promise<T[]>,
  query: AdminCollectionQuery
): Promise<PaginatedResult<T>> {
  const total = await totalPromise;
  const pagination = getPagination(total, query.page, query.pageSize);
  const items = await itemsPromiseFactory(pagination.skip, pagination.pageSize);

  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    totalPages: pagination.totalPages
  };
}

function stringContains(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const
  };
}

export async function createQuest(data: Prisma.QuestCreateInput) {
  return prisma.quest.create({ data });
}

export async function createReward(data: Prisma.RewardCreateInput) {
  return prisma.reward.create({ data });
}

export async function getAdminDashboardStats() {
  await expirePendingRedemptions();

  const activityStart = new Date();
  activityStart.setHours(0, 0, 0, 0);
  activityStart.setDate(activityStart.getDate() - 6);

  const [
    users,
    quests,
    activeQuests,
    sponsoredQuests,
    products,
    pendingSponsorRequests,
    pendingQuestSubmissions,
    pendingRedemptions,
    questCompletions,
    referrals,
    pointsSummary,
    xpSummary,
    recentUsers,
    recentSponsorRequests,
    recentProducts,
    activityUsers,
    activitySponsorRequests,
    activityRedemptions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.quest.count(),
    prisma.quest.count({ where: { active: true } }),
    prisma.quest.count({ where: { category: "SPONSORED" } }),
    prisma.reward.count(),
    prisma.sponsorRequest.count({ where: { status: "pending" } }),
    prisma.questSubmission.count({ where: { status: "pending" } }),
    prisma.redemption.count({ where: { status: "pending" } }),
    prisma.questCompletion.count(),
    prisma.referral.count(),
    prisma.pointsTransaction.aggregate({
      where: { amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.xPTransaction.aggregate({
      where: { amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        level: true,
        createdAt: true
      }
    }),
    prisma.sponsorRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        companyName: true,
        status: true,
        createdAt: true,
        category: true,
        maxCompletions: true,
        submittedBy: {
          select: {
            id: true,
            username: true,
            email: true,
            level: true
          }
        }
      }
    }),
    prisma.reward.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        stock: true,
        pointsCost: true,
        createdAt: true
      }
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: activityStart } },
      select: { createdAt: true }
    }),
    prisma.sponsorRequest.findMany({
      where: { createdAt: { gte: activityStart } },
      select: { createdAt: true }
    }),
    prisma.redemption.findMany({
      where: { createdAt: { gte: activityStart } },
      select: { createdAt: true }
    })
  ]);

  const recentActivity = buildRecentActivity();
  incrementRecentActivity(recentActivity, activityUsers, "users");
  incrementRecentActivity(recentActivity, activitySponsorRequests, "sponsorRequests");
  incrementRecentActivity(recentActivity, activityRedemptions, "redemptions");

  return {
    totals: {
      users,
      quests,
      activeQuests,
      sponsoredQuests,
      products,
      pendingSponsorRequests,
      pendingQuestSubmissions,
      pendingRedemptions,
      questCompletions,
      referrals,
      pointsIssued: pointsSummary._sum.amount ?? 0,
      xpIssued: xpSummary._sum.amount ?? 0
    },
    recentActivity,
    recentUsers,
    recentSponsorRequests,
    recentProducts
  };
}

export async function listAdminRewards(query: AdminCollectionQuery) {
  const trimmedQuery = query.q?.trim();
  const where: Prisma.RewardWhereInput | undefined = trimmedQuery
    ? {
        OR: [
          { title: stringContains(trimmedQuery) },
          { description: stringContains(trimmedQuery) }
        ]
      }
    : undefined;

  return createPaginatedResult(
    prisma.reward.count({ where }),
    (skip, take) =>
      prisma.reward.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take
      }),
    query
  );
}

export async function getAdminQuestById(questId: string) {
  const quest = await prisma.quest.findUnique({
    where: { id: questId }
  });

  if (!quest) {
    throw new ApiError(404, "Quest not found");
  }

  const [pendingSubmissions, approvedSubmissions, rejectedSubmissions] = await Promise.all([
    prisma.questSubmission.count({ where: { questId, status: "pending" } }),
    prisma.questSubmission.count({ where: { questId, status: "approved" } }),
    prisma.questSubmission.count({ where: { questId, status: "rejected" } })
  ]);

  return {
    ...quest,
    stats: {
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions
    }
  };
}

export async function getAdminRewardById(rewardId: string) {
  await expirePendingRedemptions();

  const reward = await prisma.reward.findUnique({
    where: { id: rewardId }
  });

  if (!reward) {
    throw new ApiError(404, "Product not found");
  }

  const [totalRedemptions, approvedRedemptions, pendingRedemptions] = await Promise.all([
    prisma.redemption.count({ where: { rewardId } }),
    prisma.redemption.count({ where: { rewardId, status: "approved" } }),
    prisma.redemption.count({ where: { rewardId, status: "pending" } })
  ]);

  return {
    ...reward,
    stats: {
      totalRedemptions,
      approvedRedemptions,
      pendingRedemptions
    }
  };
}

export async function updateQuest(questId: string, data: Prisma.QuestUpdateInput) {
  const exists = await prisma.quest.findUnique({
    where: { id: questId },
    select: { id: true }
  });

  if (!exists) {
    throw new ApiError(404, "Quest not found");
  }

  return prisma.quest.update({
    where: { id: questId },
    data
  });
}

export async function updateReward(rewardId: string, data: Prisma.RewardUpdateInput) {
  const exists = await prisma.reward.findUnique({
    where: { id: rewardId },
    select: { id: true }
  });

  if (!exists) {
    throw new ApiError(404, "Product not found");
  }

  return prisma.reward.update({
    where: { id: rewardId },
    data
  });
}

export async function deleteReward(rewardId: string) {
  await expirePendingRedemptions();

  const existing = await prisma.reward.findUnique({
    where: { id: rewardId },
    select: { id: true }
  });

  if (!existing) {
    throw new ApiError(404, "Product not found");
  }

  const pendingCount = await prisma.redemption.count({
    where: { rewardId, status: "pending" }
  });

  if (pendingCount > 0) {
    throw new ApiError(400, "Cannot delete product with pending redemptions");
  }

  await prisma.reward.delete({ where: { id: rewardId } });
}

export async function listRedemptions(query: AdminCollectionQuery & { status?: RedemptionStatus }) {
  await expirePendingRedemptions();

  const trimmedQuery = query.q?.trim();
  const where: Prisma.RedemptionWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { requestCode: stringContains(trimmedQuery) },
            { planLabel: stringContains(trimmedQuery) },
            { reward: { is: { title: stringContains(trimmedQuery) } } },
            {
              user: {
                is: {
                  OR: [
                    { username: stringContains(trimmedQuery) },
                    { email: stringContains(trimmedQuery) }
                  ]
                }
              }
            }
          ]
        }
      : {})
  };

  return createPaginatedResult(
    prisma.redemption.count({ where }),
    async (skip, take) => {
      const redemptions = await prisma.redemption.findMany({
        where,
        include: {
          reward: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              level: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take
      });

      return redemptions.map((redemption) => materializeAdminRedemption(redemption));
    },
    query
  );
}

export async function updateRedemptionStatus(
  redemptionId: string,
  status: RedemptionStatus,
  reviewNote?: string,
  adminUserId?: string
) {
  await expirePendingRedemptions();

  const redemption = await prisma.redemption.findUnique({
    where: { id: redemptionId },
    include: { reward: true }
  });

  if (!redemption) {
    throw new ApiError(404, "Redemption not found");
  }

  if (redemption.status !== "pending") {
    throw new ApiError(400, "Redemption already processed");
  }

  if (status === "rejected") {
    await rejectRedemption(redemption, reviewNote, adminUserId);
  } else if (status === "approved") {
    await approveRedemption(redemption, reviewNote, adminUserId);
  } else {
    throw new ApiError(400, "Unsupported redemption status");
  }

  const updated = await prisma.redemption.findUnique({
    where: { id: redemptionId },
    include: {
      reward: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          level: true
        }
      },
      reviewedBy: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });

  if (updated) {
    await createNotification({
      userId: redemption.userId,
      type: "REDEMPTION_REVIEWED",
      title: status === "approved" ? "Request delivered" : "Request rejected",
      message:
        status === "approved"
          ? `${redemption.reward.title} was marked delivered by the admin team.`
          : `${redemption.reward.title} was rejected. Your points were refunded automatically.`,
      link: `/requests/${redemption.id}`,
      metadata: {
        redemptionId: redemption.id,
        rewardId: redemption.rewardId,
        requestCode: redemption.requestCode,
        status
      }
    });

    return materializeAdminRedemption(updated);
  }

  return updated;
}

export async function getAdminUsers(query: AdminCollectionQuery) {
  const trimmedQuery = query.q?.trim();
  const where: Prisma.UserWhereInput | undefined = trimmedQuery
    ? {
        OR: [
          { email: stringContains(trimmedQuery) },
          { username: stringContains(trimmedQuery) },
          { referralCode: stringContains(trimmedQuery) }
        ]
      }
    : undefined;

  return createPaginatedResult(
    prisma.user.count({ where }),
    (skip, take) =>
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          username: true,
          level: true,
          points: true,
          xp: true,
          role: true,
          createdAt: true,
          lastLogin: true
        },
        skip,
        take
      }),
    query
  );
}

export async function getAdminUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      level: true,
      points: true,
      xp: true,
      loginStreak: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const [
    completionsCount,
    submissionsPending,
    submissionsApproved,
    submissionsRejected,
    redemptionsTotal,
    redemptionsApproved,
    redemptionsPending,
    referralsSent,
    pointsSummary,
    xpSummary
  ] = await Promise.all([
    prisma.questCompletion.count({ where: { userId } }),
    prisma.questSubmission.count({ where: { userId, status: "pending" } }),
    prisma.questSubmission.count({ where: { userId, status: "approved" } }),
    prisma.questSubmission.count({ where: { userId, status: "rejected" } }),
    prisma.redemption.count({ where: { userId } }),
    prisma.redemption.count({ where: { userId, status: "approved" } }),
    prisma.redemption.count({ where: { userId, status: "pending" } }),
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.pointsTransaction.aggregate({
      where: { userId },
      _sum: { amount: true }
    }),
    prisma.xPTransaction.aggregate({
      where: { userId },
      _sum: { amount: true }
    })
  ]);

  return {
    user,
    stats: {
      completionsCount,
      submissionsPending,
      submissionsApproved,
      submissionsRejected,
      redemptionsTotal,
      redemptionsApproved,
      redemptionsPending,
      referralsSent,
      totalPointsDelta: pointsSummary._sum.amount ?? 0,
      totalXpDelta: xpSummary._sum.amount ?? 0
    }
  };
}

function randomReferralCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomReferralCode();
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });

    if (!exists) {
      return code;
    }
  }

  throw new ApiError(500, "Failed to generate referral code");
}

export async function createAdminUser(input: { email: string; username: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const username = input.username.trim();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    },
    select: { id: true }
  });

  if (existing) {
    throw new ApiError(409, "Email or username already in use");
  }

  const password = await bcrypt.hash(input.password, 10);
  const referralCode = await generateUniqueReferralCode();

  return prisma.user.create({
    data: {
      email,
      username,
      password,
      referralCode,
      role: "ADMIN"
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true
    }
  });
}

export async function getAdminConfig() {
  return getPlatformConfig();
}

export async function patchAdminConfig(values: Record<string, unknown>) {
  return updatePlatformConfig(values);
}

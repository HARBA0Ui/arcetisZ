import type { QuestCategory, QuestSubmissionStatus } from "@prisma/client";
import {
  DAILY_LOGIN_POINTS_REWARD,
  DAILY_LOGIN_XP_REWARD,
  isDailyLoginQuest
} from "@/lib/quests";
import { ApiError } from "../utils/http";
import { dayBounds } from "../utils/date";
import { prisma } from "../utils/prisma";
import {
  createNotification,
  createNotificationForAdmins
} from "./notification.service";
import { claimDailyLogin } from "./dailyLogin.service";
import { getPlatformConfig } from "./platformConfig.service";
import { awardProgress, getDailyEarned, getUserOrThrow } from "./user.service";

type CompleteQuestOptions = {
  allowProofBypass?: boolean;
};

type ReviewSubmissionInput = {
  submissionId: string;
  status: "approved" | "rejected";
  reviewNote?: string;
  externalReference?: string;
  adminUserId?: string;
  idempotent?: boolean;
};

function isManualVerificationQuest(quest: {
  category: QuestCategory;
  platform: string | null;
  requiresProof: boolean;
}) {
  const isInstagramSocial =
    quest.category === "SOCIAL" && (quest.platform ?? "").toLowerCase().includes("instagram");

  return quest.requiresProof || quest.category === "SPONSORED" || isInstagramSocial;
}

function normalizeQuestRewards<T extends { category: QuestCategory; title: string; xpReward: number; pointsReward: number }>(
  quest: T
) {
  if (!isDailyLoginQuest(quest)) {
    return quest;
  }

  return {
    ...quest,
    xpReward: DAILY_LOGIN_XP_REWARD,
    pointsReward: DAILY_LOGIN_POINTS_REWARD
  };
}

async function getQuestUserState(userId: string, questIds: string[]) {
  const [completions, submissions] = await Promise.all([
    prisma.questCompletion.findMany({
      where: {
        userId,
        questId: { in: questIds }
      },
      select: { questId: true, createdAt: true }
    }),
    prisma.questSubmission.findMany({
      where: {
        userId,
        questId: { in: questIds }
      },
      orderBy: { createdAt: "desc" },
      select: {
        questId: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        reviewNote: true,
        proofUrl: true,
        proofSecondaryUrl: true
      }
    })
  ]);

  const completionsByQuest = completions.reduce<Record<string, Date[]>>((acc, item) => {
    if (!acc[item.questId]) acc[item.questId] = [];
    acc[item.questId].push(item.createdAt);
    return acc;
  }, {});

  const latestSubmissionByQuest = submissions.reduce<
    Record<string, (typeof submissions)[number]>
  >((acc, submission) => {
    if (!acc[submission.questId]) {
      acc[submission.questId] = submission;
    }
    return acc;
  }, {});

  return {
    completionsByQuest,
    latestSubmissionByQuest
  };
}

export async function getQuests(category?: QuestCategory, userId?: string) {
  const quests = await prisma.quest.findMany({
    where: {
      active: true,
      ...(category ? { category } : {})
    },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }]
  });

  if (!userId) return quests.map(normalizeQuestRewards);

  const { completionsByQuest, latestSubmissionByQuest } = await getQuestUserState(
    userId,
    quests.map((quest) => quest.id)
  );

  return quests.map((quest) => ({
    ...normalizeQuestRewards(quest),
    completionCount: completionsByQuest[quest.id]?.length ?? 0,
    lastCompletedAt:
      completionsByQuest[quest.id]?.sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
    latestSubmission: latestSubmissionByQuest[quest.id] ?? null
  }));
}

export async function getQuestById(questId: string, userId?: string) {
  const quest = await prisma.quest.findUnique({
    where: { id: questId }
  });

  if (!quest || !quest.active) {
    throw new ApiError(404, "Quest not found");
  }

  if (!userId) {
    return normalizeQuestRewards(quest);
  }

  const { completionsByQuest, latestSubmissionByQuest } = await getQuestUserState(userId, [quest.id]);

  return {
    ...normalizeQuestRewards(quest),
    completionCount: completionsByQuest[quest.id]?.length ?? 0,
    lastCompletedAt:
      completionsByQuest[quest.id]?.sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
    latestSubmission: latestSubmissionByQuest[quest.id] ?? null
  };
}

export async function completeQuest(
  userId: string,
  questId: string,
  options: CompleteQuestOptions = {}
) {
  const [user, quest, config] = await Promise.all([
    getUserOrThrow(userId),
    prisma.quest.findUnique({ where: { id: questId } }),
    getPlatformConfig()
  ]);

  if (!quest || !quest.active) {
    throw new ApiError(404, "Quest not found");
  }

  if (isDailyLoginQuest(quest)) {
    const result = await claimDailyLogin(userId);

    return {
      quest: normalizeQuestRewards(quest),
      awardedXp: result.awardedXp,
      awardedPoints: result.awardedPoints,
      user: result.user
    };
  }

  if (isManualVerificationQuest(quest) && !options.allowProofBypass) {
    throw new ApiError(400, "This quest requires proof submission and admin verification");
  }

  if (user.level < quest.minLevel) {
    throw new ApiError(403, `Requires level ${quest.minLevel}`);
  }

  if (quest.completions >= quest.maxCompletions) {
    throw new ApiError(400, "Quest has reached completion limit");
  }

  const { start, end } = dayBounds();

  if (quest.category === "SOCIAL") {
    const socialDoneToday = await prisma.questCompletion.count({
      where: {
        userId,
        createdAt: { gte: start, lt: end },
        quest: { category: "SOCIAL" }
      }
    });

    if (socialDoneToday >= config.maxSocialTasksPerDay) {
      throw new ApiError(429, `Maximum ${config.maxSocialTasksPerDay} social tasks per day reached`);
    }
  }

  const alreadyDoneToday = await prisma.questCompletion.findFirst({
    where: {
      userId,
      questId,
      createdAt: { gte: start, lt: end }
    }
  });

  if (quest.category !== "SPONSORED" && alreadyDoneToday) {
    throw new ApiError(400, "Quest already completed today");
  }

  if (quest.category === "SPONSORED") {
    const alreadyDone = await prisma.questCompletion.findFirst({
      where: { userId, questId }
    });

    if (alreadyDone) {
      throw new ApiError(400, "Sponsored quest can only be completed once");
    }
  }

  const daily = await getDailyEarned(userId);
  if (
    daily.xp + quest.xpReward > config.maxXpPerDay ||
    daily.points + quest.pointsReward > config.maxPointsPerDay
  ) {
    throw new ApiError(429, "Completing this quest would exceed daily cap");
  }

  await prisma.$transaction(async (tx) => {
    await tx.questCompletion.create({
      data: {
        userId,
        questId
      }
    });

    await tx.quest.update({
      where: { id: quest.id },
      data: { completions: { increment: 1 } }
    });
  });

  const award = await awardProgress({
    userId,
    xp: quest.xpReward,
    points: quest.pointsReward,
    source: `QUEST_${quest.category}`,
    strictCaps: true,
    triggerReferralCheck: true
  });

  return {
    quest: normalizeQuestRewards(quest),
    awardedXp: award.awardedXp,
    awardedPoints: award.awardedPoints,
    user: award.user
  };
}

export async function submitQuestProof(input: {
  userId: string;
  questId: string;
  proofUrl?: string;
  proofSecondaryUrl?: string;
  proofText?: string;
}) {
  const [user, quest] = await Promise.all([
    getUserOrThrow(input.userId),
    prisma.quest.findUnique({ where: { id: input.questId } })
  ]);

  if (!quest || !quest.active) {
    throw new ApiError(404, "Quest not found");
  }

  if (!isManualVerificationQuest(quest)) {
    throw new ApiError(400, "This quest does not require manual proof");
  }

  if (user.level < quest.minLevel) {
    throw new ApiError(403, `Requires level ${quest.minLevel}`);
  }

  if (quest.completions >= quest.maxCompletions) {
    throw new ApiError(400, "Quest has reached completion limit");
  }

  const isInstagramSocial =
    quest.category === "SOCIAL" && (quest.platform ?? "").toLowerCase().includes("instagram");

  if (isInstagramSocial && (!input.proofUrl || !input.proofSecondaryUrl)) {
    throw new ApiError(
      400,
      "Instagram social quest requires two proofs: your profile screenshot and followed page screenshot"
    );
  }

  const [alreadyDone, existingPendingOrApproved] = await Promise.all([
    prisma.questCompletion.findFirst({ where: { userId: input.userId, questId: quest.id } }),
    prisma.questSubmission.findFirst({
      where: {
        userId: input.userId,
        questId: quest.id,
        status: { in: ["pending", "approved"] }
      }
    })
  ]);

  if (alreadyDone) {
    throw new ApiError(400, "Quest already completed");
  }

  if (existingPendingOrApproved) {
    if (existingPendingOrApproved.status === "pending") {
      throw new ApiError(400, "A proof submission is already pending review");
    }

    throw new ApiError(400, "Quest has already been approved");
  }

  const submission = await prisma.questSubmission.create({
    data: {
      userId: input.userId,
      questId: quest.id,
      proofUrl: input.proofUrl,
      proofSecondaryUrl: input.proofSecondaryUrl,
      proofText: input.proofText,
      status: "pending"
    },
    include: {
      quest: true
    }
  });

  await Promise.all([
    createNotification({
      userId: input.userId,
      type: "SYSTEM",
      title: "Proof submitted",
      message: `${quest.title} is pending admin review.`,
      link: "/tasks",
      metadata: { questId: quest.id, submissionId: submission.id }
    }),
    createNotificationForAdmins({
      type: "ADMIN_REVIEW_REQUIRED",
      title: "Quest review required",
      message: `${user.username} submitted proof for ${quest.title}.`,
      link: "/backoffice/dashboard/quests",
      metadata: { questId: quest.id, submissionId: submission.id, userId: user.id }
    })
  ]);

  return submission;
}

export async function getUserQuestSubmissions(userId: string, status?: QuestSubmissionStatus) {
  return prisma.questSubmission.findMany({
    where: {
      userId,
      ...(status ? { status } : {})
    },
    include: {
      quest: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getManualSubmissions(status?: QuestSubmissionStatus) {
  const submissions = await prisma.questSubmission.findMany({
    where: {
      ...(status ? { status } : {})
    },
    include: {
      quest: true,
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
    orderBy: { createdAt: "desc" }
  });

  return submissions.filter((submission) => isManualVerificationQuest(submission.quest));
}

export async function reviewManualSubmission(input: ReviewSubmissionInput) {
  return decideManualSubmission({ ...input, idempotent: false });
}

export async function processSponsoredWebhookVerification(input: ReviewSubmissionInput) {
  return decideManualSubmission({ ...input, idempotent: true });
}

async function decideManualSubmission(input: ReviewSubmissionInput) {
  const submission = await prisma.questSubmission.findUnique({
    where: { id: input.submissionId },
    include: {
      quest: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          level: true
        }
      }
    }
  });

  if (!submission) {
    throw new ApiError(404, "Quest submission not found");
  }

  if (submission.status !== "pending") {
    if (input.idempotent && submission.status === input.status) {
      return submission;
    }

    throw new ApiError(400, "Submission already processed");
  }

  if (input.status === "rejected") {
    const reviewed = await prisma.questSubmission.update({
      where: { id: submission.id },
      data: {
        status: "rejected",
        reviewNote: input.reviewNote,
        externalReference: input.externalReference,
        reviewedAt: new Date(),
        reviewedById: input.adminUserId
      },
      include: {
        quest: true,
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

    await createNotification({
      userId: submission.userId,
      type: "QUEST_SUBMISSION_REVIEWED",
      title: "Quest proof rejected",
      message:
        input.reviewNote?.trim() ||
        `${submission.quest.title} was rejected by admin review. You can submit a new proof.`,
      link: "/tasks",
      metadata: { questId: submission.questId, submissionId: submission.id, status: "rejected" }
    });

    return reviewed;
  }

  await completeQuest(submission.userId, submission.questId, {
    allowProofBypass: true
  });

  const reviewed = await prisma.questSubmission.update({
    where: { id: submission.id },
    data: {
      status: "approved",
      reviewNote: input.reviewNote,
      externalReference: input.externalReference,
      reviewedAt: new Date(),
      reviewedById: input.adminUserId
    },
    include: {
      quest: true,
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

  await createNotification({
    userId: submission.userId,
    type: "QUEST_SUBMISSION_REVIEWED",
    title: "Quest proof approved",
    message: `${submission.quest.title} was approved. You earned ${submission.quest.pointsReward} points and ${submission.quest.xpReward} XP.`,
    link: "/tasks",
    metadata: { questId: submission.questId, submissionId: submission.id, status: "approved" }
  });

  return reviewed;
}

import type { SponsorRequestStatus } from "@prisma/client";
import { formatSponsorCategory } from "@/lib/sponsor-requests";
import { ApiError } from "../utils/http";
import { prisma } from "../utils/prisma";
import { createNotification, createNotificationForAdmins } from "./notification.service";
import { getPlatformConfig } from "./platformConfig.service";

type AdminSponsorRequestQuery = {
  status?: SponsorRequestStatus;
  q?: string;
  page: number;
  pageSize: number;
};

type CreateSponsorRequestInput = {
  userId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  category: "SOCIAL_MEDIA" | "CONTENT_CREATOR" | "COMMUNITY" | "PRODUCT_PROMOTION" | "EVENT_CAMPAIGN";
  title: string;
  description: string;
  imageUrl?: string;
  otherReason?: string;
  platform?: string;
  landingUrl?: string;
  proofRequirements?: string;
  requestedXpReward: number;
  requestedPointsReward: number;
  maxCompletions?: number;
  minLevel?: number;
};

type ReviewSponsorRequestInput = {
  sponsorRequestId: string;
  adminUserId: string;
  status: "accepted" | "rejected";
  reviewNote?: string;
};

function requestWindowStart(windowDays: number) {
  const start = new Date();
  start.setDate(start.getDate() - Math.max(windowDays, 1));
  return start;
}

function stringContains(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const
  };
}

function getPagination(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    skip: (safePage - 1) * pageSize
  };
}

export async function createSponsorRequest(input: CreateSponsorRequestInput) {
  const config = await getPlatformConfig();
  const windowStart = requestWindowStart(config.sponsorRequestWindowDays);

  const [recentCount, pendingCount] = await Promise.all([
    prisma.sponsorRequest.count({
      where: {
        submittedById: input.userId,
        createdAt: { gte: windowStart }
      }
    }),
    prisma.sponsorRequest.count({
      where: {
        submittedById: input.userId,
        status: "pending"
      }
    })
  ]);

  if (recentCount >= config.maxSponsorRequestsPerUser || pendingCount >= config.maxSponsorRequestsPerUser) {
    await createNotification({
      userId: input.userId,
      type: "SPONSOR_REQUEST_LIMIT_REACHED",
      title: "Sponsor request limit reached",
      message: `You have reached the sponsor request limit of ${config.maxSponsorRequestsPerUser} request(s) within ${config.sponsorRequestWindowDays} day(s).`,
      link: "/profile",
      metadata: {
        maxSponsorRequestsPerUser: config.maxSponsorRequestsPerUser,
        sponsorRequestWindowDays: config.sponsorRequestWindowDays
      }
    });

    throw new ApiError(
      400,
      `Sponsor request limit reached. You can submit up to ${config.maxSponsorRequestsPerUser} request(s) every ${config.sponsorRequestWindowDays} day(s).`
    );
  }

  const request = await prisma.sponsorRequest.create({
    data: {
      submittedById: input.userId,
      companyName: input.companyName.trim(),
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim().toLowerCase(),
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      imageUrl: input.imageUrl?.trim() || undefined,
      otherReason: input.otherReason?.trim() || undefined,
      platform: input.platform?.trim() || undefined,
      landingUrl: input.landingUrl?.trim() || undefined,
      proofRequirements: input.proofRequirements?.trim() || undefined,
      requestedXpReward: input.requestedXpReward,
      requestedPointsReward: input.requestedPointsReward,
      maxCompletions: input.maxCompletions ?? 1,
      minLevel: input.minLevel ?? 1
    }
  });

  await createNotificationForAdmins({
    type: "ADMIN_SPONSOR_REQUEST_REQUIRED",
    title: "Sponsor request requires review",
    message: `${request.title} was submitted and is waiting for backoffice review.`,
    link: "/backoffice/dashboard/sponsors",
    metadata: {
      sponsorRequestId: request.id,
      submittedById: input.userId
    }
  });

  return request;
}

export async function listUserSponsorRequests(userId: string, status?: SponsorRequestStatus) {
  return prisma.sponsorRequest.findMany({
    where: {
      submittedById: userId,
      ...(status ? { status } : {})
    },
    include: {
      publishedQuest: {
        select: {
          id: true,
          title: true,
          category: true,
          platform: true,
          imageUrl: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function listAdminSponsorRequests(query: AdminSponsorRequestQuery) {
  const trimmedQuery = query.q?.trim();
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { title: stringContains(trimmedQuery) },
            { companyName: stringContains(trimmedQuery) },
            { contactName: stringContains(trimmedQuery) },
            { contactEmail: stringContains(trimmedQuery) },
            {
              submittedBy: {
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

  const total = await prisma.sponsorRequest.count({ where });
  const pagination = getPagination(total, query.page, query.pageSize);
  const items = await prisma.sponsorRequest.findMany({
    where,
    include: {
      submittedBy: {
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
      },
      publishedQuest: {
        select: {
          id: true,
          title: true,
          category: true,
          platform: true,
          imageUrl: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.pageSize
  });

  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    totalPages: pagination.totalPages
  };
}

export async function reviewSponsorRequest(input: ReviewSponsorRequestInput) {
  const request = await prisma.sponsorRequest.findUnique({
    where: { id: input.sponsorRequestId }
  });

  if (!request) {
    throw new ApiError(404, "Sponsor request not found");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Sponsor request already processed");
  }

  const reviewedAt = new Date();

  if (input.status === "rejected") {
    const rejected = await prisma.sponsorRequest.update({
      where: { id: request.id },
      data: {
        status: "rejected",
        reviewNote: input.reviewNote,
        reviewedAt,
        reviewedById: input.adminUserId
      }
    });

    await createNotification({
      userId: request.submittedById,
      type: "SPONSOR_REQUEST_REVIEWED",
      title: "Sponsor request rejected",
      message:
        input.reviewNote?.trim() ||
        `${request.title} was rejected during backoffice review. Update the concept and submit a new request.`,
      link: "/profile",
      metadata: {
        sponsorRequestId: request.id,
        status: "rejected"
      }
    });

    return rejected;
  }

  const accepted = await prisma.$transaction(async (tx) => {
    const quest = await tx.quest.create({
      data: {
        title: request.title,
        description: request.description,
        imageUrl: request.imageUrl ?? undefined,
        category: "SPONSORED",
        platform: request.platform ?? request.otherReason ?? formatSponsorCategory(request.category),
        link: request.landingUrl ?? undefined,
        requiresProof: true,
        proofInstructions:
          request.proofRequirements?.trim() ||
          "Submit proof that clearly confirms the sponsored action was completed.",
        xpReward: request.requestedXpReward,
        pointsReward: request.requestedPointsReward,
        maxCompletions: request.maxCompletions,
        minLevel: request.minLevel,
        active: true
      }
    });

    return tx.sponsorRequest.update({
      where: { id: request.id },
      data: {
        status: "accepted",
        reviewNote: input.reviewNote,
        reviewedAt,
        reviewedById: input.adminUserId,
        publishedQuestId: quest.id
      },
      include: {
        publishedQuest: true
      }
    });
  });

  await createNotification({
    userId: request.submittedById,
    type: "SPONSOR_REQUEST_REVIEWED",
    title: "Sponsor request accepted",
    message: `${request.title} was accepted and published to the platform as a sponsored quest.`,
    link: "/tasks",
    metadata: {
      sponsorRequestId: request.id,
      status: "accepted",
      publishedQuestId: accepted.publishedQuestId
    }
  });

  return accepted;
}

import type { Prisma, Redemption, Reward } from "@prisma/client";
import { ApiError } from "../utils/http";
import { daysBetween, hoursBetween } from "../utils/date";
import { decryptText, encryptText } from "../utils/crypto";
import { prisma } from "../utils/prisma";
import { createNotification, createNotificationForAdmins } from "./notification.service";
import { getPlatformConfig } from "./platformConfig.service";
import { getUserOrThrow } from "./user.service";

const REQUEST_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SECURE_VALUE_PLACEHOLDER = "Stored securely";
const EXPIRATION_SWEEP_INTERVAL_MS = 60_000;

let lastExpirationSweepAt = 0;
let expirationSweepPromise: Promise<number> | null = null;

type RewardPlan = {
  id: string;
  label: string;
  pointsCost: number;
  tndPrice?: number | null;
};

type RewardDeliveryFieldType = "TEXT" | "EMAIL" | "USERNAME" | "GAME_ID" | "SECRET" | "LINK";
type RewardDeliveryFieldRetention = "persistent" | "until_processed";

type RewardDeliveryField = {
  id: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  type?: RewardDeliveryFieldType;
  retention?: RewardDeliveryFieldRetention;
};

type RewardWithConfig = Reward & {
  plans?: Prisma.JsonValue | null;
  deliveryFields?: Prisma.JsonValue | null;
};

type RewardCatalogQuery = {
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

type RedemptionWithSecureInfo = Redemption & {
  requestedInfo?: Prisma.JsonValue | null;
  secureRequestedInfo?: Prisma.JsonValue | null;
};

type RedemptionWithReward = RedemptionWithSecureInfo & {
  reward: RewardWithConfig;
};

function getRewardPlans(reward: {
  id: string;
  pointsCost: number;
  tndPrice?: number | null;
  plans?: Prisma.JsonValue | null;
}): RewardPlan[] {
  const rawPlans = Array.isArray(reward.plans) ? reward.plans : [];
  const plans = rawPlans
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const plan = entry as Record<string, unknown>;
      if (typeof plan.id !== "string" || typeof plan.label !== "string" || typeof plan.pointsCost !== "number") {
        return null;
      }

      return {
        id: plan.id,
        label: plan.label,
        pointsCost: plan.pointsCost,
        tndPrice: typeof plan.tndPrice === "number" ? plan.tndPrice : undefined
      } satisfies RewardPlan;
    })
    .filter((plan) => plan !== null);

  if (plans.length > 0) {
    return plans;
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

function getDeliveryFields(reward: { deliveryFields?: Prisma.JsonValue | null }): RewardDeliveryField[] {
  const rawFields = Array.isArray(reward.deliveryFields) ? reward.deliveryFields : [];

  return rawFields
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const field = entry as Record<string, unknown>;
      if (typeof field.id !== "string" || typeof field.label !== "string") {
        return null;
      }

      const type =
        typeof field.type === "string" &&
        ["TEXT", "EMAIL", "USERNAME", "GAME_ID", "SECRET", "LINK"].includes(field.type)
          ? (field.type as RewardDeliveryFieldType)
          : "TEXT";
      const retention =
        typeof field.retention === "string" && ["persistent", "until_processed"].includes(field.retention)
          ? (field.retention as RewardDeliveryFieldRetention)
          : type === "SECRET"
            ? "until_processed"
            : "persistent";

      return {
        id: field.id,
        label: field.label,
        placeholder: typeof field.placeholder === "string" ? field.placeholder : undefined,
        required: typeof field.required === "boolean" ? field.required : true,
        type,
        retention
      } satisfies RewardDeliveryField;
    })
    .filter((field) => field !== null);
}

function getStartingPointsCost(reward: {
  id: string;
  pointsCost: number;
  tndPrice?: number | null;
  plans?: Prisma.JsonValue | null;
}) {
  return getRewardPlans(reward).reduce((lowest, plan) => Math.min(lowest, plan.pointsCost), reward.pointsCost);
}

function shouldStoreSecurely(field: RewardDeliveryField) {
  return field.type === "SECRET" || field.retention === "until_processed";
}

function shouldPurgeAfterProcessing(field: RewardDeliveryField) {
  return field.retention === "until_processed";
}

function parseInfoRecord(input: Prisma.JsonValue | null | undefined) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {} as Record<string, string>;
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
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
  query: RewardCatalogQuery
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

function validateRequestedFieldValue(field: RewardDeliveryField, value: string) {
  if (field.type === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new ApiError(400, `${field.label} must be a valid email address`);
  }

  if (field.type === "LINK") {
    try {
      const parsed = new URL(value);
      if (!/^https?:$/i.test(parsed.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch {
      throw new ApiError(400, `${field.label} must be a valid http(s) link`);
    }
  }
}

function buildRequestedInfoPayload(deliveryFields: RewardDeliveryField[], requestedInfo?: Record<string, string>) {
  const normalizedInfo = requestedInfo ?? {};
  const publicInfo: Record<string, string> = {};
  const secureInfo: Record<string, string> = {};

  for (const field of deliveryFields) {
    const value = normalizedInfo[field.id]?.trim();

    if ((field.required ?? true) && !value) {
      throw new ApiError(400, `${field.label} is required`);
    }

    if (!value) {
      continue;
    }

    validateRequestedFieldValue(field, value);

    if (shouldStoreSecurely(field)) {
      publicInfo[field.id] = SECURE_VALUE_PLACEHOLDER;
      secureInfo[field.id] = encryptText(value);
      continue;
    }

    publicInfo[field.id] = value;
  }

  return {
    requestedInfo: Object.keys(publicInfo).length > 0 ? publicInfo : undefined,
    secureRequestedInfo: Object.keys(secureInfo).length > 0 ? secureInfo : undefined
  };
}

function purgeProcessedRequestedInfo(
  reward: { deliveryFields?: Prisma.JsonValue | null },
  requestedInfo: Prisma.JsonValue | null | undefined,
  secureRequestedInfo: Prisma.JsonValue | null | undefined
) {
  const fieldsById = new Map(getDeliveryFields(reward).map((field) => [field.id, field]));
  const nextPublicInfo = { ...parseInfoRecord(requestedInfo) };
  const nextSecureInfo = { ...parseInfoRecord(secureRequestedInfo) };
  let purged = false;

  for (const [fieldId, field] of fieldsById.entries()) {
    if (!shouldPurgeAfterProcessing(field)) {
      continue;
    }

    if (fieldId in nextPublicInfo) {
      delete nextPublicInfo[fieldId];
      purged = true;
    }

    if (fieldId in nextSecureInfo) {
      delete nextSecureInfo[fieldId];
      purged = true;
    }
  }

  return {
    requestedInfo: Object.keys(nextPublicInfo).length > 0 ? nextPublicInfo : undefined,
    secureRequestedInfo: Object.keys(nextSecureInfo).length > 0 ? nextSecureInfo : undefined,
    purged
  };
}

function randomRequestCode(length = 12) {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += REQUEST_CODE_ALPHABET[Math.floor(Math.random() * REQUEST_CODE_ALPHABET.length)];
  }

  return code;
}

async function generateUniqueRequestCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const requestCode = randomRequestCode();
    const existing = await prisma.redemption.findFirst({
      where: { requestCode },
      select: { id: true }
    });

    if (!existing) {
      return requestCode;
    }
  }

  throw new ApiError(500, "Failed to generate request code");
}

function toUserFacingRedemption<T extends RedemptionWithSecureInfo>(redemption: T) {
  const { secureRequestedInfo: _secureRequestedInfo, ...safeRedemption } = redemption;
  return safeRedemption;
}

function withAdminVisibleRequestedInfo<T extends RedemptionWithSecureInfo>(redemption: T) {
  const publicInfo = parseInfoRecord(redemption.requestedInfo);
  const secureInfo = parseInfoRecord(redemption.secureRequestedInfo);

  for (const [key, value] of Object.entries(secureInfo)) {
    try {
      publicInfo[key] = decryptText(value);
    } catch {
      publicInfo[key] = SECURE_VALUE_PLACEHOLDER;
    }
  }

  const { secureRequestedInfo: _secureRequestedInfo, ...rest } = redemption;

  return {
    ...rest,
    requestedInfo: publicInfo
  };
}

async function reverseRedemption(
  redemption: RedemptionWithReward,
  status: "rejected" | "expired",
  reviewNote?: string,
  reviewedById?: string
) {
  const purgeResult = purgeProcessedRequestedInfo(
    redemption.reward,
    redemption.requestedInfo,
    redemption.secureRequestedInfo
  );

  await prisma.$transaction(async (tx) => {
    await tx.redemption.update({
      where: { id: redemption.id },
      data: {
        status,
        reviewNote,
        reviewedById,
        processedAt: new Date(),
        requestedInfo: purgeResult.requestedInfo,
        secureRequestedInfo: purgeResult.secureRequestedInfo,
        sensitiveInfoPurgedAt: purgeResult.purged ? new Date() : undefined
      }
    });

    await tx.user.update({
      where: { id: redemption.userId },
      data: {
        points: { increment: redemption.pointsSpent ?? redemption.reward.pointsCost }
      }
    });

    await tx.pointsTransaction.create({
      data: {
        userId: redemption.userId,
        amount: redemption.pointsSpent ?? redemption.reward.pointsCost,
        source: status === "expired" ? "REDEMPTION_EXPIRED_REFUND" : "REDEMPTION_REFUND"
      }
    });

    await tx.reward.update({
      where: { id: redemption.rewardId },
      data: {
        stock: { increment: 1 }
      }
    });
  });
}

export async function approveRedemption(
  redemption: RedemptionWithReward,
  reviewNote?: string,
  reviewedById?: string
) {
  const purgeResult = purgeProcessedRequestedInfo(
    redemption.reward,
    redemption.requestedInfo,
    redemption.secureRequestedInfo
  );

  await prisma.redemption.update({
    where: { id: redemption.id },
    data: {
      status: "approved",
      reviewNote,
      reviewedById,
      processedAt: new Date(),
      requestedInfo: purgeResult.requestedInfo,
      secureRequestedInfo: purgeResult.secureRequestedInfo,
      sensitiveInfoPurgedAt: purgeResult.purged ? new Date() : undefined
    }
  });
}

export async function rejectRedemption(
  redemption: RedemptionWithReward,
  reviewNote?: string,
  reviewedById?: string
) {
  await reverseRedemption(redemption, "rejected", reviewNote, reviewedById);
}

export async function expirePendingRedemptions() {
  const expired = await prisma.redemption.findMany({
    where: {
      status: "pending",
      expiresAt: { lte: new Date() }
    },
    include: {
      reward: true
    }
  });

  for (const redemption of expired) {
    await reverseRedemption(
      redemption,
      "expired",
      "Request expired before the Instagram handoff was completed."
    );

    await createNotification({
      userId: redemption.userId,
      type: "REDEMPTION_REVIEWED",
      title: "Request expired",
      message: `${redemption.reward.title} expired before the admin handoff. Your points were refunded automatically.`,
      link: `/requests/${redemption.id}`,
      metadata: {
        redemptionId: redemption.id,
        rewardId: redemption.rewardId,
        requestCode: redemption.requestCode,
        status: "expired"
      }
    });
  }

  return expired.length;
}

async function ensureExpiredRedemptionsAreFresh() {
  const now = Date.now();

  if (lastExpirationSweepAt && now - lastExpirationSweepAt < EXPIRATION_SWEEP_INTERVAL_MS) {
    return 0;
  }

  if (!expirationSweepPromise) {
    expirationSweepPromise = expirePendingRedemptions()
      .then((count) => {
        lastExpirationSweepAt = Date.now();
        return count;
      })
      .finally(() => {
        expirationSweepPromise = null;
      });
  }

  return expirationSweepPromise;
}

export async function listRewards() {
  await ensureExpiredRedemptionsAreFresh();

  return prisma.reward.findMany({
    where: { stock: { gt: 0 } },
    orderBy: [{ pointsCost: "asc" }]
  });
}

export async function listRewardCatalog(query: RewardCatalogQuery) {
  await ensureExpiredRedemptionsAreFresh();

  const trimmedQuery = query.q?.trim();
  const where: Prisma.RewardWhereInput = {
    stock: { gt: 0 },
    ...(trimmedQuery
      ? {
          OR: [
            { title: stringContains(trimmedQuery) },
            { description: stringContains(trimmedQuery) }
          ]
        }
      : {})
  };

  return createPaginatedResult(
    prisma.reward.count({ where }),
    (skip, take) =>
      prisma.reward.findMany({
        where,
        orderBy: [{ pointsCost: "asc" }, { createdAt: "desc" }],
        skip,
        take
      }),
    query
  );
}

export async function getRewardById(rewardId: string) {
  await ensureExpiredRedemptionsAreFresh();

  const reward = await prisma.reward.findUnique({
    where: { id: rewardId }
  });

  if (!reward) {
    throw new ApiError(404, "Reward not found");
  }

  return reward;
}

export async function listUserRedemptions(userId: string) {
  await ensureExpiredRedemptionsAreFresh();

  const redemptions = await prisma.redemption.findMany({
    where: { userId },
    include: {
      reward: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return redemptions.map((redemption) => toUserFacingRedemption(redemption));
}

export async function getUserRedemptionById(userId: string, redemptionId: string) {
  await ensureExpiredRedemptionsAreFresh();

  const redemption = await prisma.redemption.findFirst({
    where: {
      id: redemptionId,
      userId
    },
    include: {
      reward: true
    }
  });

  if (!redemption) {
    throw new ApiError(404, "Request not found");
  }

  return toUserFacingRedemption(redemption);
}

export async function redeemReward(
  userId: string,
  rewardId: string,
  planId?: string,
  requestedInfo?: Record<string, string>
) {
  await ensureExpiredRedemptionsAreFresh();

  const [user, reward, config] = await Promise.all([
    getUserOrThrow(userId),
    prisma.reward.findUnique({ where: { id: rewardId } }),
    getPlatformConfig()
  ]);

  if (!reward) {
    throw new ApiError(404, "Reward not found");
  }

  if (reward.stock <= 0) {
    throw new ApiError(400, "Reward out of stock");
  }

  if (user.level < reward.minLevel) {
    throw new ApiError(403, `Reward requires level ${reward.minLevel}`);
  }

  const accountAgeDays = daysBetween(new Date(), user.createdAt);
  if (accountAgeDays < reward.minAccountAge) {
    throw new ApiError(403, `Reward requires account age of ${reward.minAccountAge} days`);
  }

  const plans = getRewardPlans(reward);
  const selectedPlan = planId ? plans.find((plan) => plan.id === planId) : plans[0];

  if (!selectedPlan) {
    throw new ApiError(400, "Selected plan is invalid");
  }

  const pointsCost = selectedPlan.pointsCost ?? getStartingPointsCost(reward);

  if (user.points < pointsCost) {
    throw new ApiError(400, "Not enough points");
  }

  const latestRedemption = await prisma.redemption.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (latestRedemption && hoursBetween(new Date(), latestRedemption.createdAt) < config.redemptionCooldownHours) {
    throw new ApiError(429, `You can redeem only once every ${config.redemptionCooldownHours} hours`);
  }

  const deliveryFields = getDeliveryFields(reward);
  const requestedInfoPayload = buildRequestedInfoPayload(deliveryFields, requestedInfo);
  const requestCode = await generateUniqueRequestCode();
  const expiresAt = new Date(Date.now() + config.redemptionRequestExpiryHours * 60 * 60 * 1000);

  const redemption = await prisma.$transaction(async (tx) => {
    const created = await tx.redemption.create({
      data: {
        userId,
        rewardId,
        status: "pending",
        requestCode,
        planId: selectedPlan.id,
        planLabel: selectedPlan.label,
        pointsSpent: pointsCost,
        requestedInfo: requestedInfoPayload.requestedInfo,
        secureRequestedInfo: requestedInfoPayload.secureRequestedInfo,
        expiresAt
      },
      include: { reward: true }
    });

    await tx.pointsTransaction.create({
      data: {
        userId,
        amount: -pointsCost,
        source: "REDEMPTION"
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        points: { decrement: pointsCost }
      }
    });

    await tx.reward.update({
      where: { id: rewardId },
      data: {
        stock: { decrement: 1 }
      }
    });

    return created;
  });

  await createNotificationForAdmins({
    type: "ADMIN_REDEMPTION_REQUIRED",
    title: "Redemption review required",
    message: `${user.username} requested ${reward.title}${selectedPlan.label ? ` - ${selectedPlan.label}` : ""}. Code: ${requestCode}.`,
    link: `/backoffice/dashboard/redemptions?code=${encodeURIComponent(requestCode)}`,
    metadata: {
      redemptionId: redemption.id,
      rewardId: reward.id,
      userId: user.id,
      requestCode,
      planId: selectedPlan.id,
      planLabel: selectedPlan.label,
      requestedInfo: requestedInfoPayload.requestedInfo
    }
  });

  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Instagram request code ready",
    message: `Send code ${requestCode} to the official Arcetis Instagram. Do not give this code to anyone.`,
    link: `/requests/${redemption.id}`,
    metadata: {
      redemptionId: redemption.id,
      rewardId: reward.id,
      requestCode
    }
  });

  return toUserFacingRedemption(redemption);
}

export function materializeAdminRedemption<T extends RedemptionWithSecureInfo>(redemption: T) {
  return withAdminVisibleRequestedInfo(redemption);
}

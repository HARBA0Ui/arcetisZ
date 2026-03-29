import {
  GiveawayStatus,
  QuestCategory,
  QuestSubmissionStatus,
  RedemptionStatus,
  SponsorRequestCategory,
  SponsorRequestStatus
} from "@prisma/client";
import { z } from "zod";
import { env } from "../config/env";

const rewardDeliveryFieldTypeSchema = z.enum(["TEXT", "EMAIL", "USERNAME", "GAME_ID", "SECRET", "LINK"]);
const rewardDeliveryFieldRetentionSchema = z.enum(["persistent", "until_processed"]);
const giveawayFieldTypeSchema = z.enum(["TEXT", "EMAIL", "USERNAME", "GAME_ID", "LINK"]);

function isAllowedAbsoluteUrl(value: string) {
  try {
    const parsed = new URL(value);

    if (parsed.protocol === "https:") {
      return true;
    }

    return (
      env.NODE_ENV !== "production" &&
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

const externalUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => isAllowedAbsoluteUrl(value),
    "URL must use https in production or point to localhost during development"
  );

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(64),
  referralCode: z.string().min(4).max(20).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6).regex(/^\d{6}$/)
});

export const resendVerificationSchema = z.object({
  email: z.string().email()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16).max(256),
  password: z.string().min(8).max(64)
});

export const completeQuestSchema = z.object({
  questId: z.string().min(1)
});

export const submitQuestProofSchema = z.object({
  questId: z.string().min(1),
  proofUrl: externalUrlSchema.optional(),
  proofSecondaryUrl: externalUrlSchema.optional(),
  proofText: z.string().min(3).max(500).optional()
});

export const redeemRewardSchema = z.object({
  rewardId: z.string().min(1),
  planId: z.string().min(1).optional(),
  requestedInfo: z.record(z.string(), z.string().max(500)).optional()
});

export const useReferralSchema = z.object({
  referralCode: z.string().min(4).max(20)
});

export const updateUserSettingsSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(64).optional()
});

const rewardPlanSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(160),
  pointsCost: z.number().int().positive().max(100000),
  tndPrice: z.number().nonnegative().max(100000).optional()
});

const rewardDeliveryFieldSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  placeholder: z.string().max(160).optional(),
  required: z.boolean().optional(),
  type: rewardDeliveryFieldTypeSchema.optional(),
  retention: rewardDeliveryFieldRetentionSchema.optional()
});

const giveawayFieldSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  placeholder: z.string().max(160).optional(),
  required: z.boolean().optional(),
  type: giveawayFieldTypeSchema.optional()
});

const uploadImageUrlValueSchema = z
  .string()
  .refine(
    (value) => !value || value.startsWith("/uploads/") || isAllowedAbsoluteUrl(value),
    "imageUrl must be an https URL or /uploads path"
  );

const uploadImageUrlSchema = uploadImageUrlValueSchema.optional();

const giveawayJustificationImageSchema = z
  .array(uploadImageUrlValueSchema)
  .max(3)
  .optional();
export const createQuestSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(500),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.startsWith("/uploads/") || isAllowedAbsoluteUrl(value),
      "imageUrl must be an https URL or /uploads path"
    ),
  category: z.nativeEnum(QuestCategory),
  platform: z.string().max(100).optional(),
  link: externalUrlSchema.optional(),
  requiresProof: z.boolean().optional(),
  proofInstructions: z.string().max(500).optional(),
  xpReward: z.number().int().positive().max(500),
  pointsReward: z.number().int().positive().max(1000),
  maxCompletions: z.number().int().positive().max(100000).optional(),
  minLevel: z.number().int().min(1).max(100).optional()
});

export const createRewardSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(500),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.startsWith("/uploads/") || isAllowedAbsoluteUrl(value),
      "imageUrl must be an https URL or /uploads path"
    ),
  pointsCost: z.number().int().positive().max(100000),
  tndPrice: z.number().nonnegative().max(100000).optional(),
  plans: z.array(rewardPlanSchema).max(20).optional(),
  deliveryFields: z.array(rewardDeliveryFieldSchema).max(20).optional(),
  minLevel: z.number().int().min(1).max(100),
  minAccountAge: z.number().int().min(0).max(3650).optional(),
  stock: z.number().int().min(0).max(100000)
});

export const updateRewardSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(5).max(500).optional(),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.startsWith("/uploads/") || isAllowedAbsoluteUrl(value),
      "imageUrl must be an https URL or /uploads path"
    ),
  pointsCost: z.number().int().positive().max(100000).optional(),
  tndPrice: z.number().nonnegative().max(100000).optional(),
  plans: z.array(rewardPlanSchema).max(20).optional(),
  deliveryFields: z.array(rewardDeliveryFieldSchema).max(20).optional(),
  minLevel: z.number().int().min(1).max(100).optional(),
  minAccountAge: z.number().int().min(0).max(3650).optional(),
  stock: z.number().int().min(0).max(100000).optional()
});

export const updateQuestSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(5).max(500).optional(),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.startsWith("/uploads/") || isAllowedAbsoluteUrl(value),
      "imageUrl must be an https URL or /uploads path"
    ),
  platform: z.string().max(100).optional(),
  link: externalUrlSchema.optional(),
  requiresProof: z.boolean().optional(),
  proofInstructions: z.string().max(500).optional(),
  xpReward: z.number().int().positive().max(500).optional(),
  pointsReward: z.number().int().positive().max(1000).optional(),
  maxCompletions: z.number().int().positive().max(100000).optional(),
  minLevel: z.number().int().min(1).max(100).optional()
});

export const updateRedemptionSchema = z.object({
  status: z.enum([RedemptionStatus.approved, RedemptionStatus.rejected]),
  reviewNote: z.string().min(3).max(500).optional()
});

export const updatePlatformConfigSchema = z.object({
  maxXpPerDay: z.number().int().positive().max(10000).optional(),
  maxPointsPerDay: z.number().int().positive().max(10000).optional(),
  maxSocialTasksPerDay: z.number().int().positive().max(50).optional(),
  redemptionCooldownHours: z.number().int().positive().max(720).optional(),
  maxReferralsPerDay: z.number().int().positive().max(100).optional(),
  referralRewardLevel: z.number().int().min(1).max(50).optional(),
  referralPointsReward: z.number().int().min(0).max(10000).optional(),
  referralXpReward: z.number().int().min(0).max(10000).optional(),
  maxSponsorRequestsPerUser: z.number().int().min(1).max(25).optional(),
  sponsorRequestWindowDays: z.number().int().min(1).max(365).optional(),
  redemptionRequestExpiryHours: z.number().int().min(1).max(168).optional(),
  spinCooldownHours: z.number().int().min(1).max(168).optional(),
  spinMinLevel: z.number().int().min(1).max(100).optional(),
  spinItems: z
    .array(
      z.object({
        id: z.string().min(1).max(50),
        label: z.string().min(1).max(120),
        points: z.number().int().min(0).max(100000),
        xp: z.number().int().min(0).max(100000),
        weight: z.number().positive().max(100000),
        icon: z.string().max(50).optional()
      })
    )
    .min(2)
    .optional()
});

export const questsQuerySchema = z.object({
  category: z.nativeEnum(QuestCategory).optional()
});

export const rewardCatalogQuerySchema = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(9)
});

export const questSubmissionsQuerySchema = z.object({
  status: z.nativeEnum(QuestSubmissionStatus).optional()
});

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional()
});

export const reviewQuestSubmissionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().min(3).max(500).optional()
});

export const webhookSponsoredVerificationSchema = z.object({
  submissionId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
  externalReference: z.string().max(200).optional(),
  reviewNote: z.string().max(500).optional()
});

export const createAdminSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(64)
});

export const twoFactorCodeSchema = z.object({
  code: z.string().min(6).max(40)
});

export const adminCollectionQuerySchema = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10)
});

export const sponsorRequestsQuerySchema = z.object({
  status: z.nativeEnum(SponsorRequestStatus).optional()
});

export const adminRedemptionsQuerySchema = adminCollectionQuerySchema.extend({
  status: z.nativeEnum(RedemptionStatus).optional()
});

export const adminSponsorRequestsQuerySchema = adminCollectionQuerySchema.extend({
  status: z.nativeEnum(SponsorRequestStatus).optional()
});

export const createSponsorRequestSchema = z
  .object({
    companyName: z.string().min(2).max(120),
    contactName: z.string().min(2).max(120),
    contactEmail: z.string().email(),
    category: z.nativeEnum(SponsorRequestCategory),
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(800),
    imageUrl: z
      .string()
      .optional()
      .refine(
        (value) => !value || value.startsWith("/uploads/") || isAllowedAbsoluteUrl(value),
        "imageUrl must be an https URL or /uploads path"
      ),
    otherReason: z.string().min(3).max(200).optional(),
    platform: z.string().max(100).optional(),
    landingUrl: externalUrlSchema.optional(),
    proofRequirements: z.string().max(500).optional(),
    requestedXpReward: z.coerce.number().int().positive().max(500),
    requestedPointsReward: z.coerce.number().int().positive().max(1000),
    maxCompletions: z.coerce.number().int().positive().max(100000).optional(),
    minLevel: z.coerce.number().int().min(1).max(100).optional()
  })
  .superRefine((value, ctx) => {
    if (value.category === SponsorRequestCategory.CONTENT_CREATOR && !value.otherReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherReason"],
        message: "Please add a short reason for the Other category"
      });
    }
  });

export const createGiveawaySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(1200),
  prizeSummary: z.string().max(200).optional(),
  imageUrl: uploadImageUrlSchema,
  status: z.nativeEnum(GiveawayStatus).optional(),
  promoted: z.boolean().optional(),
  winnerCount: z.number().int().min(1).max(100).optional(),
  minLevel: z.number().int().min(1).max(100).optional(),
  minAccountAge: z.number().int().min(0).max(3650).optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  allowEntryEdits: z.boolean().optional(),
  inputFields: z.array(giveawayFieldSchema).max(8).optional(),
  requiresJustification: z.boolean().optional(),
  justificationLabel: z.string().max(160).optional(),
  endsAt: z.string().datetime().optional()
});

export const applyGiveawaySchema = z.object({
  answers: z.record(z.string(), z.string().max(500)).optional(),
  justification: z.string().min(3).max(1200).optional(),
  justificationImageUrls: giveawayJustificationImageSchema
});

export const reviewGiveawayEntrySchema = z.object({
  status: z.enum(["selected", "rejected"])
});

export const updateGiveawaySchema = z
  .object({
    status: z.nativeEnum(GiveawayStatus).optional(),
    durationDays: z.number().int().min(1).max(365).optional()
  })
  .refine((value) => typeof value.status !== "undefined" || typeof value.durationDays !== "undefined", {
    message: "At least one giveaway update is required"
  });

export const reviewSponsorRequestSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  reviewNote: z.string().min(3).max(500).optional()
});


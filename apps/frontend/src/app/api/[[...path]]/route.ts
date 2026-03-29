import { NextResponse, type NextRequest } from "next/server";
import {
  applyToGiveaway,
  createGiveaway,
  getAdminGiveawayById,
  getGiveawayById,
  listMyGiveawayEntries,
  listAdminGiveaways,
  listGiveaways,
  reviewGiveawayEntry,
  updateGiveaway,
  updateGiveawayEntry
} from "@/server/services/giveaway.service";
import {
  createAdminUser,
  createQuest,
  createReward,
  deleteReward,
  getAdminConfig,
  getAdminDashboardStats,
  getAdminQuestById,
  getAdminRewardById,
  getAdminUserStats,
  getAdminUsers,
  listAdminRewards,
  listRedemptions,
  patchAdminConfig,
  updateQuest,
  updateRedemptionStatus,
  updateReward
} from "@/server/services/admin.service";
import {
  getMe,
  loginUser,
  registerUser,
  requestFrontofficePasswordReset,
  resendFrontofficeVerificationEmail,
  resetFrontofficePassword,
  beginBackofficeTwoFactorSetup as beginTwoFactorSetup,
  disableBackofficeTwoFactor as disableTwoFactor,
  enableBackofficeTwoFactor as enableTwoFactor,
  getBackofficeTwoFactorStatus as getTwoFactorStatus,
  verifyBackofficeTwoFactor as verifyTwoFactor,
  verifyFrontofficeEmail
} from "@/server/services/auth.service";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "@/server/services/notification.service";
import {
  completeQuest,
  getManualSubmissions,
  getQuestById,
  getQuests,
  getUserQuestSubmissions,
  processSponsoredWebhookVerification,
  reviewManualSubmission,
  submitQuestProof
} from "@/server/services/quest.service";
import { getReferralStats, useReferralCode as applyReferralCode } from "@/server/services/referral.service";
import {
  getRewardById,
  getUserRedemptionById,
  listRewardCatalog,
  listRewards,
  listUserRedemptions,
  redeemReward
} from "@/server/services/reward.service";
import {
  createSponsorRequest,
  listAdminSponsorRequests,
  listUserSponsorRequests,
  reviewSponsorRequest
} from "@/server/services/sponsorRequest.service";
import { getSpinStatus, spinWheel } from "@/server/services/spin.service";
import {
  getLeaderboard,
  getUserOrThrow,
  getUserStats,
  sanitizeUser,
  updateUserSettings
} from "@/server/services/user.service";
import { env } from "@/server/config/env";
import {
  assertTrustedOrigin,
  getRequestOrigin,
  handleRouteError,
  parseJsonBody,
  parseQuery,
  requireAdmin,
  requireAuth
} from "@/server/api";
import { storeImage } from "@/server/storage";
import { ApiError } from "@/server/utils/http";
import {
  clearSessionCookie,
  clearTwoFactorChallengeCookie,
  getAuthScope,
  getTwoFactorChallengeTokenFromCookie,
  setSessionCookie,
  setTwoFactorChallengeCookie
} from "@/server/utils/auth-cookies";
import { assertThrottle, clearThrottle, registerFailedAttempt } from "@/server/services/authThrottle.service";
import {
  adminCollectionQuerySchema,
  adminRedemptionsQuerySchema,
  adminSponsorRequestsQuerySchema,
  applyGiveawaySchema,
  completeQuestSchema,
  createGiveawaySchema,
  createAdminSchema,
  createQuestSchema,
  createRewardSchema,
  createSponsorRequestSchema,
  forgotPasswordSchema,
  loginSchema,
  notificationsQuerySchema,
  questSubmissionsQuerySchema,
  questsQuerySchema,
  redeemRewardSchema,
  rewardCatalogQuerySchema,
  reviewGiveawayEntrySchema,
  registerSchema,
  resendVerificationSchema,
  reviewQuestSubmissionSchema,
  reviewSponsorRequestSchema,
  resetPasswordSchema,
  sponsorRequestsQuerySchema,
  submitQuestProofSchema,
  updateGiveawaySchema,
  updatePlatformConfigSchema,
  updateQuestSchema,
  updateRedemptionSchema,
  updateRewardSchema,
  updateUserSettingsSchema,
  useReferralSchema,
  verifyEmailSchema,
  webhookSponsoredVerificationSchema,
  twoFactorCodeSchema
} from "@/server/utils/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getFormFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : undefined;
}

function getFormFiles(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is File => value instanceof File && value.size > 0);
}

function parseJsonFormField<T>(formData: FormData, key: string, fallback: T) {
  const raw = getFormString(formData, key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError(400, `${key} is not valid JSON`);
  }
}

async function parseGiveawayApplyPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return parseJsonBody(request, applyGiveawaySchema);
  }

  const formData = await request.formData();
  const uploadedImageUrls = await Promise.all(
    getFormFiles(formData, "justificationImages")
      .slice(0, 3)
      .map((file) => storeImage(file, "giveaway-justification-images"))
  );
  const keptImageUrls = parseJsonFormField<string[]>(formData, "keptJustificationImageUrls", []);

  return applyGiveawaySchema.parse({
    answers: parseJsonFormField<Record<string, string>>(formData, "answers", {}),
    justification: getFormString(formData, "justification"),
    justificationImageUrls: [...keptImageUrls, ...uploadedImageUrls]
  });
}

function getRequestClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isAppSessionRoute(path: string[]) {
  return path[0] === "session" || path[0] === "auth";
}

async function handleGet(request: NextRequest, path: string[]) {
  if (path.length === 1 && path[0] === "health") {
    return NextResponse.json({ status: "ok", platform: "arcetis" });
  }

  if (isAppSessionRoute(path) && path[1] === "me" && path.length === 2) {
    const auth = requireAuth(request);
    const user = await getMe(auth.userId);
    return NextResponse.json({ user });
  }

  if (isAppSessionRoute(path) && path[1] === "2fa" && path[2] === "status" && path.length === 3) {
    const auth = await requireAdmin(request);
    const status = await getTwoFactorStatus(auth.userId);
    return NextResponse.json(status);
  }

  if (path[0] === "user" && path[1] === "profile" && path.length === 2) {
    const auth = requireAuth(request);
    const user = await getUserOrThrow(auth.userId);
    return NextResponse.json({ user: sanitizeUser(user) });
  }

  if (path[0] === "user" && path[1] === "stats" && path.length === 2) {
    const auth = requireAuth(request);
    const [userStats, leaderboard] = await Promise.all([
      getUserStats(auth.userId),
      getLeaderboard(10)
    ]);

    return NextResponse.json({ ...userStats, leaderboard });
  }

  if (path[0] === "quests" && path.length === 1) {
    const auth = requireAuth(request);
    const query = parseQuery(request, questsQuerySchema);
    const quests = await getQuests(query.category, auth.userId);
    return NextResponse.json({ quests });
  }

  if (path[0] === "quests" && path[1] === "submissions" && path.length === 2) {
    const auth = requireAuth(request);
    const query = parseQuery(request, questSubmissionsQuerySchema);
    const submissions = await getUserQuestSubmissions(auth.userId, query.status);
    return NextResponse.json({ submissions });
  }

  if (path[0] === "quests" && path.length === 2) {
    const auth = requireAuth(request);
    const quest = await getQuestById(path[1], auth.userId);
    return NextResponse.json({ quest });
  }

  if (path[0] === "rewards" && path.length === 1) {
    requireAuth(request);
    const rewards = await listRewards();
    return NextResponse.json({ rewards });
  }

  if (path[0] === "giveaways" && path.length === 1) {
    const auth = requireAuth(request);
    const giveaways = await listGiveaways(auth.userId);
    return NextResponse.json({ giveaways });
  }

  if (path[0] === "giveaways" && path[1] === "me" && path.length === 2) {
    const auth = requireAuth(request);
    const entries = await listMyGiveawayEntries(auth.userId);
    return NextResponse.json({ entries });
  }

  if (path[0] === "rewards" && path[1] === "catalog" && path.length === 2) {
    requireAuth(request);
    const query = parseQuery(request, rewardCatalogQuerySchema);
    const result = await listRewardCatalog(query);
    return NextResponse.json({
      rewards: result.items,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  }

  if (path[0] === "rewards" && path.length === 2) {
    requireAuth(request);
    const reward = await getRewardById(path[1]);
    return NextResponse.json({ reward });
  }

  if (path[0] === "giveaways" && path.length === 2) {
    const auth = requireAuth(request);
    const giveaway = await getGiveawayById(path[1], auth.userId);
    return NextResponse.json({ giveaway });
  }

  if (path[0] === "redemptions" && path.length === 1) {
    const auth = requireAuth(request);
    const redemptions = await listUserRedemptions(auth.userId);
    return NextResponse.json({ redemptions });
  }

  if (path[0] === "redemptions" && path.length === 2) {
    const auth = requireAuth(request);
    const redemption = await getUserRedemptionById(auth.userId, path[1]);
    return NextResponse.json({ redemption });
  }

  if (path[0] === "referral" && path[1] === "stats" && path.length === 2) {
    const auth = requireAuth(request);
    const result = await getReferralStats(auth.userId);
    return NextResponse.json(result);
  }

  if (path[0] === "spin" && path[1] === "status" && path.length === 2) {
    const auth = requireAuth(request);
    const status = await getSpinStatus(auth.userId);
    return NextResponse.json(status);
  }

  if (path[0] === "sponsor-requests" && path[1] === "me" && path.length === 2) {
    const auth = requireAuth(request);
    const query = parseQuery(request, sponsorRequestsQuerySchema);
    const requests = await listUserSponsorRequests(auth.userId, query.status);
    return NextResponse.json({ requests });
  }

  if (path[0] === "notifications" && path.length === 1) {
    const auth = requireAuth(request);
    const query = parseQuery(request, notificationsQuerySchema);
    const result = await listNotifications(auth.userId, query.limit);
    return NextResponse.json(result);
  }

  if (path[0] === "admin" && path[1] === "rewards" && path.length === 2) {
    await requireAdmin(request);
    const query = parseQuery(request, adminCollectionQuerySchema);
    const rewards = await listAdminRewards(query);
    return NextResponse.json({ rewards });
  }

  if (path[0] === "admin" && path[1] === "giveaways" && path.length === 2) {
    await requireAdmin(request);
    const query = parseQuery(request, adminCollectionQuerySchema);
    const giveaways = await listAdminGiveaways(query);
    return NextResponse.json({ giveaways });
  }

  if (path[0] === "admin" && path[1] === "dashboard" && path[2] === "stats" && path.length === 3) {
    await requireAdmin(request);
    const stats = await getAdminDashboardStats();
    return NextResponse.json({ stats });
  }

  if (path[0] === "admin" && path[1] === "quest" && path.length === 3) {
    await requireAdmin(request);
    const quest = await getAdminQuestById(path[2]);
    return NextResponse.json({ quest });
  }

  if (path[0] === "admin" && path[1] === "reward" && path.length === 3) {
    await requireAdmin(request);
    const reward = await getAdminRewardById(path[2]);
    return NextResponse.json({ reward });
  }

  if (path[0] === "admin" && path[1] === "giveaway" && path.length === 3) {
    await requireAdmin(request);
    const giveaway = await getAdminGiveawayById(path[2]);
    return NextResponse.json({ giveaway });
  }

  if (path[0] === "admin" && path[1] === "redemptions" && path.length === 2) {
    await requireAdmin(request);
    const query = parseQuery(request, adminRedemptionsQuerySchema);
    const redemptions = await listRedemptions(query);
    return NextResponse.json({ redemptions });
  }

  if (path[0] === "admin" && path[1] === "users" && path.length === 2) {
    await requireAdmin(request);
    const query = parseQuery(request, adminCollectionQuerySchema);
    const users = await getAdminUsers(query);
    return NextResponse.json({ users });
  }

  if (
    path[0] === "admin" &&
    path[1] === "users" &&
    path[3] === "stats" &&
    path.length === 4
  ) {
    await requireAdmin(request);
    const stats = await getAdminUserStats(path[2]);
    return NextResponse.json(stats);
  }

  if (path[0] === "admin" && path[1] === "config" && path.length === 2) {
    await requireAdmin(request);
    const config = await getAdminConfig();
    return NextResponse.json({ config });
  }

  if (path[0] === "admin" && path[1] === "quest-submissions" && path.length === 2) {
    await requireAdmin(request);
    const query = parseQuery(request, questSubmissionsQuerySchema);
    const submissions = await getManualSubmissions(query.status);
    return NextResponse.json({ submissions });
  }

  if (path[0] === "admin" && path[1] === "sponsor-requests" && path.length === 2) {
    await requireAdmin(request);
    const query = parseQuery(request, adminSponsorRequestsQuerySchema);
    const requests = await listAdminSponsorRequests(query);
    return NextResponse.json({ requests });
  }

  throw new ApiError(404, "Not found");
}

async function handlePost(request: NextRequest, path: string[]) {
  const isWebhookRequest = path[0] === "webhooks" && path[1] === "sponsored" && path[2] === "verify";

  if (!isWebhookRequest) {
    assertTrustedOrigin(request);
  }

  if (isAppSessionRoute(path) && path[1] === "register" && path.length === 2) {
    const scope = getAuthScope(request);
    if (scope !== "frontoffice") {
      throw new ApiError(403, "Backoffice accounts cannot be registered here");
    }

    const payload = await parseJsonBody(request, registerSchema);
    const ip = getRequestClientIp(request);
    const throttleKeys = [`auth:register:ip:${ip}`, `auth:register:email:${payload.email.toLowerCase().trim()}`];

    for (const key of throttleKeys) {
      await assertThrottle(key, {
        maxAttempts: 6,
        windowMinutes: 15,
        blockMinutes: 30
      });
    }

    try {
      const result = await registerUser({
        ...payload,
        appUrl: getRequestOrigin(request)
      });
      const response = NextResponse.json(result, { status: 201 });

      for (const key of throttleKeys) {
        await clearThrottle(key);
      }

      return response;
    } catch (error) {
      for (const key of throttleKeys) {
        await registerFailedAttempt(key, {
          maxAttempts: 6,
          windowMinutes: 15,
          blockMinutes: 30
        });
      }

      throw error;
    }
  }

  if (isAppSessionRoute(path) && path[1] === "verify-email" && path.length === 2) {
    const payload = await parseJsonBody(request, verifyEmailSchema);
    const ip = getRequestClientIp(request);
    const throttleKeys = [`auth:verify-email:ip:${ip}`, `auth:verify-email:email:${payload.email.toLowerCase().trim()}`];

    for (const key of throttleKeys) {
      await assertThrottle(key, {
        maxAttempts: 6,
        windowMinutes: 15,
        blockMinutes: 30
      });
    }

    try {
      const result = await verifyFrontofficeEmail(payload);
      const response = NextResponse.json({ user: result.user });

      setSessionCookie(response, request, "frontoffice", result.sessionToken);

      for (const key of throttleKeys) {
        await clearThrottle(key);
      }

      return response;
    } catch (error) {
      for (const key of throttleKeys) {
        await registerFailedAttempt(key, {
          maxAttempts: 6,
          windowMinutes: 15,
          blockMinutes: 30
        });
      }

      throw error;
    }
  }

  if (isAppSessionRoute(path) && path[1] === "resend-verification" && path.length === 2) {
    const payload = await parseJsonBody(request, resendVerificationSchema);
    const ip = getRequestClientIp(request);
    const throttleKeys = [`auth:resend-verification:ip:${ip}`, `auth:resend-verification:email:${payload.email.toLowerCase().trim()}`];

    for (const key of throttleKeys) {
      await assertThrottle(key, {
        maxAttempts: 5,
        windowMinutes: 15,
        blockMinutes: 30
      });
    }

    try {
      const result = await resendFrontofficeVerificationEmail({
        ...payload,
        appUrl: getRequestOrigin(request)
      });

      for (const key of throttleKeys) {
        await clearThrottle(key);
      }

      return NextResponse.json(result);
    } catch (error) {
      for (const key of throttleKeys) {
        await registerFailedAttempt(key, {
          maxAttempts: 5,
          windowMinutes: 15,
          blockMinutes: 30
        });
      }

      throw error;
    }
  }

  if (isAppSessionRoute(path) && path[1] === "forgot-password" && path.length === 2) {
    const payload = await parseJsonBody(request, forgotPasswordSchema);
    const ip = getRequestClientIp(request);
    const throttleKeys = [`auth:forgot-password:ip:${ip}`, `auth:forgot-password:email:${payload.email.toLowerCase().trim()}`];

    for (const key of throttleKeys) {
      await assertThrottle(key, {
        maxAttempts: 5,
        windowMinutes: 15,
        blockMinutes: 30
      });
    }

    try {
      const result = await requestFrontofficePasswordReset({
        ...payload,
        appUrl: getRequestOrigin(request)
      });

      for (const key of throttleKeys) {
        await clearThrottle(key);
      }

      return NextResponse.json(result);
    } catch (error) {
      for (const key of throttleKeys) {
        await registerFailedAttempt(key, {
          maxAttempts: 5,
          windowMinutes: 15,
          blockMinutes: 30
        });
      }

      throw error;
    }
  }

  if (isAppSessionRoute(path) && path[1] === "reset-password" && path.length === 2) {
    const payload = await parseJsonBody(request, resetPasswordSchema);
    const ip = getRequestClientIp(request);
    const throttleKeys = [`auth:reset-password:ip:${ip}`];

    for (const key of throttleKeys) {
      await assertThrottle(key, {
        maxAttempts: 5,
        windowMinutes: 30,
        blockMinutes: 30
      });
    }

    try {
      const result = await resetFrontofficePassword(payload);
      const response = NextResponse.json({ user: result.user });

      setSessionCookie(response, request, "frontoffice", result.sessionToken);

      for (const key of throttleKeys) {
        await clearThrottle(key);
      }

      return response;
    } catch (error) {
      for (const key of throttleKeys) {
        await registerFailedAttempt(key, {
          maxAttempts: 5,
          windowMinutes: 30,
          blockMinutes: 30
        });
      }

      throw error;
    }
  }

  if (isAppSessionRoute(path) && path[1] === "login" && path.length === 2) {
    const scope = getAuthScope(request);
    const payload = await parseJsonBody(request, loginSchema);
    const ip = getRequestClientIp(request);
    const throttleKeys = [`auth:login:ip:${ip}`, `auth:login:email:${payload.email.toLowerCase().trim()}`];

    for (const key of throttleKeys) {
      await assertThrottle(key, {
        maxAttempts: 5,
        windowMinutes: 15,
        blockMinutes: 30
      });
    }

    try {
      const result = await loginUser({
        ...payload,
        scope
      });

      for (const key of throttleKeys) {
        await clearThrottle(key);
      }

      if (result.requiresTwoFactor) {
        const response = NextResponse.json({
          requiresTwoFactor: true,
          user: result.user
        });

        setTwoFactorChallengeCookie(response, request, result.challengeToken);
        clearSessionCookie(response, request, "backoffice");
        return response;
      }

      if (result.requiresTwoFactorSetup) {
        const response = NextResponse.json({
          requiresTwoFactorSetup: true,
          user: result.user,
          setup: result.setup
        });

        setTwoFactorChallengeCookie(response, request, result.challengeToken);
        clearSessionCookie(response, request, "backoffice");
        return response;
      }

      const response = NextResponse.json({
        user: result.user,
        loginBonus: result.loginBonus
      });
      setSessionCookie(response, request, scope, result.sessionToken);
      clearTwoFactorChallengeCookie(response, request);
      return response;
    } catch (error) {
      for (const key of throttleKeys) {
        await registerFailedAttempt(key, {
          maxAttempts: 5,
          windowMinutes: 15,
          blockMinutes: 30
        });
      }

      throw error;
    }
  }

  if (isAppSessionRoute(path) && path[1] === "logout" && path.length === 2) {
    const scope = getAuthScope(request);
    const response = NextResponse.json({ ok: true });

    clearSessionCookie(response, request, scope);
    clearTwoFactorChallengeCookie(response, request);

    return response;
  }

  if (isAppSessionRoute(path) && path[1] === "2fa" && path[2] === "setup" && path.length === 3) {
    const auth = await requireAdmin(request);
    const setup = await beginTwoFactorSetup(auth.userId);
    return NextResponse.json(setup);
  }

  if (isAppSessionRoute(path) && path[1] === "2fa" && path[2] === "enable" && path.length === 3) {
    const auth = await requireAdmin(request);
    const payload = await parseJsonBody(request, twoFactorCodeSchema);
    const result = await enableTwoFactor(auth.userId, payload.code);
    return NextResponse.json(result);
  }

  if (isAppSessionRoute(path) && path[1] === "2fa" && path[2] === "disable" && path.length === 3) {
    const auth = await requireAdmin(request);
    const payload = await parseJsonBody(request, twoFactorCodeSchema);
    const result = await disableTwoFactor(auth.userId, payload.code);
    return NextResponse.json(result);
  }

  if (isAppSessionRoute(path) && path[1] === "2fa" && path[2] === "verify" && path.length === 3) {
    const payload = await parseJsonBody(request, twoFactorCodeSchema);
    const challengeToken = getTwoFactorChallengeTokenFromCookie(request);
    const ip = getRequestClientIp(request);
    const throttleKey = `auth:2fa:ip:${ip}`;

    if (!challengeToken) {
      throw new ApiError(401, "2FA challenge has expired");
    }

    await assertThrottle(throttleKey, {
      maxAttempts: 5,
      windowMinutes: 10,
      blockMinutes: 15
    });

    try {
      const result = await verifyTwoFactor(challengeToken, payload.code);
      const response = NextResponse.json({
        user: result.user,
        recoveryCodes: result.recoveryCodes
      });

      setSessionCookie(response, request, "backoffice", result.sessionToken);
      clearTwoFactorChallengeCookie(response, request);
      await clearThrottle(throttleKey);
      return response;
    } catch (error) {
      await registerFailedAttempt(throttleKey, {
        maxAttempts: 5,
        windowMinutes: 10,
        blockMinutes: 15
      });
      throw error;
    }
  }

  if (path[0] === "quests" && path[1] === "complete" && path.length === 2) {
    const auth = requireAuth(request);
    const payload = await parseJsonBody(request, completeQuestSchema);
    const result = await completeQuest(auth.userId, payload.questId);
    return NextResponse.json(result);
  }

  if (path[0] === "quests" && path[1] === "submit-proof" && path.length === 2) {
    const auth = requireAuth(request);
    const formData = await request.formData();
    const primaryProofFile = getFormFile(formData, "profileProof") ?? getFormFile(formData, "proof");
    const secondaryProofFile = getFormFile(formData, "followProof");
    const proofUrl = getFormString(formData, "proofUrl");
    const proofSecondaryUrl = getFormString(formData, "proofSecondaryUrl");
    const proofText = getFormString(formData, "proofText");
    const questId = getFormString(formData, "questId");

    const parsed = submitQuestProofSchema.parse({
      questId,
      proofUrl,
      proofSecondaryUrl,
      proofText
    });

    const submission = await submitQuestProof({
      userId: auth.userId,
      questId: parsed.questId,
      proofUrl: parsed.proofUrl ?? (primaryProofFile ? await storeImage(primaryProofFile, "quest-proofs") : undefined),
      proofSecondaryUrl:
        parsed.proofSecondaryUrl ??
        (secondaryProofFile ? await storeImage(secondaryProofFile, "quest-proofs") : undefined),
      proofText: parsed.proofText
    });

    return NextResponse.json({ submission }, { status: 201 });
  }

  if (path[0] === "rewards" && path[1] === "redeem" && path.length === 2) {
    const auth = requireAuth(request);
    const payload = await parseJsonBody(request, redeemRewardSchema);
    const redemption = await redeemReward(auth.userId, payload.rewardId, payload.planId, payload.requestedInfo);
    return NextResponse.json({ redemption }, { status: 201 });
  }

  if (path[0] === "giveaways" && path[2] === "apply" && path.length === 3) {
    const auth = requireAuth(request);
    const payload = await parseGiveawayApplyPayload(request);
    const ip = getRequestClientIp(request);
    const throttleKeys = [`giveaway:apply:user:${auth.userId}`, `giveaway:apply:ip:${ip}`];

    for (const key of throttleKeys) {
      await assertThrottle(key, {
        maxAttempts: 8,
        windowMinutes: 10,
        blockMinutes: 20
      });
    }

    try {
      const entry = await applyToGiveaway({
        userId: auth.userId,
        giveawayId: path[1],
        answers: payload.answers,
        justification: payload.justification,
        justificationImageUrls: payload.justificationImageUrls
      });

      for (const key of throttleKeys) {
        await clearThrottle(key);
      }

      return NextResponse.json({ entry }, { status: 201 });
    } catch (error) {
      for (const key of throttleKeys) {
        await registerFailedAttempt(key, {
          maxAttempts: 8,
          windowMinutes: 10,
          blockMinutes: 20
        });
      }

      throw error;
    }
  }

  if (path[0] === "referral" && path[1] === "use" && path.length === 2) {
    const auth = requireAuth(request);
    const payload = await parseJsonBody(request, useReferralSchema);
    const referral = await applyReferralCode(auth.userId, payload.referralCode);
    return NextResponse.json({ referral }, { status: 201 });
  }

  if (path[0] === "spin" && path[1] === "play" && path.length === 2) {
    const auth = requireAuth(request);
    const result = await spinWheel(auth.userId);
    return NextResponse.json(result);
  }

  if (path[0] === "sponsor-requests" && path.length === 1) {
    const auth = requireAuth(request);
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const image = getFormFile(formData, "image");
      const parsed = createSponsorRequestSchema.parse({
        companyName: getFormString(formData, "companyName"),
        contactName: getFormString(formData, "contactName"),
        contactEmail: getFormString(formData, "contactEmail"),
        category: getFormString(formData, "category"),
        title: getFormString(formData, "title"),
        description: getFormString(formData, "description"),
        imageUrl: image ? await storeImage(image, "sponsor-request-images") : undefined,
        otherReason: getFormString(formData, "otherReason"),
        platform: getFormString(formData, "platform"),
        landingUrl: getFormString(formData, "landingUrl"),
        proofRequirements: getFormString(formData, "proofRequirements"),
        requestedXpReward: getFormString(formData, "requestedXpReward"),
        requestedPointsReward: getFormString(formData, "requestedPointsReward"),
        maxCompletions: getFormString(formData, "maxCompletions"),
        minLevel: getFormString(formData, "minLevel")
      });

      const sponsorRequest = await createSponsorRequest({
        userId: auth.userId,
        ...parsed
      });

      return NextResponse.json({ request: sponsorRequest }, { status: 201 });
    }

    const payload = await parseJsonBody(request, createSponsorRequestSchema);
    const sponsorRequest = await createSponsorRequest({
      userId: auth.userId,
      ...payload
    });

    return NextResponse.json({ request: sponsorRequest }, { status: 201 });
  }

  if (path[0] === "admin" && path[1] === "quest" && path.length === 2) {
    await requireAdmin(request);
    const payload = await parseJsonBody(request, createQuestSchema);
    const quest = await createQuest(payload);
    return NextResponse.json({ quest }, { status: 201 });
  }

  if (path[0] === "admin" && path[1] === "upload" && path[2] === "quest-image" && path.length === 3) {
    await requireAdmin(request);
    const formData = await request.formData();
    const image = getFormFile(formData, "image");

    if (!image) {
      throw new ApiError(400, "Image file is required");
    }

    const imageUrl = await storeImage(image, "quest-images");
    return NextResponse.json({ imageUrl }, { status: 201 });
  }

  if (path[0] === "admin" && path[1] === "reward" && path.length === 2) {
    await requireAdmin(request);
    const payload = await parseJsonBody(request, createRewardSchema);
    const reward = await createReward(payload);
    return NextResponse.json({ reward }, { status: 201 });
  }

  if (path[0] === "admin" && path[1] === "giveaway" && path.length === 2) {
    await requireAdmin(request);
    const payload = await parseJsonBody(request, createGiveawaySchema);
    const giveaway = await createGiveaway(payload);
    return NextResponse.json({ giveaway }, { status: 201 });
  }

  if (path[0] === "admin" && path[1] === "upload" && path[2] === "giveaway-image" && path.length === 3) {
    await requireAdmin(request);
    const formData = await request.formData();
    const image = getFormFile(formData, "image");

    if (!image) {
      throw new ApiError(400, "Image file is required");
    }

    const imageUrl = await storeImage(image, "giveaway-images");
    return NextResponse.json({ imageUrl }, { status: 201 });
  }

  if (path[0] === "admin" && path[1] === "upload" && path[2] === "reward-image" && path.length === 3) {
    await requireAdmin(request);
    const formData = await request.formData();
    const image = getFormFile(formData, "image");

    if (!image) {
      throw new ApiError(400, "Image file is required");
    }

    const imageUrl = await storeImage(image, "reward-images");
    return NextResponse.json({ imageUrl }, { status: 201 });
  }

  if (path[0] === "admin" && path[1] === "users" && path[2] === "admin" && path.length === 3) {
    await requireAdmin(request);
    const payload = await parseJsonBody(request, createAdminSchema);
    const user = await createAdminUser(payload);
    return NextResponse.json({ user }, { status: 201 });
  }

  if (path[0] === "webhooks" && path[1] === "sponsored" && path[2] === "verify" && path.length === 3) {
    if (!env.WEBHOOK_SHARED_SECRET) {
      throw new ApiError(503, "Webhook secret is not configured");
    }

    const provided = request.headers.get("x-webhook-secret");

    if (!provided || provided !== env.WEBHOOK_SHARED_SECRET) {
      throw new ApiError(401, "Invalid webhook secret");
    }

    const payload = await parseJsonBody(request, webhookSponsoredVerificationSchema);
    const submission = await processSponsoredWebhookVerification({
      submissionId: payload.submissionId,
      status: payload.status,
      externalReference: payload.externalReference,
      reviewNote: payload.reviewNote,
      idempotent: true
    });

    return NextResponse.json({
      message: "Webhook processed",
      submission
    });
  }

  throw new ApiError(404, "Not found");
}

async function handlePatch(request: NextRequest, path: string[]) {
  assertTrustedOrigin(request);

  if (path[0] === "user" && path[1] === "settings" && path.length === 2) {
    const auth = requireAuth(request);
    const payload = await parseJsonBody(request, updateUserSettingsSchema);
    const user = await updateUserSettings({
      userId: auth.userId,
      ...payload
    });

    return NextResponse.json({ user });
  }

  if (path[0] === "notifications" && path[1] === "read-all" && path.length === 2) {
    const auth = requireAuth(request);
    const result = await markAllNotificationsRead(auth.userId);
    return NextResponse.json(result);
  }

  if (path[0] === "notifications" && path[2] === "read" && path.length === 3) {
    const auth = requireAuth(request);
    const result = await markNotificationRead(auth.userId, path[1]);
    return NextResponse.json(result);
  }

  if (path[0] === "admin" && path[1] === "reward" && path.length === 3) {
    await requireAdmin(request);
    const payload = await parseJsonBody(request, updateRewardSchema);
    const reward = await updateReward(path[2], payload);
    return NextResponse.json({ reward });
  }

  if (path[0] === "admin" && path[1] === "giveaway" && path.length === 3) {
    await requireAdmin(request);
    const payload = await parseJsonBody(request, updateGiveawaySchema);
    const giveaway = await updateGiveaway({
      giveawayId: path[2],
      ...payload
    });
    return NextResponse.json({ giveaway });
  }

  if (path[0] === "admin" && path[1] === "quest" && path.length === 3) {
    await requireAdmin(request);
    const payload = await parseJsonBody(request, updateQuestSchema);
    const quest = await updateQuest(path[2], payload);
    return NextResponse.json({ quest });
  }

  if (path[0] === "admin" && path[1] === "redemption" && path.length === 3) {
    const auth = await requireAdmin(request);
    const payload = await parseJsonBody(request, updateRedemptionSchema);
    const redemption = await updateRedemptionStatus(path[2], payload.status, payload.reviewNote, auth.userId);
    return NextResponse.json({ redemption });
  }

  if (path[0] === "admin" && path[1] === "config" && path.length === 2) {
    await requireAdmin(request);
    const payload = await parseJsonBody(request, updatePlatformConfigSchema);
    const config = await patchAdminConfig(payload);
    return NextResponse.json({ config });
  }

  if (path[0] === "admin" && path[1] === "quest-submission" && path.length === 3) {
    const auth = await requireAdmin(request);
    const payload = await parseJsonBody(request, reviewQuestSubmissionSchema);
    const submission = await reviewManualSubmission({
      submissionId: path[2],
      status: payload.status,
      reviewNote: payload.reviewNote,
      adminUserId: auth.userId
    });

    return NextResponse.json({ submission });
  }

  if (path[0] === "admin" && path[1] === "sponsor-request" && path.length === 3) {
    const auth = await requireAdmin(request);
    const payload = await parseJsonBody(request, reviewSponsorRequestSchema);
    const sponsorRequest = await reviewSponsorRequest({
      sponsorRequestId: path[2],
      adminUserId: auth.userId,
      status: payload.status,
      reviewNote: payload.reviewNote
    });

    return NextResponse.json({ request: sponsorRequest });
  }

  if (path[0] === "giveaways" && path[2] === "apply" && path.length === 3) {
    const auth = requireAuth(request);
    const payload = await parseGiveawayApplyPayload(request);
    const ip = getRequestClientIp(request);
    const throttleKeys = [`giveaway:apply:user:${auth.userId}`, `giveaway:apply:ip:${ip}`];

    for (const key of throttleKeys) {
      await assertThrottle(key, {
        maxAttempts: 10,
        windowMinutes: 10,
        blockMinutes: 20
      });
    }

    try {
      const entry = await updateGiveawayEntry({
        userId: auth.userId,
        giveawayId: path[1],
        answers: payload.answers,
        justification: payload.justification,
        justificationImageUrls: payload.justificationImageUrls
      });

      for (const key of throttleKeys) {
        await clearThrottle(key);
      }

      return NextResponse.json({ entry });
    } catch (error) {
      for (const key of throttleKeys) {
        await registerFailedAttempt(key, {
          maxAttempts: 10,
          windowMinutes: 10,
          blockMinutes: 20
        });
      }

      throw error;
    }
  }

  if (path[0] === "admin" && path[1] === "giveaway-entry" && path.length === 3) {
    const auth = await requireAdmin(request);
    const payload = await parseJsonBody(request, reviewGiveawayEntrySchema);
    const entry = await reviewGiveawayEntry({
      entryId: path[2],
      adminUserId: auth.userId,
      status: payload.status
    });
    return NextResponse.json({ entry });
  }

  throw new ApiError(404, "Not found");
}

async function handleDelete(request: NextRequest, path: string[]) {
  assertTrustedOrigin(request);

  if (path[0] === "admin" && path[1] === "reward" && path.length === 3) {
    await requireAdmin(request);
    await deleteReward(path[2]);
    return NextResponse.json({ ok: true });
  }

  throw new ApiError(404, "Not found");
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    return await handleGet(request, params.path ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    return await handlePost(request, params.path ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    return await handlePatch(request, params.path ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    return await handleDelete(request, params.path ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}


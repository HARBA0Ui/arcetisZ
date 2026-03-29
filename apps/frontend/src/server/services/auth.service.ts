import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/http";
import {
  createEmailVerificationCode,
  createPasswordResetToken,
  EMAIL_VERIFICATION_TTL_MINUTES,
  PASSWORD_RESET_TTL_MINUTES,
  hashAuthSecret
} from "../utils/auth-secrets";
import type { AuthScope } from "../utils/jwt";
import { signSessionToken, signTwoFactorChallenge, verifyTwoFactorChallengeToken } from "../utils/jwt";
import { verifyStoredPassword } from "../utils/password";
import { prisma } from "../utils/prisma";
import {
  sendBackofficeLoginCodeEmail,
  sendFrontofficeVerificationEmail,
  sendPasswordResetEmail
} from "./authEmail.service";
import { useReferralCode as applyReferralCode } from "./referral.service";
import { processLoginStreak } from "./dailyLogin.service";
import { sanitizeUser } from "./user.service";

const BACKOFFICE_LOGIN_CODE_TTL_MINUTES = 10;

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

function sanitizeUsernameSegment(value: string) {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

  return sanitized.length >= 3 ? sanitized : "";
}

function getGoogleUsernameCandidates(input: { name?: string | null; email: string }) {
  const emailPrefix = input.email.split("@")[0] ?? "arcetis_user";
  const base =
    sanitizeUsernameSegment(input.name ?? "") ||
    sanitizeUsernameSegment(emailPrefix) ||
    "arcetis_user";

  return [
    base,
    `${base}_${Math.floor(Math.random() * 10_000)}`.slice(0, 20),
    `user_${Math.floor(Math.random() * 1_000_000)}`.slice(0, 20)
  ];
}

async function generateUniqueUsername(input: { name?: string | null; email: string }) {
  const candidates = getGoogleUsernameCandidates(input);

  for (const candidate of candidates) {
    if (candidate.length < 3) {
      continue;
    }

    const exists = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true }
    });

    if (!exists) {
      return candidate;
    }
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const fallback = `user_${Math.floor(Math.random() * 1_000_000_000)}`.slice(0, 20);
    const exists = await prisma.user.findUnique({
      where: { username: fallback },
      select: { id: true }
    });

    if (!exists) {
      return fallback;
    }
  }

  throw new ApiError(500, "Failed to generate username");
}

function buildSessionToken(scope: AuthScope, user: { id: string; email: string; role: "USER" | "ADMIN" }) {
  return signSessionToken({
    scope,
    userId: user.id,
    email: user.email,
    role: user.role
  });
}

function buildChallengeToken(user: { id: string; email: string }, code: string) {
  return signTwoFactorChallenge({
    scope: "backoffice",
    userId: user.id,
    email: user.email,
    role: "ADMIN",
    codeHash: hashAuthSecret(code)
  });
}

function normalizePublicAppUrl(appUrl: string) {
  try {
    return new URL(appUrl).origin;
  } catch {
    throw new ApiError(400, "Invalid app URL");
  }
}

function buildAppUrl(appUrl: string, pathname: string, params?: Record<string, string | undefined>) {
  const url = new URL(pathname, normalizePublicAppUrl(appUrl));

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function issueFrontofficeVerificationCode(user: { id: string; email: string }, appUrl: string) {
  const code = createEmailVerificationCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCodeHash: hashAuthSecret(code),
      emailVerificationCodeExpiresAt: expiresAt,
      emailVerificationSentAt: now
    }
  });

  const delivery = await sendFrontofficeVerificationEmail({
    email: user.email,
    code,
    verifyUrl: buildAppUrl(appUrl, "/verify-email", { email: user.email })
  });

  return {
    verificationRequired: true as const,
    email: user.email,
    expiresInMinutes: EMAIL_VERIFICATION_TTL_MINUTES,
    delivery: delivery.delivery,
    previewCode: delivery.delivery === "preview" ? code : undefined
  };
}

async function issuePasswordResetLink(user: { id: string; email: string }, appUrl: string) {
  const token = createPasswordResetToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  const resetUrl = buildAppUrl(appUrl, "/reset-password", { token });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashAuthSecret(token),
      passwordResetExpiresAt: expiresAt,
      passwordResetRequestedAt: now
    }
  });

  const delivery = await sendPasswordResetEmail({
    email: user.email,
    resetUrl
  });

  return {
    ok: true as const,
    delivery: delivery.delivery,
    previewUrl: delivery.delivery === "preview" ? resetUrl : undefined
  };
}

async function issueBackofficeLoginCode(user: { id: string; email: string; role: "USER" | "ADMIN" }, appUrl: string) {
  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required");
  }

  const code = createEmailVerificationCode();
  const delivery = await sendBackofficeLoginCodeEmail({
    email: user.email,
    code,
    loginUrl: buildAppUrl(appUrl, "/backoffice/login")
  });

  return {
    requiresTwoFactor: true as const,
    challengeToken: buildChallengeToken(user, code),
    user: sanitizeUser(user),
    delivery: delivery.delivery,
    previewCode: delivery.delivery === "preview" ? code : undefined,
    expiresInMinutes: BACKOFFICE_LOGIN_CODE_TTL_MINUTES
  };
}

export async function registerUser(input: {
  email: string;
  username: string;
  password: string;
  referralCode?: string;
  appUrl: string;
}) {
  const email = input.email.toLowerCase().trim();
  const username = input.username.trim();
  const [existingByEmail, existingByUsername] = await Promise.all([
    prisma.user.findUnique({
      where: { email }
    }),
    prisma.user.findUnique({
      where: { username }
    })
  ]);

  const canReuseExistingEmail = Boolean(
    existingByEmail &&
      existingByEmail.role === "USER" &&
      !existingByEmail.emailVerifiedAt &&
      !existingByEmail.googleId
  );
  const hasEmailConflict = Boolean(existingByEmail && !canReuseExistingEmail);
  const hasUsernameConflict = Boolean(
    existingByUsername && (!canReuseExistingEmail || existingByUsername.id !== existingByEmail?.id)
  );

  if (hasEmailConflict && hasUsernameConflict) {
    throw new ApiError(409, "Email and username already in use");
  }

  if (hasEmailConflict) {
    throw new ApiError(409, "Email already in use");
  }

  if (hasUsernameConflict) {
    throw new ApiError(409, "Username already in use");
  }

  const password = await bcrypt.hash(input.password, 10);
  const user =
    canReuseExistingEmail && existingByEmail
      ? await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            username,
            password
          }
        })
      : await prisma.user.create({
          data: {
            email,
            username,
            password,
            referralCode: await generateUniqueReferralCode(),
            role: "USER"
          }
        });

  if (input.referralCode && !user.referredById) {
    try {
      await applyReferralCode(user.id, input.referralCode);
    } catch (error) {
      if (!existingByEmail) {
        await prisma.user.delete({ where: { id: user.id } });
      }

      throw error;
    }
  }

  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!freshUser || freshUser.role !== "USER") {
    throw new ApiError(404, "User not found");
  }

  return issueFrontofficeVerificationCode(freshUser, input.appUrl);
}

export async function loginUser(input: {
  email: string;
  password: string;
  scope: AuthScope;
  appUrl: string;
}) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const passwordCheck = await verifyStoredPassword(input.password, user.password);

  if (!passwordCheck.valid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (passwordCheck.upgradedHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordCheck.upgradedHash }
    });
  }

  if (input.scope === "backoffice" && user.role !== "ADMIN") {
    throw new ApiError(403, "This panel is only for admin accounts");
  }

  if (input.scope === "frontoffice" && !user.emailVerifiedAt) {
    throw new ApiError(403, "Email verification required");
  }

  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!freshUser) {
    throw new ApiError(404, "User not found");
  }

  if (input.scope === "backoffice") {
    return issueBackofficeLoginCode(freshUser, input.appUrl);
  }

  const streakResult = await processLoginStreak(user.id);
  const rewardedUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!rewardedUser) {
    throw new ApiError(404, "User not found");
  }

  return {
    requiresTwoFactor: false,
    sessionToken: buildSessionToken(input.scope, rewardedUser),
    user: sanitizeUser(rewardedUser),
    loginBonus: {
      awardedXp: streakResult.awardedXp,
      awardedPoints: streakResult.awardedPoints,
      streakUpdated: streakResult.streakUpdated
    }
  } as const;
}

export async function verifyBackofficeTwoFactor(challengeToken: string, code: string) {
  const challenge = verifyTwoFactorChallengeToken(challengeToken);
  const user = await prisma.user.findUnique({
    where: { id: challenge.userId }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required");
  }

  const normalizedCode = code.trim().replace(/\s+/g, "");
  if (hashAuthSecret(normalizedCode) !== challenge.codeHash) {
    throw new ApiError(401, "Invalid verification code");
  }

  return {
    sessionToken: buildSessionToken("backoffice", user),
    user: sanitizeUser(user)
  };
}

export async function resendBackofficeLoginCode(challengeToken: string, appUrl: string) {
  const challenge = verifyTwoFactorChallengeToken(challengeToken);
  const user = await prisma.user.findUnique({
    where: { id: challenge.userId }
  });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required");
  }

  return issueBackofficeLoginCode(user, appUrl);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
}

export async function verifyFrontofficeEmail(input: {
  email: string;
  code: string;
}) {
  const email = input.email.toLowerCase().trim();
  const code = input.code.trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "USER") {
    throw new ApiError(400, "Invalid email verification code");
  }

  if (!user.emailVerificationCodeHash || !user.emailVerificationCodeExpiresAt) {
    throw new ApiError(400, "Invalid email verification code");
  }

  if (user.emailVerificationCodeExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "Email verification code has expired");
  }

  if (hashAuthSecret(code) !== user.emailVerificationCodeHash) {
    throw new ApiError(400, "Invalid email verification code");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      emailVerificationCodeHash: null,
      emailVerificationCodeExpiresAt: null,
      emailVerificationSentAt: null
    }
  });

  return {
    sessionToken: buildSessionToken("frontoffice", updatedUser),
    user: sanitizeUser(updatedUser)
  };
}

export async function resendFrontofficeVerificationEmail(input: {
  email: string;
  appUrl: string;
}) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "USER" || user.emailVerifiedAt) {
    return { ok: true as const };
  }

  const result = await issueFrontofficeVerificationCode(user, input.appUrl);

  return {
    ok: true as const,
    delivery: result.delivery,
    previewCode: result.previewCode
  };
}

export async function requestFrontofficePasswordReset(input: {
  email: string;
  appUrl: string;
}) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "USER") {
    return { ok: true as const };
  }

  return issuePasswordResetLink(user, input.appUrl);
}

export async function resetFrontofficePassword(input: {
  token: string;
  password: string;
}) {
  const tokenHash = hashAuthSecret(input.token.trim());
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash
    }
  });

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "Password reset link is invalid or has expired");
  }

  const password = await bcrypt.hash(input.password, 10);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordResetRequestedAt: null,
      emailVerificationCodeHash: null,
      emailVerificationCodeExpiresAt: null,
      emailVerificationSentAt: null
    }
  });

  return {
    sessionToken: buildSessionToken("frontoffice", updatedUser),
    user: sanitizeUser(updatedUser)
  };
}

export async function loginWithGoogleUser(input: {
  email: string;
  name?: string | null;
  googleId: string;
}) {
  const email = input.email.toLowerCase().trim();

  const [byGoogleId, byEmail] = await Promise.all([
    prisma.user.findFirst({ where: { googleId: input.googleId } }),
    prisma.user.findUnique({ where: { email } })
  ]);

  if (byGoogleId && byEmail && byGoogleId.id !== byEmail.id) {
    throw new ApiError(409, "This Google account is already linked to another user");
  }

  if ((byGoogleId?.role ?? byEmail?.role) === "ADMIN") {
    throw new ApiError(403, "Google sign-in is not available for admin accounts");
  }

  let user = byGoogleId ?? byEmail;

  if (!user) {
    const username = await generateUniqueUsername({
      name: input.name,
      email
    });
    const referralCode = await generateUniqueReferralCode();
    const password = await bcrypt.hash(randomUUID(), 10);

    user = await prisma.user.create({
      data: {
        email,
        username,
        password,
        googleId: input.googleId,
        emailVerifiedAt: new Date(),
        referralCode,
        role: "USER"
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        googleId: input.googleId,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date()
      }
    });
  }

  const streakResult = await processLoginStreak(user.id);
  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!freshUser) {
    throw new ApiError(404, "User not found");
  }

  return {
    sessionToken: buildSessionToken("frontoffice", freshUser),
    user: sanitizeUser(freshUser),
    loginBonus: {
      awardedXp: streakResult.awardedXp,
      awardedPoints: streakResult.awardedPoints,
      streakUpdated: streakResult.streakUpdated
    }
  };
}


import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/http";

type ThrottleOptions = {
  maxAttempts: number;
  windowMinutes: number;
  blockMinutes: number;
};

async function getThrottleRecord(key: string) {
  return prisma.authThrottle.findUnique({
    where: { key }
  });
}

export async function assertThrottle(key: string, options: ThrottleOptions) {
  const now = new Date();
  const existing = await getThrottleRecord(key);

  if (!existing) {
    return;
  }

  if (existing.blockedUntil && existing.blockedUntil > now) {
    const retryAfterMinutes = Math.max(
      1,
      Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / (60 * 1000))
    );

    throw new ApiError(429, `Too many attempts. Try again in ${retryAfterMinutes} minute(s).`);
  }

  const windowMs = options.windowMinutes * 60 * 1000;
  if (now.getTime() - existing.windowStartedAt.getTime() > windowMs) {
    await prisma.authThrottle.update({
      where: { key },
      data: {
        attempts: 0,
        windowStartedAt: now,
        blockedUntil: null,
        lastAttemptAt: now
      }
    });
  }
}

export async function registerFailedAttempt(key: string, options: ThrottleOptions) {
  const now = new Date();
  const existing = await getThrottleRecord(key);
  const windowMs = options.windowMinutes * 60 * 1000;

  if (!existing) {
    await prisma.authThrottle.create({
      data: {
        key,
        attempts: 1,
        windowStartedAt: now,
        lastAttemptAt: now
      }
    });
    return;
  }

  const inWindow = now.getTime() - existing.windowStartedAt.getTime() <= windowMs;
  const nextAttempts = inWindow ? existing.attempts + 1 : 1;
  const shouldBlock = nextAttempts >= options.maxAttempts;

  await prisma.authThrottle.update({
    where: { key },
    data: {
      attempts: nextAttempts,
      windowStartedAt: inWindow ? existing.windowStartedAt : now,
      lastAttemptAt: now,
      blockedUntil: shouldBlock ? new Date(now.getTime() + options.blockMinutes * 60 * 1000) : null
    }
  });
}

export async function clearThrottle(key: string) {
  await prisma.authThrottle.deleteMany({
    where: { key }
  });
}

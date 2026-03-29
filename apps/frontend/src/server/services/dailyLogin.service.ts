import type { Quest } from "@prisma/client";
import {
  DAILY_LOGIN_POINTS_REWARD,
  DAILY_LOGIN_QUEST_TITLE,
  DAILY_LOGIN_XP_REWARD
} from "@/lib/quests";
import { dayBounds } from "../utils/date";
import { prisma } from "../utils/prisma";
import { awardProgress, getUserOrThrow } from "./user.service";

async function getDailyLoginQuest() {
  return prisma.quest.findFirst({
    where: {
      active: true,
      category: "DAILY",
      title: DAILY_LOGIN_QUEST_TITLE
    }
  });
}

async function syncDailyLoginQuest(quest: Quest, incrementCompletion: boolean) {
  await prisma.quest.update({
    where: { id: quest.id },
    data: {
      xpReward: DAILY_LOGIN_XP_REWARD,
      pointsReward: DAILY_LOGIN_POINTS_REWARD,
      ...(incrementCompletion ? { completions: { increment: 1 } } : {})
    }
  });
}

export async function claimDailyLogin(userId: string) {
  const user = await getUserOrThrow(userId);
  const now = new Date();
  const { start: todayStart, end: todayEnd } = dayBounds(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const quest = await getDailyLoginQuest();
  const alreadyCompletedToday = quest
    ? await prisma.questCompletion.findFirst({
        where: {
          userId,
          questId: quest.id,
          createdAt: { gte: todayStart, lt: todayEnd }
        }
      })
    : null;
  const loggedToday = !!user.lastLogin && user.lastLogin >= todayStart;
  const shouldIncrementStreak =
    !!user.lastLogin && user.lastLogin >= yesterdayStart && user.lastLogin < todayStart;

  let currentUser = user;

  if (!loggedToday) {
    currentUser = await prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: now,
        loginStreak: shouldIncrementStreak ? user.loginStreak + 1 : 1
      }
    });
  }

  if (quest && !alreadyCompletedToday) {
    await prisma.$transaction(async (tx) => {
      await tx.questCompletion.create({
        data: {
          userId,
          questId: quest.id
        }
      });

      await tx.quest.update({
        where: { id: quest.id },
        data: {
          xpReward: DAILY_LOGIN_XP_REWARD,
          pointsReward: DAILY_LOGIN_POINTS_REWARD,
          completions: { increment: 1 }
        }
      });
    });
  } else if (quest && (quest.xpReward !== DAILY_LOGIN_XP_REWARD || quest.pointsReward !== DAILY_LOGIN_POINTS_REWARD)) {
    await syncDailyLoginQuest(quest, false);
  }

  if (alreadyCompletedToday) {
    return {
      user: currentUser,
      quest,
      awardedXp: 0,
      awardedPoints: 0,
      streakUpdated: !loggedToday
    };
  }

  const rewardResult = await awardProgress({
    userId,
    xp: DAILY_LOGIN_XP_REWARD,
    points: DAILY_LOGIN_POINTS_REWARD,
    source: "DAILY_LOGIN",
    strictCaps: false,
    triggerReferralCheck: true
  });

  return {
    user: rewardResult.user,
    quest,
    awardedXp: rewardResult.awardedXp,
    awardedPoints: rewardResult.awardedPoints,
    streakUpdated: !loggedToday
  };
}

export async function processLoginStreak(userId: string) {
  return claimDailyLogin(userId);
}

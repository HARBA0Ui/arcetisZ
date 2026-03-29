import type { Quest, QuestCategory } from "@/lib/types";

export const DAILY_LOGIN_QUEST_TITLE = "Daily Login";
export const DAILY_LOGIN_XP_REWARD = 20;
export const DAILY_LOGIN_POINTS_REWARD = 20;

export function completedToday(lastCompletedAt?: string | null) {
  if (!lastCompletedAt) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(lastCompletedAt) >= today;
}

export function questNeedsProof(quest: {
  category: QuestCategory;
  platform?: string | null;
  requiresProof?: boolean;
}) {
  const isInstagramSocial =
    quest.category === "SOCIAL" && (quest.platform ?? "").toLowerCase().includes("instagram");

  return !!quest.requiresProof || quest.category === "SPONSORED" || isInstagramSocial;
}

export function isDailyLoginQuest(quest: Pick<Quest, "title" | "category">) {
  return quest.category === "DAILY" && quest.title === DAILY_LOGIN_QUEST_TITLE;
}

export function getQuestLastActivityAt(quest: Pick<Quest, "lastCompletedAt" | "latestSubmission">) {
  return quest.lastCompletedAt ?? quest.latestSubmission?.reviewedAt ?? quest.latestSubmission?.createdAt ?? null;
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import type {
  Giveaway,
  GiveawayDetails,
  GiveawayEntry,
  LeaderboardUser,
  NotificationsPayload,
  PaginatedResult,
  PlatformNotification,
  Quest,
  ReferralStats,
  Redemption,
  SponsorRequest,
  SponsorRequestStatus,
  QuestSubmission,
  QuestSubmissionStatus,
  Reward,
  SpinResult,
  SpinStatus,
  User
} from "@/lib/types";

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;
const notificationsQueryKey = ["notifications"] as const;
const userStatsQueryKey = ["user-stats"] as const;
const rewardsQueryKey = ["rewards"] as const;
const rewardsCatalogQueryPrefix = ["rewards-catalog"] as const;
const spinStatusQueryKey = ["spin-status"] as const;
const referralStatsQueryKey = ["referral-stats"] as const;
const sponsorRequestsQueryPrefix = ["sponsor-requests"] as const;
const questsQueryPrefix = ["quests"] as const;
const questSubmissionsQueryPrefix = ["quest-submissions"] as const;
const giveawaysQueryKey = ["giveaways"] as const;
const myGiveawaysQueryKey = ["my-giveaways"] as const;
const questByIdQueryKey = (questId: string) => ["quest", questId] as const;
const giveawayByIdQueryKey = (giveawayId: string) => ["giveaway", giveawayId] as const;
const questsQueryKey = (category?: string) =>
  (category ? [...questsQueryPrefix, category] : questsQueryPrefix) as readonly [string, ...string[]];
const questSubmissionsQueryKey = (status?: QuestSubmissionStatus) =>
  (status
    ? [...questSubmissionsQueryPrefix, status]
    : questSubmissionsQueryPrefix) as readonly [string, ...string[]];
const sponsorRequestsQueryKey = (status?: SponsorRequestStatus) =>
  (status
    ? [...sponsorRequestsQueryPrefix, status]
    : sponsorRequestsQueryPrefix) as readonly [string, ...string[]];
const rewardsCatalogQueryKey = (params: { q?: string; page: number; pageSize: number }) =>
  [...rewardsCatalogQueryPrefix, params.q ?? "", params.page, params.pageSize] as const;
const rewardByIdQueryKey = (rewardId: string) => ["reward", rewardId] as const;
const redemptionsQueryKey = ["redemptions"] as const;
const redemptionByIdQueryKey = (redemptionId: string) => ["redemption", redemptionId] as const;

async function fetchUserStats() {
  const response = await api.get<{
    user: User;
    level: number;
    currentLevelXp: number;
    nextLevelXp: number;
    progressInLevel: number;
    requiredForNext: number;
    dailyEarned: { xp: number; points: number };
    limits: { maxXpPerDay: number; maxPointsPerDay: number; maxSocialTasksPerDay: number };
    completedQuests: number;
    redemptions: number;
    leaderboardRank: number;
    leaderboard: LeaderboardUser[];
  }>("/user/stats");

  return response.data;
}

async function fetchQuests(category?: string) {
  const response = await api.get<{ quests: Quest[] }>("/quests", {
    params: category ? { category } : undefined
  });

  return response.data.quests;
}

async function fetchQuestById(questId: string) {
  const response = await api.get<{ quest: Quest }>(`/quests/${questId}`);
  return response.data.quest;
}

async function fetchRedemptionById(redemptionId: string) {
  const response = await api.get<{ redemption: Redemption }>(`/redemptions/${redemptionId}`);
  return response.data.redemption;
}

async function fetchRedemptions() {
  const response = await api.get<{ redemptions: Redemption[] }>("/redemptions");
  return response.data.redemptions;
}

async function fetchQuestSubmissions(status?: QuestSubmissionStatus) {
  const response = await api.get<{ submissions: QuestSubmission[] }>("/quests/submissions", {
    params: status ? { status } : undefined
  });

  return response.data.submissions;
}

async function fetchRewards() {
  const response = await api.get<{ rewards: Reward[] }>("/rewards");
  return response.data.rewards;
}

async function fetchRewardsCatalog(params: { q?: string; page: number; pageSize: number }) {
  const response = await api.get<{
    rewards: Reward[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>("/rewards/catalog", {
    params: {
      ...(params.q ? { q: params.q } : {}),
      page: params.page,
      pageSize: params.pageSize
    }
  });

  return {
    items: response.data.rewards,
    page: response.data.page,
    pageSize: response.data.pageSize,
    total: response.data.total,
    totalPages: response.data.totalPages
  } satisfies PaginatedResult<Reward>;
}

async function fetchSpinStatus() {
  const response = await api.get<SpinStatus>("/spin/status");
  return response.data;
}

async function fetchRewardById(rewardId: string) {
  const response = await api.get<{ reward: Reward }>(`/rewards/${rewardId}`);
  return response.data.reward;
}

async function fetchReferralStats() {
  const response = await api.get<ReferralStats>("/referral/stats");

  return response.data;
}

async function fetchNotifications() {
  const response = await api.get<NotificationsPayload>("/notifications");
  return response.data;
}

async function fetchSponsorRequests(status?: SponsorRequestStatus) {
  const response = await api.get<{ requests: SponsorRequest[] }>("/sponsor-requests/me", {
    params: status ? { status } : undefined
  });

  return response.data.requests;
}

async function fetchGiveaways() {
  const response = await api.get<{ giveaways: Giveaway[] }>("/giveaways");
  return response.data.giveaways;
}

async function fetchMyGiveaways() {
  const response = await api.get<{ entries: GiveawayEntry[] }>("/giveaways/me");
  return response.data.entries;
}

async function fetchGiveawayById(giveawayId: string) {
  const response = await api.get<{ giveaway: GiveawayDetails }>(`/giveaways/${giveawayId}`);
  return response.data.giveaway;
}

export function useUserStats() {
  const token = useAuthToken();

  return useQuery({
    queryKey: userStatsQueryKey,
    enabled: !!token,
    queryFn: fetchUserStats,
    staleTime: ONE_MINUTE
  });
}

export function useQuests(category?: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: questsQueryKey(category),
    enabled: !!token,
    queryFn: () => fetchQuests(category),
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useQuestById(questId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: questByIdQueryKey(questId),
    enabled: !!questId && !!token,
    queryFn: () => fetchQuestById(questId),
    staleTime: ONE_MINUTE,
    initialData: () => {
      const cachedLists = queryClient.getQueriesData<Quest[]>({
        queryKey: questsQueryPrefix
      });

      for (const [, quests] of cachedLists) {
        const match = quests?.find((quest) => quest.id === questId);
        if (match) {
          return match;
        }
      }

      return undefined;
    },
    initialDataUpdatedAt: () => {
      const cachedLists = queryClient.getQueriesData<Quest[]>({
        queryKey: questsQueryPrefix
      });

      for (const [key, quests] of cachedLists) {
        if (quests?.some((quest) => quest.id === questId)) {
          return queryClient.getQueryState(key)?.dataUpdatedAt;
        }
      }

      return undefined;
    }
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      const response = await api.post("/quests/complete", { questId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questsQueryPrefix });
      queryClient.invalidateQueries({ queryKey: ["quest"] });
      queryClient.invalidateQueries({ queryKey: userStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: spinStatusQueryKey });
      queryClient.invalidateQueries({ queryKey: referralStatsQueryKey });
    }
  });
}

export function useQuestSubmissions(status?: QuestSubmissionStatus) {
  const token = useAuthToken();

  return useQuery({
    queryKey: questSubmissionsQueryKey(status),
    enabled: !!token,
    queryFn: () => fetchQuestSubmissions(status),
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useSubmitQuestProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      questId: string;
      proofUrl?: string;
      proofSecondaryUrl?: string;
      proofText?: string;
      profileProofFile?: File;
      followProofFile?: File;
    }) => {
      const formData = new FormData();
      formData.append("questId", payload.questId);
      if (payload.proofUrl) formData.append("proofUrl", payload.proofUrl);
      if (payload.proofSecondaryUrl) formData.append("proofSecondaryUrl", payload.proofSecondaryUrl);
      if (payload.proofText) formData.append("proofText", payload.proofText);
      if (payload.profileProofFile) formData.append("profileProof", payload.profileProofFile);
      if (payload.followProofFile) formData.append("followProof", payload.followProofFile);

      const response = await api.post("/quests/submit-proof", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questsQueryPrefix });
      queryClient.invalidateQueries({ queryKey: ["quest"] });
      queryClient.invalidateQueries({ queryKey: questSubmissionsQueryPrefix });
    }
  });
}

export const useSubmitSponsoredQuest = useSubmitQuestProof;

export function useRewards() {
  const token = useAuthToken();

  return useQuery({
    queryKey: rewardsQueryKey,
    enabled: !!token,
    queryFn: fetchRewards,
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useGiveaways() {
  const token = useAuthToken();

  return useQuery({
    queryKey: giveawaysQueryKey,
    enabled: !!token,
    queryFn: fetchGiveaways,
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useMyGiveaways() {
  const token = useAuthToken();

  return useQuery({
    queryKey: myGiveawaysQueryKey,
    enabled: !!token,
    queryFn: fetchMyGiveaways,
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useGiveawayById(giveawayId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: giveawayByIdQueryKey(giveawayId),
    enabled: !!giveawayId && !!token,
    queryFn: () => fetchGiveawayById(giveawayId),
    staleTime: ONE_MINUTE,
    initialData: () =>
      queryClient.getQueryData<Giveaway[]>(giveawaysQueryKey)?.find((giveaway) => giveaway.id === giveawayId),
    initialDataUpdatedAt: () => queryClient.getQueryState(giveawaysQueryKey)?.dataUpdatedAt
  });
}

export function useApplyGiveaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      giveawayId: string;
      answers?: Record<string, string>;
      justification?: string;
      keptJustificationImageUrls?: string[];
      justificationImageFiles?: File[];
    }) => {
      const formData = new FormData();
      formData.append("answers", JSON.stringify(payload.answers ?? {}));
      formData.append("keptJustificationImageUrls", JSON.stringify(payload.keptJustificationImageUrls ?? []));

      if (payload.justification) {
        formData.append("justification", payload.justification);
      }

      for (const file of payload.justificationImageFiles ?? []) {
        formData.append("justificationImages", file);
      }

      const response = await api.post<{ entry: GiveawayEntry }>(`/giveaways/${payload.giveawayId}/apply`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data.entry;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: giveawaysQueryKey });
      queryClient.invalidateQueries({ queryKey: myGiveawaysQueryKey });
      queryClient.invalidateQueries({ queryKey: giveawayByIdQueryKey(variables.giveawayId) });
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    }
  });
}

export function useUpdateGiveawayEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      giveawayId: string;
      answers?: Record<string, string>;
      justification?: string;
      keptJustificationImageUrls?: string[];
      justificationImageFiles?: File[];
    }) => {
      const formData = new FormData();
      formData.append("answers", JSON.stringify(payload.answers ?? {}));
      formData.append("keptJustificationImageUrls", JSON.stringify(payload.keptJustificationImageUrls ?? []));

      if (payload.justification) {
        formData.append("justification", payload.justification);
      }

      for (const file of payload.justificationImageFiles ?? []) {
        formData.append("justificationImages", file);
      }

      const response = await api.patch<{ entry: GiveawayEntry }>(`/giveaways/${payload.giveawayId}/apply`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data.entry;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: giveawaysQueryKey });
      queryClient.invalidateQueries({ queryKey: myGiveawaysQueryKey });
      queryClient.invalidateQueries({ queryKey: giveawayByIdQueryKey(variables.giveawayId) });
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    }
  });
}

export function useRewardsCatalog(params: { q?: string; page: number; pageSize: number }) {
  const token = useAuthToken();

  return useQuery({
    queryKey: rewardsCatalogQueryKey(params),
    enabled: !!token,
    queryFn: () => fetchRewardsCatalog(params),
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useSpinStatus() {
  const token = useAuthToken();

  return useQuery({
    queryKey: spinStatusQueryKey,
    enabled: !!token,
    queryFn: fetchSpinStatus
  });
}

export function usePlaySpin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<SpinResult>("/spin/play");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spinStatusQueryKey });
      queryClient.invalidateQueries({ queryKey: userStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });
}

export function useRewardById(rewardId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: rewardByIdQueryKey(rewardId),
    enabled: !!rewardId && !!token,
    queryFn: () => fetchRewardById(rewardId),
    staleTime: ONE_MINUTE,
    initialData: () => {
      const rewards = queryClient.getQueryData<Reward[]>(rewardsQueryKey);
      const directMatch = rewards?.find((reward) => reward.id === rewardId);

      if (directMatch) {
        return directMatch;
      }

      const catalogQueries = queryClient.getQueriesData<PaginatedResult<Reward>>({
        queryKey: rewardsCatalogQueryPrefix
      });

      for (const [, page] of catalogQueries) {
        const match = page?.items.find((reward) => reward.id === rewardId);
        if (match) {
          return match;
        }
      }

      return undefined;
    },
    initialDataUpdatedAt: () => {
      const directState = queryClient.getQueryState(rewardsQueryKey)?.dataUpdatedAt;
      if (directState) {
        const rewards = queryClient.getQueryData<Reward[]>(rewardsQueryKey);
        if (rewards?.some((reward) => reward.id === rewardId)) {
          return directState;
        }
      }

      const catalogQueries = queryClient.getQueriesData<PaginatedResult<Reward>>({
        queryKey: rewardsCatalogQueryPrefix
      });

      for (const [key, page] of catalogQueries) {
        if (page?.items.some((reward) => reward.id === rewardId)) {
          return queryClient.getQueryState(key)?.dataUpdatedAt;
        }
      }

      return undefined;
    }
  });
}

export function useRedemptionById(redemptionId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: redemptionByIdQueryKey(redemptionId),
    enabled: !!redemptionId && !!token,
    queryFn: () => fetchRedemptionById(redemptionId),
    staleTime: ONE_MINUTE,
    initialData: () =>
      queryClient.getQueryData<Redemption[]>(redemptionsQueryKey)?.find((redemption) => redemption.id === redemptionId),
    initialDataUpdatedAt: () => queryClient.getQueryState(redemptionsQueryKey)?.dataUpdatedAt
  });
}

export function useRedemptions() {
  const token = useAuthToken();

  return useQuery({
    queryKey: redemptionsQueryKey,
    enabled: !!token,
    queryFn: fetchRedemptions,
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { rewardId: string; planId?: string; requestedInfo?: Record<string, string> }) => {
      const response = await api.post<{ redemption: Redemption }>("/rewards/redeem", payload);
      return response.data.redemption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardsQueryKey });
      queryClient.invalidateQueries({ queryKey: rewardsCatalogQueryPrefix });
      queryClient.invalidateQueries({ queryKey: redemptionsQueryKey });
      queryClient.invalidateQueries({ queryKey: userStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });
}

export function useReferralStats() {
  const token = useAuthToken();

  return useQuery({
    queryKey: referralStatsQueryKey,
    enabled: !!token,
    queryFn: fetchReferralStats,
    staleTime: ONE_MINUTE
  });
}

export function useSponsorRequests(status?: SponsorRequestStatus) {
  const token = useAuthToken();

  return useQuery({
    queryKey: sponsorRequestsQueryKey(status),
    enabled: !!token,
    queryFn: () => fetchSponsorRequests(status),
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useCreateSponsorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      companyName: string;
      contactName: string;
      contactEmail: string;
      category: SponsorRequest["category"];
      title: string;
      description: string;
      imageFile?: File;
      otherReason?: string;
      platform?: string;
      landingUrl?: string;
      proofRequirements?: string;
      requestedXpReward: number;
      requestedPointsReward: number;
      maxCompletions?: number;
      minLevel?: number;
    }) => {
      const formData = new FormData();
      formData.append("companyName", payload.companyName);
      formData.append("contactName", payload.contactName);
      formData.append("contactEmail", payload.contactEmail);
      formData.append("category", payload.category);
      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("requestedXpReward", String(payload.requestedXpReward));
      formData.append("requestedPointsReward", String(payload.requestedPointsReward));

      if (payload.imageFile) formData.append("image", payload.imageFile);
      if (payload.otherReason) formData.append("otherReason", payload.otherReason);
      if (payload.platform) formData.append("platform", payload.platform);
      if (payload.landingUrl) formData.append("landingUrl", payload.landingUrl);
      if (payload.proofRequirements) formData.append("proofRequirements", payload.proofRequirements);
      if (typeof payload.maxCompletions === "number") {
        formData.append("maxCompletions", String(payload.maxCompletions));
      }
      if (typeof payload.minLevel === "number") {
        formData.append("minLevel", String(payload.minLevel));
      }

      const response = await api.post<{ request: SponsorRequest }>("/sponsor-requests", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data.request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sponsorRequestsQueryPrefix });
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    }
  });
}

export function useUseReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referralCode: string) => {
      const response = await api.post("/referral/use", { referralCode });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: userStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  });
}

export function useNotifications() {
  const token = useAuthToken();

  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: fetchNotifications,
    enabled: !!token,
    staleTime: ONE_MINUTE
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch<{
        notification: PlatformNotification;
        unreadCount: number;
      }>(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    }
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch<{ unreadCount: number }>("/notifications/read-all");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    }
  });
}

export function useNotificationStream() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    let interval: number | null = null;

    const startPolling = () => {
      if (interval !== null || document.visibilityState !== "visible") {
        return;
      }

      interval = window.setInterval(() => {
        queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      }, ONE_MINUTE);
    };

    const stopPolling = () => {
      if (interval === null) {
        return;
      }

      window.clearInterval(interval);
      interval = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
        startPolling();
        return;
      }

      stopPolling();
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient, token]);
}


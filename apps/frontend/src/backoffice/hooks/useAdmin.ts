"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/backoffice/lib/api";
import type {
  AdminDashboardStats,
  AdminUserStats,
  Giveaway,
  GiveawayDetails,
  PaginatedResult,
  PlatformConfig,
  Quest,
  QuestDetails,
  SponsorRequest,
  SponsorRequestStatus,
  QuestSubmission,
  QuestSubmissionStatus,
  Redemption,
  RewardDetails,
  Reward,
  RewardDeliveryField,
  RewardPlan,
  User
} from "@/lib/types";

const ONE_MINUTE = 60 * 1000;

type AdminCollectionParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

type AdminSponsorRequestParams = AdminCollectionParams & {
  status?: SponsorRequestStatus;
};

type AdminRedemptionsParams = AdminCollectionParams & {
  status?: Redemption["status"];
};

function normalizeCollectionParams<T extends Record<string, unknown>>(params?: T) {
  const entries = Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== "");
  return Object.fromEntries(entries);
}

export function useAdminUsers(params: AdminCollectionParams = {}) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: async () => {
      const response = await api.get<{ users: PaginatedResult<User> }>("/admin/users", {
        params: normalizeCollectionParams(params)
      });
      return response.data.users;
    },
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useAdminRedemptions(params: AdminRedemptionsParams = {}) {
  return useQuery({
    queryKey: ["admin-redemptions", params],
    queryFn: async () => {
      const response = await api.get<{ redemptions: PaginatedResult<Redemption> }>("/admin/redemptions", {
        params: normalizeCollectionParams(params)
      });
      return response.data.redemptions;
    },
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const response = await api.get<{ stats: AdminDashboardStats }>("/admin/dashboard/stats");
      return response.data.stats;
    },
    staleTime: ONE_MINUTE
  });
}

export function useAdminQuestSubmissions(status?: QuestSubmissionStatus) {
  return useQuery({
    queryKey: ["admin-quest-submissions", status],
    queryFn: async () => {
      const response = await api.get<{ submissions: QuestSubmission[] }>("/admin/quest-submissions", {
        params: status ? { status } : undefined
      });
      return response.data.submissions;
    },
    staleTime: ONE_MINUTE
  });
}

export function useAdminSponsorRequests(params: AdminSponsorRequestParams = {}) {
  return useQuery({
    queryKey: ["admin-sponsor-requests", params],
    queryFn: async () => {
      const response = await api.get<{ requests: PaginatedResult<SponsorRequest> }>("/admin/sponsor-requests", {
        params: normalizeCollectionParams(params)
      });
      return response.data.requests;
    },
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useAdminConfig() {
  return useQuery({
    queryKey: ["admin-config"],
    queryFn: async () => {
      const response = await api.get<{ config: PlatformConfig }>("/admin/config");
      return response.data.config;
    },
    staleTime: ONE_MINUTE
  });
}

export function useQuests() {
  return useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const response = await api.get<{ quests: Quest[] }>("/quests");
      return response.data.quests;
    },
    staleTime: ONE_MINUTE
  });
}

export function useAdminQuestDetails(questId?: string) {
  return useQuery({
    queryKey: ["admin-quest-details", questId],
    queryFn: async () => {
      const response = await api.get<{ quest: QuestDetails }>(`/admin/quest/${questId}`);
      return response.data.quest;
    },
    enabled: !!questId,
    staleTime: ONE_MINUTE
  });
}

export function useRewards() {
  return useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const response = await api.get<{ rewards: Reward[] }>("/rewards");
      return response.data.rewards;
    },
    staleTime: ONE_MINUTE
  });
}

export function useAdminRewards(params: AdminCollectionParams = {}) {
  return useQuery({
    queryKey: ["admin-rewards", params],
    queryFn: async () => {
      const response = await api.get<{ rewards: PaginatedResult<Reward> }>("/admin/rewards", {
        params: normalizeCollectionParams(params)
      });
      return response.data.rewards;
    },
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useAdminGiveaways(params: AdminCollectionParams = {}) {
  return useQuery({
    queryKey: ["admin-giveaways", params],
    queryFn: async () => {
      const response = await api.get<{ giveaways: PaginatedResult<Giveaway> }>("/admin/giveaways", {
        params: normalizeCollectionParams(params)
      });
      return response.data.giveaways;
    },
    staleTime: ONE_MINUTE,
    placeholderData: (previousData) => previousData
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      imageUrl?: string;
      category: "DAILY" | "SOCIAL" | "SPONSORED";
      platform?: string;
      link?: string;
      requiresProof?: boolean;
      proofInstructions?: string;
      xpReward: number;
      pointsReward: number;
      maxCompletions?: number;
      minLevel?: number;
    }) => {
      const response = await api.post("/admin/quest", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    }
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      platform?: string;
      link?: string;
      requiresProof?: boolean;
      proofInstructions?: string;
      xpReward?: number;
      pointsReward?: number;
      maxCompletions?: number;
      minLevel?: number;
    }) => {
      const { id, ...data } = payload;
      const response = await api.patch(`/admin/quest/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["quest"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-quest-details", variables.id] });
    }
  });
}

export function useUploadQuestImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post<{ imageUrl: string }>("/admin/upload/quest-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      return response.data.imageUrl;
    }
  });
}

export function useUploadRewardImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post<{ imageUrl: string }>("/admin/upload/reward-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      return response.data.imageUrl;
    }
  });
}

export function useUploadGiveawayImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post<{ imageUrl: string }>("/admin/upload/giveaway-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      return response.data.imageUrl;
    }
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      imageUrl?: string;
      pointsCost: number;
      tndPrice?: number;
      plans?: RewardPlan[];
      deliveryFields?: RewardDeliveryField[];
      minLevel: number;
      minAccountAge?: number;
      stock: number;
    }) => {
      const response = await api.post<{ reward: Reward }>("/admin/reward", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    }
  });
}

export function useAdminRewardDetails(rewardId?: string) {
  return useQuery({
    queryKey: ["admin-reward-details", rewardId],
    queryFn: async () => {
      const response = await api.get<{ reward: RewardDetails }>(`/admin/reward/${rewardId}`);
      return response.data.reward;
    },
    enabled: !!rewardId,
    staleTime: ONE_MINUTE
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      pointsCost?: number;
      tndPrice?: number;
      plans?: RewardPlan[];
      deliveryFields?: RewardDeliveryField[];
      minLevel?: number;
      minAccountAge?: number;
      stock?: number;
    }) => {
      const { id, ...data } = payload;
      const response = await api.patch(`/admin/reward/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reward-details", variables.id] });
    }
  });
}

export function useCreateGiveaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      prizeSummary?: string;
      imageUrl?: string;
      status?: Giveaway["status"];
      promoted?: boolean;
      winnerCount?: number;
      minLevel?: number;
      minAccountAge?: number;
      durationDays?: number;
      allowEntryEdits?: boolean;
      inputFields?: Giveaway["inputFields"];
      requiresJustification?: boolean;
      justificationLabel?: string;
      endsAt?: string;
    }) => {
      const response = await api.post<{ giveaway: Giveaway }>("/admin/giveaway", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-giveaways"] });
    }
  });
}

export function useUpdateGiveaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; status?: Giveaway["status"]; durationDays?: number }) => {
      const response = await api.patch<{ giveaway: Giveaway }>(`/admin/giveaway/${payload.id}`, {
        status: payload.status,
        durationDays: payload.durationDays
      });
      return response.data.giveaway;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-giveaways"] });
      queryClient.invalidateQueries({ queryKey: ["admin-giveaway-details", data.id] });
    }
  });
}

export function useAdminGiveawayDetails(giveawayId?: string) {
  return useQuery({
    queryKey: ["admin-giveaway-details", giveawayId],
    queryFn: async () => {
      const response = await api.get<{ giveaway: GiveawayDetails }>(`/admin/giveaway/${giveawayId}`);
      return response.data.giveaway;
    },
    enabled: !!giveawayId,
    staleTime: ONE_MINUTE
  });
}

export function useReviewGiveawayEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; giveawayId: string; status: "selected" | "rejected" }) => {
      const response = await api.patch<{ entry: { id: string; autoClosed?: boolean } }>(
        `/admin/giveaway-entry/${payload.id}`,
        {
          status: payload.status
        }
      );
      return response.data.entry;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-giveaways"] });
      queryClient.invalidateQueries({ queryKey: ["admin-giveaway-details", variables.giveawayId] });
    }
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await api.delete(`/admin/reward/${rewardId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    }
  });
}

export function useAdminUserStats(userId?: string) {
  return useQuery({
    queryKey: ["admin-user-stats", userId],
    queryFn: async () => {
      const response = await api.get<AdminUserStats>(`/admin/users/${userId}/stats`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: ONE_MINUTE
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; username: string; password: string }) => {
      const response = await api.post<{ user: User }>("/admin/users/admin", payload);
      return response.data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    }
  });
}

export function useReviewQuestSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status: "approved" | "rejected";
      reviewNote?: string;
    }) => {
      const response = await api.patch(`/admin/quest-submission/${payload.id}`, {
        status: payload.status,
        reviewNote: payload.reviewNote
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quest-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    }
  });
}

export function useReviewSponsorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status: "accepted" | "rejected";
      reviewNote?: string;
    }) => {
      const response = await api.patch(`/admin/sponsor-request/${payload.id}`, {
        status: payload.status,
        reviewNote: payload.reviewNote
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sponsor-requests"] });
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    }
  });
}

export function useUpdateRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; status: "approved" | "rejected"; reviewNote?: string }) => {
      const response = await api.patch(`/admin/redemption/${payload.id}`, {
        status: payload.status,
        reviewNote: payload.reviewNote
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    }
  });
}

export function useUpdatePlatformConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<PlatformConfig>) => {
      const response = await api.patch("/admin/config", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-config"] });
    }
  });
}



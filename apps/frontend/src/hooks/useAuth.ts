"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { clearToken, getStoredUser, setPendingLevelUp, setStoredUser, setToken } from "@/lib/auth";
import { levelFromXp } from "@/lib/level";
import type { User } from "@/lib/types";
import { useAuthToken } from "@/hooks/use-auth-token";

type AuthResponse = {
  user: User;
  loginBonus?: {
    awardedXp: number;
    awardedPoints: number;
    streakUpdated: boolean;
  };
};

type RegisterResponse = {
  verificationRequired: true;
  email: string;
  expiresInMinutes: number;
  delivery: "smtp" | "preview";
  previewCode?: string;
};

type SimpleAuthMessage = {
  ok: true;
  delivery?: "smtp" | "preview";
  previewCode?: string;
  previewUrl?: string;
};

const meQueryKey = ["me"] as const;

async function requestLogout() {
  try {
    await fetch("/api/session/logout", {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: {
        "x-arcetis-auth-scope": "frontoffice"
      }
    });
  } catch {
    // Local session cleanup happens regardless of network state.
  }
}

function capturePendingLevelUp(data: AuthResponse) {
  if (!data.loginBonus?.awardedXp) {
    return;
  }

  const previousXp = Math.max(data.user.xp - data.loginBonus.awardedXp, 0);
  const previousLevel = levelFromXp(previousXp);

  if (data.user.level <= previousLevel) {
    return;
  }

  setPendingLevelUp({
    previousLevel,
    currentLevel: data.user.level,
    awardedXp: data.loginBonus.awardedXp,
    awardedPoints: data.loginBonus.awardedPoints,
    source: "daily-login"
  });
}

async function fetchCurrentUser() {
  const response = await api.get<{ user: User }>("/session/me");
  setStoredUser(response.data.user);
  return response.data.user;
}

export function useMe() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      return;
    }

    const storedUser = getStoredUser<User>();
    if (!storedUser) {
      return;
    }

    queryClient.setQueryData(meQueryKey, (current: User | undefined) => current ?? storedUser);
  }, [queryClient, token]);

  return useQuery({
    queryKey: meQueryKey,
    queryFn: fetchCurrentUser,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      username: string;
      password: string;
      referralCode?: string;
    }) => {
      const response = await api.post<RegisterResponse>("/session/register", payload);
      return response.data;
    }
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await api.post<AuthResponse>("/session/login", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setToken();
      setStoredUser(data.user);
      capturePendingLevelUp(data);
      queryClient.setQueryData(meQueryKey, data.user);
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    clearToken();
    queryClient.clear();
    await requestLogout();
  };
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; code: string }) => {
      const response = await api.post<AuthResponse>("/session/verify-email", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setToken();
      setStoredUser(data.user);
      queryClient.setQueryData(meQueryKey, data.user);
    }
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const response = await api.post<SimpleAuthMessage>("/session/resend-verification", payload);
      return response.data;
    }
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const response = await api.post<SimpleAuthMessage>("/session/forgot-password", payload);
      return response.data;
    }
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      const response = await api.post<AuthResponse>("/session/reset-password", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setToken();
      setStoredUser(data.user);
      queryClient.setQueryData(meQueryKey, data.user);
    }
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      email?: string;
      username?: string;
      currentPassword?: string;
      newPassword?: string;
    }) => {
      const response = await api.patch<{ user: User }>("/user/settings", payload);
      return response.data.user;
    },
    onSuccess: (user) => {
      setStoredUser(user);
      queryClient.setQueryData(meQueryKey, user);
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    }
  });
}

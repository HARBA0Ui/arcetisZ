"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/backoffice/lib/api";
import { clearToken, setToken } from "@/backoffice/lib/auth";
import { useBackofficeAuthToken } from "@/backoffice/hooks/use-auth-token";
import type { User } from "@/lib/types";

type AuthResponse = {
  user: User;
  requiresTwoFactor?: boolean;
  delivery?: "smtp" | "preview";
  previewCode?: string;
  expiresInMinutes?: number;
};

const adminMeQueryKey = ["backoffice-me"] as const;

async function requestLogout() {
  try {
    await fetch("/api/session/logout", {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: {
        "x-arcetis-auth-scope": "backoffice"
      }
    });
  } catch {
    // Local session cleanup happens regardless of network state.
  }
}

export function useMe() {
  const token = useBackofficeAuthToken();

  return useQuery({
    queryKey: adminMeQueryKey,
    queryFn: async () => {
      const response = await api.get<{ user: User }>("/session/me");
      return response.data.user;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false
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
      if (data.requiresTwoFactor) {
        clearToken();
        queryClient.removeQueries({ queryKey: adminMeQueryKey });
        return;
      }

      setToken();
      queryClient.setQueryData(adminMeQueryKey, data.user);
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

export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { code: string }) => {
      const response = await api.post<{ user: User }>("/session/2fa/verify", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setToken();
      queryClient.setQueryData(adminMeQueryKey, data.user);
    }
  });
}

export function useResendLoginCode() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{
        ok: true;
        delivery: "smtp" | "preview";
        previewCode?: string;
        expiresInMinutes?: number;
      }>("/session/2fa/resend");
      return response.data;
    }
  });
}

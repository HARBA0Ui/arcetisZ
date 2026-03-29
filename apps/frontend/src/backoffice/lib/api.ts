import axios from "axios";
import { clearToken } from "@/backoffice/lib/auth";
import { isArcetisSessionError } from "@/lib/session-errors";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "x-arcetis-auth-scope": "backoffice"
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && isSessionError(error)) {
      clearToken();
    }

    return Promise.reject(error);
  }
);

export function isSessionError(error: unknown, options?: { includeNotFound?: boolean }) {
  return isArcetisSessionError(error, options);
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }

  return "Something went wrong";
}

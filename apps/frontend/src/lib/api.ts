import axios from "axios";
import { clearToken } from "@/lib/auth";
import { isArcetisSessionError } from "@/lib/session-errors";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    "x-arcetis-auth-scope": "frontoffice"
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
    if (error.code === "ECONNABORTED") {
      return "This request took too long. Please try again.";
    }

    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }

  return "Something went wrong";
}

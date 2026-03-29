"use client";

import { useSyncExternalStore } from "react";
import { getToken } from "@/lib/auth";

const AUTH_CHANGE_EVENT = "arcetis-auth-change";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === "arcetis_session" || event.key === null) {
      callback();
    }
  };

  const handleAuthChange = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  };
}

export function useAuthToken() {
  return useSyncExternalStore(subscribe, getToken, () => null);
}

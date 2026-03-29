"use client";

import { useSyncExternalStore } from "react";
import { BACKOFFICE_AUTH_CHANGE_EVENT, getToken } from "@/backoffice/lib/auth";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === "arcetis_backoffice_session" || event.key === null) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(BACKOFFICE_AUTH_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(BACKOFFICE_AUTH_CHANGE_EVENT, callback);
  };
}

export function useBackofficeAuthToken() {
  return useSyncExternalStore(subscribe, getToken, () => null);
}

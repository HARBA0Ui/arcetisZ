"use client";

const SESSION_HINT_KEY = "arcetis_session";
const USER_KEY = "arcetis_user";
const LEVEL_UP_PENDING_KEY = "arcetis_level_up_pending";
const AUTH_CHANGE_EVENT = "arcetis-auth-change";

export type PendingLevelUp = {
  previousLevel: number;
  currentLevel: number;
  awardedXp: number;
  awardedPoints: number;
  source: "daily-login" | "quest" | "system";
};

function getStoredValue<T>(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function emitAuthChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_HINT_KEY);
}

export function setToken(_value = "1") {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_HINT_KEY, "1");
  emitAuthChange();
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_HINT_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(LEVEL_UP_PENDING_KEY);
  emitAuthChange();
}

export function getStoredUser<T>() {
  return getStoredValue<T>(USER_KEY);
}

export function setStoredUser<T>(user: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getPendingLevelUp() {
  return getStoredValue<PendingLevelUp>(LEVEL_UP_PENDING_KEY);
}

export function setPendingLevelUp(levelUp: PendingLevelUp) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LEVEL_UP_PENDING_KEY, JSON.stringify(levelUp));
}

export function clearPendingLevelUp() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LEVEL_UP_PENDING_KEY);
}

export const FRONTOFFICE_AUTH_CHANGE_EVENT = AUTH_CHANGE_EVENT;

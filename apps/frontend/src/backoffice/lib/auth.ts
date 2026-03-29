"use client";

const SESSION_HINT_KEY = "arcetis_backoffice_session";
const AUTH_CHANGE_EVENT = "arcetis-backoffice-auth-change";

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

  return window.sessionStorage.getItem(SESSION_HINT_KEY);
}

export function setToken(_value = "1") {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SESSION_HINT_KEY, "1");
  emitAuthChange();
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SESSION_HINT_KEY);
  emitAuthChange();
}

export const BACKOFFICE_AUTH_CHANGE_EVENT = AUTH_CHANGE_EVENT;

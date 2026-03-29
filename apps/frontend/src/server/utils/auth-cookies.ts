import type { NextRequest, NextResponse } from "next/server";
import type { AuthScope } from "./jwt";
import { env } from "../config/env";

export const FRONTOFFICE_SESSION_COOKIE = "arcetis_token";
export const BACKOFFICE_SESSION_COOKIE = "arcetis_backoffice_token";
export const BACKOFFICE_TWO_FACTOR_COOKIE = "arcetis_backoffice_2fa";

function isSecureRequest(request: NextRequest) {
  return (
    env.NODE_ENV === "production" ||
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

function getCookieName(scope: AuthScope) {
  return scope === "backoffice" ? BACKOFFICE_SESSION_COOKIE : FRONTOFFICE_SESSION_COOKIE;
}

function getSessionMaxAge(scope: AuthScope) {
  return scope === "backoffice" ? null : 60 * 60 * 24 * 7;
}

function getSessionSameSite(scope: AuthScope) {
  return scope === "backoffice" ? "strict" : "lax";
}

export function getAuthScope(request: NextRequest): AuthScope {
  const scopeHeader = request.headers.get("x-arcetis-auth-scope");
  return scopeHeader === "backoffice" ? "backoffice" : "frontoffice";
}

export function getSessionTokenFromCookie(request: NextRequest, scope: AuthScope) {
  return request.cookies.get(getCookieName(scope))?.value ?? null;
}

export function getTwoFactorChallengeTokenFromCookie(request: NextRequest) {
  return request.cookies.get(BACKOFFICE_TWO_FACTOR_COOKIE)?.value ?? null;
}

export function setSessionCookie(response: NextResponse, request: NextRequest, scope: AuthScope, token: string) {
  const maxAge = getSessionMaxAge(scope);

  response.cookies.set({
    name: getCookieName(scope),
    value: token,
    httpOnly: true,
    sameSite: getSessionSameSite(scope),
    secure: isSecureRequest(request),
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {})
  });
}

export function clearSessionCookie(response: NextResponse, request: NextRequest, scope: AuthScope) {
  response.cookies.set({
    name: getCookieName(scope),
    value: "",
    httpOnly: true,
    sameSite: getSessionSameSite(scope),
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0
  });
}

export function setTwoFactorChallengeCookie(response: NextResponse, request: NextRequest, token: string) {
  response.cookies.set({
    name: BACKOFFICE_TWO_FACTOR_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureRequest(request),
    path: "/backoffice",
    maxAge: 60 * 10
  });
}

export function clearTwoFactorChallengeCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set({
    name: BACKOFFICE_TWO_FACTOR_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureRequest(request),
    path: "/backoffice",
    maxAge: 0
  });
}

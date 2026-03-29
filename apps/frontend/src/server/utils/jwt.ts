import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AuthScope = "frontoffice" | "backoffice";

export type SessionTokenPayload = {
  type: "session";
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
  scope: AuthScope;
};

export type TwoFactorChallengePayload = {
  type: "two_factor";
  userId: string;
  email: string;
  role: "ADMIN";
  scope: "backoffice";
  codeHash: string;
};

export type ArcetisTokenPayload = SessionTokenPayload | TwoFactorChallengePayload;

export function signSessionToken(payload: Omit<SessionTokenPayload, "type">) {
  const expiresIn = payload.scope === "backoffice" ? "12h" : "7d";

  return jwt.sign(
    {
      ...payload,
      type: "session"
    } satisfies SessionTokenPayload,
    env.JWT_SECRET,
    { expiresIn }
  );
}

export function signTwoFactorChallenge(payload: Omit<TwoFactorChallengePayload, "type">) {
  return jwt.sign(
    {
      ...payload,
      type: "two_factor"
    } satisfies TwoFactorChallengePayload,
    env.JWT_SECRET,
    { expiresIn: "10m" }
  );
}

export function verifyToken(token: string): ArcetisTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as ArcetisTokenPayload;
}

export function verifySessionToken(token: string): SessionTokenPayload {
  const payload = verifyToken(token);

  if (payload.type !== "session") {
    throw new Error("Invalid session token");
  }

  return payload;
}

export function verifyTwoFactorChallengeToken(token: string): TwoFactorChallengePayload {
  const payload = verifyToken(token);

  if (payload.type !== "two_factor") {
    throw new Error("Invalid verification challenge token");
  }

  return payload;
}

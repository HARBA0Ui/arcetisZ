import { createHash, randomBytes } from "node:crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { env } from "../config/env";

function hashRecoveryCode(code: string, secret = env.APP_ENCRYPTION_SECRET) {
  return createHash("sha256")
    .update(`${secret}:${code.trim().toUpperCase()}`)
    .digest("hex");
}

function buildRecoveryCode() {
  return randomBytes(5).toString("hex").toUpperCase();
}

export function buildTwoFactorUri(email: string, secret: string) {
  return generateURI({
    issuer: "Arcetis Backoffice",
    label: email,
    secret
  });
}

export function generateTwoFactorSetup(email: string) {
  const secret = generateSecret();
  const otpauthUrl = buildTwoFactorUri(email, secret);

  return {
    secret,
    otpauthUrl
  };
}

export async function buildTwoFactorQrCode(otpauthUrl: string) {
  return QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 220
  });
}

export function verifyTwoFactorCode(secret: string, code: string) {
  return verifySync({
    token: code.trim().replace(/\s+/g, ""),
    secret,
    strategy: "totp",
    epochTolerance: 30
  }).valid;
}

export function generateRecoveryCodes(count = 8) {
  const plainCodes = Array.from({ length: count }, () => buildRecoveryCode());

  return {
    plainCodes,
    hashedCodes: plainCodes.map((code) => hashRecoveryCode(code))
  };
}

export function consumeRecoveryCode(codes: string[], candidate: string) {
  const hashedCandidate = hashRecoveryCode(candidate);
  const legacyHashedCandidate =
    env.APP_ENCRYPTION_SECRET === env.JWT_SECRET ? null : hashRecoveryCode(candidate, env.JWT_SECRET);
  const index = codes.findIndex((code) => code === hashedCandidate || code === legacyHashedCandidate);

  if (index === -1) {
    return null;
  }

  const nextCodes = [...codes];
  nextCodes.splice(index, 1);
  return nextCodes;
}

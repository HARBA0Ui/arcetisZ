import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env";

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function buildKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function getPrimaryKey() {
  return buildKey(env.APP_ENCRYPTION_SECRET);
}

function getLegacyKey() {
  if (env.APP_ENCRYPTION_SECRET === env.JWT_SECRET) {
    return null;
  }

  return buildKey(env.JWT_SECRET);
}

export function encryptText(value: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getPrimaryKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptText(value: string) {
  const payload = Buffer.from(value, "base64url");
  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + TAG_LENGTH);
  const primaryKey = getPrimaryKey();
  const legacyKey = getLegacyKey();

  try {
    const decipher = createDecipheriv("aes-256-gcm", primaryKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch (error) {
    if (!legacyKey) {
      throw error;
    }

    const decipher = createDecipheriv("aes-256-gcm", legacyKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }
}

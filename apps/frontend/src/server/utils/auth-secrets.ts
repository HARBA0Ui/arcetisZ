import { createHmac, randomBytes, randomInt } from "node:crypto";
import { env } from "../config/env";

export const EMAIL_VERIFICATION_CODE_LENGTH = 6;
export const EMAIL_VERIFICATION_TTL_MINUTES = 15;
export const PASSWORD_RESET_TTL_MINUTES = 60;

export function createEmailVerificationCode(length = EMAIL_VERIFICATION_CODE_LENGTH) {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += randomInt(0, 10).toString();
  }

  return code;
}

export function createPasswordResetToken(size = 32) {
  return randomBytes(size).toString("base64url");
}

export function hashAuthSecret(value: string) {
  return createHmac("sha256", env.APP_ENCRYPTION_SECRET).update(value).digest("hex");
}

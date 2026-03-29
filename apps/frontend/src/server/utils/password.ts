import bcrypt from "bcryptjs";

type PasswordVerificationResult = {
  valid: boolean;
  upgradedHash: string | null;
};

function isBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function verifyStoredPassword(inputPassword: string, storedPassword: string | null | undefined) {
  if (!storedPassword) {
    return {
      valid: false,
      upgradedHash: null
    } satisfies PasswordVerificationResult;
  }

  if (isBcryptHash(storedPassword)) {
    return {
      valid: await bcrypt.compare(inputPassword, storedPassword),
      upgradedHash: null
    } satisfies PasswordVerificationResult;
  }

  return {
    valid: false,
    upgradedHash: null
  } satisfies PasswordVerificationResult;
}

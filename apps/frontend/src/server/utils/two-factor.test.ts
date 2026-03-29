import { generateSync } from "otplib";
import {
  consumeRecoveryCode,
  generateRecoveryCodes,
  generateTwoFactorSetup,
  verifyTwoFactorCode
} from "./two-factor";

describe("two-factor helpers", () => {
  it("verifies a fresh TOTP code for a generated secret", () => {
    const setup = generateTwoFactorSetup("admin@example.com");
    const token = generateSync({
      secret: setup.secret,
      strategy: "totp"
    });

    expect(verifyTwoFactorCode(setup.secret, token)).toBe(true);
  });

  it("consumes recovery codes only once", () => {
    const recoveryCodes = generateRecoveryCodes(2);
    const remainingCodes = consumeRecoveryCode(recoveryCodes.hashedCodes, recoveryCodes.plainCodes[0]);

    expect(remainingCodes).toHaveLength(1);
    expect(consumeRecoveryCode(remainingCodes ?? [], recoveryCodes.plainCodes[0])).toBeNull();
  });
});

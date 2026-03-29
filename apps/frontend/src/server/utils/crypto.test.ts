import { decryptText, encryptText } from "./crypto";

describe("crypto helpers", () => {
  it("round-trips encrypted values", () => {
    const plaintext = "very-sensitive-value";
    const encrypted = encryptText(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(decryptText(encrypted)).toBe(plaintext);
  });

  it("generates different ciphertext for the same plaintext", () => {
    const plaintext = "repeatable";

    expect(encryptText(plaintext)).not.toBe(encryptText(plaintext));
  });
});

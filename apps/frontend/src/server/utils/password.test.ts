import bcrypt from "bcryptjs";
import { verifyStoredPassword } from "./password";

describe("password helpers", () => {
  it("verifies bcrypt password hashes without requesting an upgrade", async () => {
    const storedPassword = await bcrypt.hash("Kefta123", 10);
    const result = await verifyStoredPassword("Kefta123", storedPassword);

    expect(result.valid).toBe(true);
    expect(result.upgradedHash).toBeNull();
  });

  it("rejects legacy plain-text passwords", async () => {
    const result = await verifyStoredPassword("Kefta123", "Kefta123");

    expect(result.valid).toBe(false);
    expect(result.upgradedHash).toBeNull();
  });

  it("rejects invalid passwords", async () => {
    const result = await verifyStoredPassword("wrong-password", "Kefta123");

    expect(result.valid).toBe(false);
    expect(result.upgradedHash).toBeNull();
  });
});

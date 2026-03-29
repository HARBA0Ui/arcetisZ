import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

describe("authOptions", () => {
  afterEach(() => {
    restoreEnv();
    vi.resetModules();
  });

  it("does not fail auth boot when Cloudinary is partially configured outside production", async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "mongodb://localhost:27017/arcetis-test";
    process.env.JWT_SECRET = "arcetis-test-jwt-secret-key-123456";
    process.env.AUTH_SECRET = "arcetis-test-auth-secret-key-123456";
    process.env.APP_ENCRYPTION_SECRET = "arcetis-test-encryption-secret-123456";
    process.env.CLOUDINARY_CLOUD_NAME = "";
    process.env.CLOUDINARY_API_KEY = "cloudinary-key";
    process.env.CLOUDINARY_API_SECRET = "cloudinary-secret";
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    delete process.env.GOOGLE_ID;
    delete process.env.GOOGLE_SECRET;

    const authModule = await import("@/auth-options");

    expect(authModule.authOptions.secret).toBe(process.env.AUTH_SECRET);
    expect(authModule.authOptions.providers).toEqual([]);
  });

  it("still enforces complete Cloudinary config in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "mongodb://localhost:27017/arcetis-test";
    process.env.JWT_SECRET = "arcetis-production-jwt-secret-key-123456";
    process.env.AUTH_SECRET = "arcetis-production-auth-secret-key-123456";
    process.env.APP_ENCRYPTION_SECRET = "arcetis-production-encryption-secret-123456";
    process.env.CLOUDINARY_CLOUD_NAME = "";
    process.env.CLOUDINARY_API_KEY = "cloudinary-key";
    process.env.CLOUDINARY_API_SECRET = "cloudinary-secret";

    await expect(import("@/server/config/env").then(({ env }) => env.AUTH_SECRET)).rejects.toThrow(
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required in production"
    );
  });
});

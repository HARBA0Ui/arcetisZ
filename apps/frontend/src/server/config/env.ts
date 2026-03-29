import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  AUTH_SECRET: z.string().min(24, "AUTH_SECRET must be at least 24 characters"),
  APP_ENCRYPTION_SECRET: z.string().min(24, "APP_ENCRYPTION_SECRET must be at least 24 characters").optional(),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  WEBHOOK_SHARED_SECRET: z.string().min(24, "WEBHOOK_SHARED_SECRET must be at least 24 characters").optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional()
});

type RuntimeEnv = {
  NODE_ENV: "development" | "test" | "production";
  DATABASE_URL: string;
  JWT_SECRET: string;
  AUTH_SECRET: string;
  APP_ENCRYPTION_SECRET: string;
  NEXTAUTH_URL: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
  WEBHOOK_SHARED_SECRET: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
};

let cachedEnv: RuntimeEnv | null = null;

function isPlaceholderSecret(value: string) {
  return /change-me|example|replace-me|test-secret/i.test(value);
}

function resolveEnv(): RuntimeEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    APP_ENCRYPTION_SECRET: process.env.APP_ENCRYPTION_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_SECRET,
    WEBHOOK_SHARED_SECRET: process.env.WEBHOOK_SHARED_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
  });

  if (!parsed.success) {
    console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  const googleClientConfigured = Boolean(parsed.data.AUTH_GOOGLE_ID || parsed.data.AUTH_GOOGLE_SECRET);

  if (parsed.data.AUTH_GOOGLE_ID && !parsed.data.AUTH_GOOGLE_SECRET) {
    throw new Error("AUTH_GOOGLE_SECRET is required when AUTH_GOOGLE_ID is configured");
  }

  if (parsed.data.AUTH_GOOGLE_SECRET && !parsed.data.AUTH_GOOGLE_ID) {
    throw new Error("AUTH_GOOGLE_ID is required when AUTH_GOOGLE_SECRET is configured");
  }

  if (googleClientConfigured && !parsed.data.NEXTAUTH_URL) {
    throw new Error("NEXTAUTH_URL is required when Google auth is configured");
  }

  const smtpConfigured = Boolean(
    parsed.data.SMTP_HOST ||
      parsed.data.SMTP_PORT ||
      parsed.data.SMTP_FROM ||
      parsed.data.SMTP_USER ||
      parsed.data.SMTP_PASS
  );

  if (smtpConfigured) {
    if (!parsed.data.SMTP_HOST || !parsed.data.SMTP_PORT || !parsed.data.SMTP_FROM) {
      throw new Error("SMTP_HOST, SMTP_PORT, and SMTP_FROM must be set together for email delivery");
    }

    if (parsed.data.SMTP_USER && !parsed.data.SMTP_PASS) {
      throw new Error("SMTP_PASS is required when SMTP_USER is configured");
    }

    if (parsed.data.SMTP_PASS && !parsed.data.SMTP_USER) {
      throw new Error("SMTP_USER is required when SMTP_PASS is configured");
    }
  }

  if (parsed.data.NODE_ENV === "production") {
    const secretsToValidate = [
      ["JWT_SECRET", parsed.data.JWT_SECRET],
      ["AUTH_SECRET", parsed.data.AUTH_SECRET],
      ["APP_ENCRYPTION_SECRET", parsed.data.APP_ENCRYPTION_SECRET ?? ""]
    ] as const;

    for (const [name, value] of secretsToValidate) {
      if (!value || isPlaceholderSecret(value)) {
        throw new Error(`${name} must be set to a strong non-placeholder value in production`);
      }
    }

    if (parsed.data.WEBHOOK_SHARED_SECRET && isPlaceholderSecret(parsed.data.WEBHOOK_SHARED_SECRET)) {
      throw new Error("WEBHOOK_SHARED_SECRET must not use a placeholder value in production");
    }

    if (parsed.data.SMTP_PASS && isPlaceholderSecret(parsed.data.SMTP_PASS)) {
      throw new Error("SMTP_PASS must not use a placeholder value in production");
    }

    if (parsed.data.NEXTAUTH_URL && parsed.data.NEXTAUTH_URL.startsWith("http://")) {
      throw new Error("NEXTAUTH_URL must use https in production");
    }

    if (!parsed.data.CLOUDINARY_CLOUD_NAME || !parsed.data.CLOUDINARY_API_KEY || !parsed.data.CLOUDINARY_API_SECRET) {
      throw new Error(
        "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required in production"
      );
    }

    if (isPlaceholderSecret(parsed.data.CLOUDINARY_API_SECRET)) {
      throw new Error("CLOUDINARY_API_SECRET must be set to a strong non-placeholder value in production");
    }
  }

  cachedEnv = {
    ...parsed.data,
    APP_ENCRYPTION_SECRET: parsed.data.APP_ENCRYPTION_SECRET ?? parsed.data.JWT_SECRET,
    NEXTAUTH_URL: parsed.data.NEXTAUTH_URL ?? "",
    AUTH_GOOGLE_ID: parsed.data.AUTH_GOOGLE_ID ?? "",
    AUTH_GOOGLE_SECRET: parsed.data.AUTH_GOOGLE_SECRET ?? "",
    WEBHOOK_SHARED_SECRET: parsed.data.WEBHOOK_SHARED_SECRET ?? "",
    SMTP_HOST: parsed.data.SMTP_HOST ?? "",
    SMTP_PORT: parsed.data.SMTP_PORT ?? 0,
    SMTP_USER: parsed.data.SMTP_USER ?? "",
    SMTP_PASS: parsed.data.SMTP_PASS ?? "",
    SMTP_FROM: parsed.data.SMTP_FROM ?? "",
    CLOUDINARY_CLOUD_NAME: parsed.data.CLOUDINARY_CLOUD_NAME ?? "",
    CLOUDINARY_API_KEY: parsed.data.CLOUDINARY_API_KEY ?? "",
    CLOUDINARY_API_SECRET: parsed.data.CLOUDINARY_API_SECRET ?? ""
  };

  return cachedEnv;
}

export const env = new Proxy({} as RuntimeEnv, {
  get(_target, property: keyof RuntimeEnv) {
    return resolveEnv()[property];
  }
});

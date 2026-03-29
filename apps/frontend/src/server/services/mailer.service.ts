import nodemailer from "nodemailer";
import { env } from "@/server/config/env";
import { ApiError } from "@/server/utils/http";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  previewCode?: string;
  previewUrl?: string;
};

export type MailDeliveryResult =
  | {
      delivery: "preview";
      previewCode?: string;
      previewUrl?: string;
    }
  | {
      delivery: "smtp";
    };

let cachedTransporter: nodemailer.Transporter | null | undefined;

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);
}

function getTransporter() {
  if (!hasSmtpConfig()) {
    return null;
  }

  if (typeof cachedTransporter !== "undefined") {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });

  return cachedTransporter;
}

export async function sendMail(payload: MailPayload): Promise<MailDeliveryResult> {
  const transporter = getTransporter();

  if (!transporter) {
    if (env.NODE_ENV === "production") {
      throw new ApiError(503, "Email delivery is not configured");
    }

    console.info("[arcetis:mail-preview]", {
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      previewCode: payload.previewCode,
      previewUrl: payload.previewUrl
    });

    return {
      delivery: "preview",
      previewCode: payload.previewCode,
      previewUrl: payload.previewUrl
    };
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });

  return { delivery: "smtp" };
}

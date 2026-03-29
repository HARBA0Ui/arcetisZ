import { sendMail } from "./mailer.service";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendFrontofficeVerificationEmail(input: {
  email: string;
  code: string;
  verifyUrl: string;
}) {
  const code = escapeHtml(input.code);
  const verifyUrl = escapeHtml(input.verifyUrl);

  return sendMail({
    to: input.email,
    subject: "Verify your Arcetis account",
    text: [
      "Welcome to Arcetis.",
      "",
      `Your verification code is: ${input.code}`,
      "",
      `You can also open this link to verify your account: ${input.verifyUrl}`,
      "",
      "This code expires in 15 minutes."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
        <h2 style="margin-bottom:12px">Verify your Arcetis account</h2>
        <p style="line-height:1.6">Use this code to finish creating your account.</p>
        <div style="margin:24px 0;padding:18px 22px;border-radius:16px;background:#111827;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:0.35em;text-align:center">${code}</div>
        <p style="line-height:1.6">If you prefer, you can open the verification page directly:</p>
        <p><a href="${verifyUrl}" style="color:#ea580c;text-decoration:none;font-weight:600">Open verification page</a></p>
        <p style="line-height:1.6;color:#4b5563">This code expires in 15 minutes.</p>
      </div>
    `,
    previewCode: input.code,
    previewUrl: input.verifyUrl
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  resetUrl: string;
}) {
  const resetUrl = escapeHtml(input.resetUrl);

  return sendMail({
    to: input.email,
    subject: "Reset your Arcetis password",
    text: [
      "We received a request to reset your Arcetis password.",
      "",
      `Use this link to choose a new password: ${input.resetUrl}`,
      "",
      "This link expires in 60 minutes."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
        <h2 style="margin-bottom:12px">Reset your Arcetis password</h2>
        <p style="line-height:1.6">Use the button below to choose a new password.</p>
        <p style="margin:28px 0">
          <a href="${resetUrl}" style="display:inline-block;border-radius:999px;background:#111827;color:#ffffff;padding:14px 22px;text-decoration:none;font-weight:700">Reset password</a>
        </p>
        <p style="line-height:1.6;color:#4b5563">This link expires in 60 minutes.</p>
      </div>
    `,
    previewUrl: input.resetUrl
  });
}

export async function sendBackofficeLoginCodeEmail(input: {
  email: string;
  code: string;
  loginUrl: string;
}) {
  const code = escapeHtml(input.code);
  const loginUrl = escapeHtml(input.loginUrl);

  return sendMail({
    to: input.email,
    subject: "Your Arcetis admin sign-in code",
    text: [
      "Use this code to finish signing into Arcetis backoffice.",
      "",
      `Verification code: ${input.code}`,
      "",
      `Backoffice login: ${input.loginUrl}`,
      "",
      "This code expires in 10 minutes."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
        <h2 style="margin-bottom:12px">Arcetis admin sign-in</h2>
        <p style="line-height:1.6">Enter this code to complete your backoffice login.</p>
        <div style="margin:24px 0;padding:18px 22px;border-radius:16px;background:#111827;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:0.35em;text-align:center">${code}</div>
        <p style="line-height:1.6">Open backoffice if you need to re-enter it:</p>
        <p><a href="${loginUrl}" style="color:#ea580c;text-decoration:none;font-weight:600">Open backoffice login</a></p>
        <p style="line-height:1.6;color:#4b5563">This code expires in 10 minutes.</p>
      </div>
    `,
    previewCode: input.code,
    previewUrl: input.loginUrl
  });
}

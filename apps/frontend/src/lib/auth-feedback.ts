import axios from "axios";
import { getApiError } from "@/lib/api";

type FrontofficeLanguage = "en" | "ar";
type LoginScope = "frontoffice" | "backoffice";

function getStatus(error: unknown) {
  return axios.isAxiosError(error) ? (error.response?.status ?? 0) : 0;
}

function getMessage(error: unknown) {
  return axios.isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? "")
    : "";
}

export function isEmailVerificationRequiredError(error: unknown) {
  return getMessage(error) === "Email verification required";
}

export function getLoginErrorMessage(
  error: unknown,
  options?: { scope?: LoginScope; language?: FrontofficeLanguage }
) {
  const scope = options?.scope ?? "frontoffice";
  const language = options?.language ?? "en";
  const status = getStatus(error);
  const message = getMessage(error);

  if (message === "Invalid credentials" || status === 401) {
    return language === "ar"
      ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      : "The email or password is incorrect.";
  }

  if (message === "This panel is only for admin accounts") {
    return language === "ar"
      ? "هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم."
      : "This account does not have backoffice access.";
  }

  if (status === 429) {
    return language === "ar"
      ? "تمت محاولات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى."
      : "Too many sign-in attempts. Wait a bit and try again.";
  }

  if (scope === "backoffice" && status === 400) {
    return language === "ar"
      ? "تعذر تسجيل الدخول إلى لوحة التحكم. تحقق من بياناتك وحاول مرة أخرى."
      : "We couldn't sign you into backoffice. Check your details and try again.";
  }

  if (scope === "frontoffice" && status === 400) {
    return language === "ar"
      ? "تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور ثم حاول مرة أخرى."
      : "We couldn't sign you in. Check your email and password and try again.";
  }

  if (message === "Email verification required" || status === 403) {
    return language === "ar"
      ? "لا يمكنك تسجيل الدخول قبل تأكيد البريد الإلكتروني."
      : "You need to verify your email before signing in.";
  }

  return getApiError(error);
}

export function getRegisterErrorMessage(error: unknown, language: FrontofficeLanguage = "en") {
  const status = getStatus(error);
  const message = getMessage(error);

  if (message === "Email and username already in use") {
    return language === "ar"
      ? "البريد الإلكتروني واسم المستخدم مستخدمان بالفعل."
      : "That email and username are already in use.";
  }

  if (message === "Email already in use") {
    return language === "ar" ? "هذا البريد الإلكتروني مستخدم بالفعل." : "That email is already in use.";
  }

  if (message === "Username already in use") {
    return language === "ar" ? "اسم المستخدم هذا مستخدم بالفعل." : "That username is already in use.";
  }

  if (message === "Email or username already in use" || status === 409) {
    return language === "ar"
      ? "البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل."
      : "That email or username is already in use.";
  }

  if (message === "Referral code not found") {
    return language === "ar" ? "كود الإحالة غير موجود." : "That referral code was not found.";
  }

  if (message === "Referral code already used") {
    return language === "ar"
      ? "تم استخدام كود إحالة لهذا الحساب بالفعل."
      : "This account already used a referral code.";
  }

  if (message === "You cannot use your own referral code") {
    return language === "ar" ? "لا يمكنك استخدام كود الإحالة الخاص بك." : "You cannot use your own referral code.";
  }

  if (status === 429) {
    return language === "ar"
      ? "تمت محاولات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى."
      : "Too many registration attempts. Wait a bit and try again.";
  }

  if (status === 400) {
    return language === "ar"
      ? "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى."
      : "We couldn't create your account. Check your details and try again.";
  }

  return getApiError(error);
}

export function getEmailVerificationErrorMessage(error: unknown, language: FrontofficeLanguage = "en") {
  const status = getStatus(error);
  const message = getMessage(error);

  if (message === "Invalid email verification code") {
    return language === "ar" ? "رمز التحقق غير صحيح." : "That verification code is incorrect.";
  }

  if (message === "Email verification code has expired") {
    return language === "ar"
      ? "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا."
      : "That verification code expired. Request a new one.";
  }

  if (status === 429) {
    return language === "ar"
      ? "تمت محاولات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى."
      : "Too many verification attempts. Wait a bit and try again.";
  }

  if (status === 400) {
    return language === "ar"
      ? "تعذر تأكيد البريد الإلكتروني. تحقق من الرمز ثم حاول مرة أخرى."
      : "We couldn't verify that email. Check the code and try again.";
  }

  return getApiError(error);
}

export function getForgotPasswordErrorMessage(error: unknown, language: FrontofficeLanguage = "en") {
  const status = getStatus(error);

  if (status === 429) {
    return language === "ar"
      ? "تمت طلبات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى."
      : "Too many reset requests. Wait a bit and try again.";
  }

  return getApiError(error);
}

export function getResetPasswordErrorMessage(error: unknown, language: FrontofficeLanguage = "en") {
  const status = getStatus(error);
  const message = getMessage(error);

  if (message === "Password reset link is invalid or has expired" || status === 400) {
    return language === "ar"
      ? "رابط إعادة التعيين غير صالح أو انتهت صلاحيته."
      : "That password reset link is invalid or has expired.";
  }

  if (status === 429) {
    return language === "ar"
      ? "تمت محاولات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى."
      : "Too many reset attempts. Wait a bit and try again.";
  }

  return getApiError(error);
}

export function getTwoFactorErrorMessage(error: unknown) {
  const status = getStatus(error);
  const message = getMessage(error);

  if (message === "Invalid verification code" || status === 401) {
    return "The verification code is incorrect.";
  }

  if (message === "Verification code session has expired") {
    return "Your sign-in session expired. Sign in again to get a new code.";
  }

  if (status === 429) {
    return "Too many verification attempts. Wait a bit and try again.";
  }

  if (status === 400) {
    return "We couldn't verify that code. Check it and try again.";
  }

  return getApiError(error);
}

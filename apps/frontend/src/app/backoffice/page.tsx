import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BACKOFFICE_SESSION_COOKIE } from "@/server/utils/auth-cookies";
import { verifySessionToken } from "@/server/utils/jwt";

export default async function BackofficePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(BACKOFFICE_SESSION_COOKIE)?.value ?? null;
  let hasValidAdminSession = false;

  if (token) {
    try {
      const auth = verifySessionToken(token);
      hasValidAdminSession = auth.scope === "backoffice" && auth.role === "ADMIN";
    } catch {
      hasValidAdminSession = false;
    }
  }

  redirect(hasValidAdminSession ? "/backoffice/dashboard" : "/backoffice/login");
}

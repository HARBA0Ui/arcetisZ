import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth-options";
import { loginWithGoogleUser } from "@/server/services/auth.service";
import { assertTrustedOrigin, handleRouteError } from "@/server/api";
import { getAuthScope, setSessionCookie } from "@/server/utils/auth-cookies";
import { ApiError } from "@/server/utils/http";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    if (getAuthScope(request) !== "frontoffice") {
      throw new ApiError(403, "Google sign-in is not available for backoffice");
    }

    const session = await getServerSession(authOptions);

    const email = session?.user?.email?.trim().toLowerCase();
    const googleId = session?.user?.googleId;

    if (!email || !googleId) {
      throw new ApiError(401, "Google session is missing required user details");
    }

    const result = await loginWithGoogleUser({
      email,
      name: session.user?.name,
      googleId
    });

    const response = NextResponse.json({
      user: result.user,
      loginBonus: result.loginBonus
    });
    setSessionCookie(response, request, "frontoffice", result.sessionToken);

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}

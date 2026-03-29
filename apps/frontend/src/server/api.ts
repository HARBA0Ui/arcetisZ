import type { ZodTypeAny } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthScope,
  getSessionTokenFromCookie
} from "@/server/utils/auth-cookies";
import { verifySessionToken, type SessionTokenPayload } from "@/server/utils/jwt";
import { prisma } from "@/server/utils/prisma";
import { ApiError } from "@/server/utils/http";

export type RequestAuth = SessionTokenPayload;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.replace("Bearer ", "").trim();
}

export function requireAuth(request: NextRequest): RequestAuth {
  const scope = getAuthScope(request);
  const token = getBearerToken(request) ?? getSessionTokenFromCookie(request, scope);

  if (!token) {
    throw new ApiError(401, "Unauthorized", {
      code: "SESSION_REQUIRED",
      isSessionError: true
    });
  }

  try {
    const auth = verifySessionToken(token);

    if (auth.scope !== scope) {
      throw new ApiError(401, "Session scope mismatch", {
        code: "SESSION_SCOPE_MISMATCH",
        isSessionError: true
      });
    }

    return auth;
  } catch {
    throw new ApiError(401, "Invalid token", {
      code: "SESSION_INVALID",
      isSessionError: true
    });
  }
}

export async function requireAdmin(request: NextRequest): Promise<RequestAuth> {
  const auth = requireAuth(request);

  if (auth.role !== "ADMIN") {
    throw new ApiError(403, "Forbidden", {
      code: "SESSION_FORBIDDEN",
      isSessionError: true
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true }
  });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError(403, "Forbidden", {
      code: "SESSION_FORBIDDEN",
      isSessionError: true
    });
  }

  return auth;
}

export function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(/:$/, "");

  return `${protocol}://${host}`;
}

export function assertTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    throw new ApiError(403, "Origin header is required");
  }

  if (origin !== getRequestOrigin(request)) {
    throw new ApiError(403, "Cross-origin request blocked");
  }
}

export async function parseJsonBody<TSchema extends ZodTypeAny>(
  request: NextRequest,
  schema: TSchema
): Promise<ReturnType<TSchema["parse"]>> {
  const body = await request.json();
  return schema.parse(body);
}

export function parseQuery<TSchema extends ZodTypeAny>(
  request: NextRequest,
  schema: TSchema
): ReturnType<TSchema["parse"]> {
  const { searchParams } = new URL(request.url);
  return schema.parse(Object.fromEntries(searchParams.entries()));
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    const response = NextResponse.json({ message: error.message }, { status: error.statusCode });

    if (error.code) {
      response.headers.set("x-arcetis-error-code", error.code);
    }

    if (error.isSessionError) {
      response.headers.set("x-arcetis-session-error", "1");
    }

    return response;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ZodError" &&
    "issues" in error &&
    Array.isArray(error.issues)
  ) {
    const message =
      typeof error.issues[0]?.message === "string" ? error.issues[0].message : "Invalid request";

    return NextResponse.json({ message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
}

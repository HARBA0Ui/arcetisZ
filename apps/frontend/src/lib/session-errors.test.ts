import axios from "axios";
import { describe, expect, it } from "vitest";
import { isArcetisSessionError } from "@/lib/session-errors";

function buildAxiosError(status: number, headers?: Record<string, string>) {
  return {
    isAxiosError: true,
    response: {
      status,
      headers
    }
  } as unknown;
}

describe("isArcetisSessionError", () => {
  it("detects explicit auth/session failures from response headers", () => {
    const error = buildAxiosError(403, {
      "x-arcetis-session-error": "1"
    });

    expect(isArcetisSessionError(error)).toBe(true);
  });

  it("does not treat business-rule 403 responses as session failures", () => {
    const error = buildAxiosError(403);

    expect(isArcetisSessionError(error)).toBe(false);
  });

  it("optionally treats not-found responses as expired-session signals for user bootstrap queries", () => {
    const error = buildAxiosError(404);

    expect(isArcetisSessionError(error)).toBe(false);
    expect(isArcetisSessionError(error, { includeNotFound: true })).toBe(true);
  });

  it("ignores non-Axios errors", () => {
    expect(isArcetisSessionError(new Error("boom"))).toBe(false);
    expect(isArcetisSessionError(axios.AxiosError.from(new Error("boom")))).toBe(false);
  });
});

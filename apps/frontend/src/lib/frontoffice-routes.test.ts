import { describe, expect, it } from "vitest";
import { isFrontofficeProtectedRoute, matchesRoutePrefix } from "@/lib/frontoffice-routes";

describe("frontoffice route protection", () => {
  it("matches exact paths and nested paths without false positives", () => {
    expect(matchesRoutePrefix("/giveaways", "/giveaways")).toBe(true);
    expect(matchesRoutePrefix("/giveaways/abc", "/giveaways")).toBe(true);
    expect(matchesRoutePrefix("/giveaways-archive", "/giveaways")).toBe(false);
  });

  it("keeps giveaways and requests inside the protected route map", () => {
    expect(isFrontofficeProtectedRoute("/giveaways")).toBe(true);
    expect(isFrontofficeProtectedRoute("/giveaways/mine")).toBe(true);
    expect(isFrontofficeProtectedRoute("/requests")).toBe(true);
    expect(isFrontofficeProtectedRoute("/requests/entry-1")).toBe(true);
    expect(isFrontofficeProtectedRoute("/login")).toBe(false);
  });
});

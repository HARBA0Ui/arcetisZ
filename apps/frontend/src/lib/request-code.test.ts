import { getDisplayRequestCode } from "./request-code";

describe("getDisplayRequestCode", () => {
  it("normalizes the code to 12 uppercase alphanumeric characters", () => {
    expect(getDisplayRequestCode(" legacy-arc_ab12-cd34ef56 ")).toBe("AB12CD34EF56");
  });

  it("falls back to the request id when the stored code is missing", () => {
    expect(getDisplayRequestCode(undefined, "665f5f8d12ab34cd56ef78aa")).toBe("34CD56EF78AA");
  });
});

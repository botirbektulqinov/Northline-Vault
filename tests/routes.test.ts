import { describe, expect, it } from "vitest";

import { buildLockHref, sanitizeReturnPath } from "@/lib/routes";

describe("sanitizeReturnPath", () => {
  it("keeps internal workspace paths", () => {
    expect(sanitizeReturnPath("/vault/new?from=health")).toBe(
      "/vault/new?from=health",
    );
  });

  it("falls back for unsafe or recursive lock paths", () => {
    expect(sanitizeReturnPath("https://evil.example")).toBe("/vault");
    expect(sanitizeReturnPath("//evil.example")).toBe("/vault");
    expect(sanitizeReturnPath("/lock?next=/settings")).toBe("/vault");
  });
});

describe("buildLockHref", () => {
  it("adds a safe next parameter when provided", () => {
    expect(buildLockHref("/settings?tab=security")).toBe(
      "/lock?next=%2Fsettings%3Ftab%3Dsecurity",
    );
  });

  it("returns the bare lock route when no next path is supplied", () => {
    expect(buildLockHref()).toBe("/lock");
    expect(buildLockHref("/lock")).toBe("/lock");
  });
});

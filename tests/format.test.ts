import { describe, expect, it } from "vitest";

import { maskSecret } from "@/lib/format";

describe("maskSecret", () => {
  it("fully masks the secret when no visible tail is requested", () => {
    expect(maskSecret("ofq,)bT@t2L#3KDF:y", 0)).toBe("••••••••••••••••••");
  });

  it("keeps only the requested tail visible", () => {
    expect(maskSecret("abcdef", 2)).toBe("••••ef");
  });
});

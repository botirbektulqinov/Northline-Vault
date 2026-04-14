import { describe, expect, it } from "vitest";

import { evaluatePasswordStrength, generatePassword } from "@/lib/passwords";

describe("generatePassword", () => {
  it("honors length and character options", () => {
    const password = generatePassword({
      length: 20,
      includeNumbers: false,
      includeSymbols: false,
      includeUppercase: false,
    });

    expect(password).toHaveLength(20);
    expect(password).toMatch(/^[a-z]+$/);
  });

  it("includes every enabled character class", () => {
    const password = generatePassword({
      length: 24,
      includeNumbers: true,
      includeSymbols: true,
      includeUppercase: true,
    });

    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/\d/);
    expect(password).toMatch(/[^a-zA-Z0-9]/);
  });
});

describe("evaluatePasswordStrength", () => {
  it("marks short common passwords as weak", () => {
    expect(evaluatePasswordStrength("password123").value).toBe("WEAK");
  });

  it("marks medium-complexity passwords as fair", () => {
    expect(evaluatePasswordStrength("HarborStone").value).toBe("FAIR");
  });

  it("marks long varied passwords as strong", () => {
    expect(evaluatePasswordStrength("Moss$Bridge!29Signal")).toMatchObject({
      value: "STRONG",
      label: "Strong",
    });
  });
});

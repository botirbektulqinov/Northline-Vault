import { describe, expect, it } from "vitest";

import { decryptString, encryptString } from "@/lib/crypto/encryption";
import { deriveVaultKeys, fingerprintPassword } from "@/lib/crypto/kdf";

describe("vault encryption", () => {
  it("round-trips encrypted text with AES-GCM", async () => {
    const masterKeyMaterial = Uint8Array.from(
      Array.from({ length: 32 }, (_, index) => index + 1),
    );
    const keys = await deriveVaultKeys(masterKeyMaterial);

    const encrypted = await encryptString("shared-secret-value", keys.encryptionKey);

    expect(encrypted).not.toContain("shared-secret-value");
    await expect(decryptString(encrypted, keys.encryptionKey)).resolves.toBe(
      "shared-secret-value",
    );
  });
});

describe("password fingerprints", () => {
  it("creates deterministic fingerprints for matching passwords", async () => {
    const masterKeyMaterial = Uint8Array.from(
      Array.from({ length: 32 }, (_, index) => 255 - index),
    );
    const keys = await deriveVaultKeys(masterKeyMaterial);

    const first = await fingerprintPassword("Alpha!234Secure", keys.fingerprintKeyBytes);
    const second = await fingerprintPassword("Alpha!234Secure", keys.fingerprintKeyBytes);
    const third = await fingerprintPassword("Different!234", keys.fingerprintKeyBytes);

    expect(first).toBe(second);
    expect(first).not.toBe(third);
  });
});

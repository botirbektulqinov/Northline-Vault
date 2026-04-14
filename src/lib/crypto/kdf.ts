import { argon2id } from "hash-wasm";

import { base64ToBytes, bytesToBase64, encoder } from "@/lib/crypto/encoding";

export interface SessionKeys {
  encryptionKey: CryptoKey;
  fingerprintKeyBytes: Uint8Array;
  verifier: string;
}

function asBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

const ARGON2_SETTINGS = {
  iterations: 3,
  memorySize: 64 * 1024,
  hashLength: 32,
  parallelism: 1,
};

export function createSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bytesToBase64(salt);
}

async function sha256Base64(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", asBufferSource(bytes));
  return bytesToBase64(new Uint8Array(digest));
}

export async function deriveMasterKeyMaterial(
  masterPassword: string,
  salt: string | Uint8Array,
): Promise<Uint8Array> {
  return argon2id({
    password: masterPassword,
    salt: typeof salt === "string" ? base64ToBytes(salt) : salt,
    iterations: ARGON2_SETTINGS.iterations,
    memorySize: ARGON2_SETTINGS.memorySize,
    hashLength: ARGON2_SETTINGS.hashLength,
    parallelism: ARGON2_SETTINGS.parallelism,
    outputType: "binary",
  });
}

export async function deriveSubkeyBytes(
  masterKeyMaterial: Uint8Array,
  context: string,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    asBufferSource(masterKeyMaterial),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    asBufferSource(encoder.encode(`northline-vault:${context}`)),
  );

  return new Uint8Array(signature);
}

export async function importAesKey(bytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", asBufferSource(bytes), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function deriveVaultKeys(
  masterKeyMaterial: Uint8Array,
): Promise<SessionKeys> {
  const encryptionKeyBytes = await deriveSubkeyBytes(
    masterKeyMaterial,
    "encryption",
  );
  const fingerprintKeyBytes = await deriveSubkeyBytes(
    masterKeyMaterial,
    "fingerprint",
  );
  const verifierSeed = await deriveSubkeyBytes(masterKeyMaterial, "verifier");

  try {
    return {
      encryptionKey: await importAesKey(encryptionKeyBytes),
      fingerprintKeyBytes,
      verifier: await sha256Base64(verifierSeed),
    };
  } finally {
    encryptionKeyBytes.fill(0);
    verifierSeed.fill(0);
  }
}

export async function fingerprintPassword(
  password: string,
  fingerprintKeyBytes: Uint8Array,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    asBufferSource(fingerprintKeyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    asBufferSource(encoder.encode(password)),
  );

  return bytesToBase64(new Uint8Array(signature));
}

export function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const max = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length === rightBytes.length ? 0 : 1;

  for (let index = 0; index < max; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return mismatch === 0;
}

import { base64ToBytes, bytesToBase64, decoder, encoder } from "@/lib/crypto/encoding";

export interface EncryptedSecretFields {
  usernameCiphertext: string;
  passwordCiphertext: string;
  notesCiphertext: string;
}

export interface DecryptedSecretFields {
  username: string;
  password: string;
  notes: string;
}

export async function encryptString(
  plaintext: string,
  encryptionKey: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    encryptionKey,
    encoder.encode(plaintext),
  );

  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptString(
  payload: string,
  encryptionKey: CryptoKey,
): Promise<string> {
  const [ivBase64, ciphertextBase64] = payload.split(".");

  if (!ivBase64 || !ciphertextBase64) {
    throw new Error("Encrypted payload is malformed.");
  }

  const iv = base64ToBytes(ivBase64);
  const ciphertext = base64ToBytes(ciphertextBase64);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    encryptionKey,
    ciphertext as BufferSource,
  );

  return decoder.decode(plaintext);
}

export async function encryptSecretFields(
  values: DecryptedSecretFields,
  encryptionKey: CryptoKey,
): Promise<EncryptedSecretFields> {
  const [usernameCiphertext, passwordCiphertext, notesCiphertext] =
    await Promise.all([
      encryptString(values.username, encryptionKey),
      encryptString(values.password, encryptionKey),
      encryptString(values.notes, encryptionKey),
    ]);

  return {
    usernameCiphertext,
    passwordCiphertext,
    notesCiphertext,
  };
}

export async function decryptSecretFields(
  values: EncryptedSecretFields,
  encryptionKey: CryptoKey,
): Promise<DecryptedSecretFields> {
  const [username, password, notes] = await Promise.all([
    decryptString(values.usernameCiphertext, encryptionKey),
    decryptString(values.passwordCiphertext, encryptionKey),
    decryptString(values.notesCiphertext, encryptionKey),
  ]);

  return {
    username,
    password,
    notes,
  };
}

import type { Credential, Vault } from "@prisma/client";

import { DEFAULT_VAULT_SETTINGS } from "@/lib/constants/vault";
import { sanitizeTags } from "@/lib/format";
import { settingsSchema } from "@/lib/schemas";
import type { EncryptedCredentialRecord, VaultSettings, VaultSnapshot } from "@/lib/types";

export type VaultWithCount = Vault & {
  _count: {
    credentials: number;
  };
};

export function parseSettingsJson(settingsJson: string): VaultSettings {
  try {
    return settingsSchema.parse(JSON.parse(settingsJson));
  } catch {
    return DEFAULT_VAULT_SETTINGS;
  }
}

export function serializeSettings(settings: VaultSettings): string {
  return JSON.stringify(settingsSchema.parse(settings));
}

function parseTagsJson(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson);
    return sanitizeTags(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

export function toVaultSnapshot(vault: VaultWithCount): VaultSnapshot {
  return {
    id: vault.id,
    salt: vault.salt,
    verifier: vault.verifier,
    settings: parseSettingsJson(vault.settingsJson),
    createdAt: vault.createdAt.toISOString(),
    updatedAt: vault.updatedAt.toISOString(),
    credentialCount: vault._count.credentials,
  };
}

export function toCredentialRecord(record: Credential): EncryptedCredentialRecord {
  return {
    id: record.id,
    vaultId: record.vaultId,
    serviceName: record.serviceName,
    url: record.url,
    department: record.department,
    project: record.project,
    category: record.category,
    tags: parseTagsJson(record.tagsJson),
    usernameCiphertext: record.usernameCiphertext,
    passwordCiphertext: record.passwordCiphertext,
    notesCiphertext: record.notesCiphertext,
    passwordStrength: record.passwordStrength,
    passwordFingerprint: record.passwordFingerprint,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  decryptSecretFields,
  encryptSecretFields,
} from "@/lib/crypto/encryption";
import {
  createSalt,
  deriveMasterKeyMaterial,
  deriveVaultKeys,
  fingerprintPassword,
  timingSafeEqual,
  type SessionKeys,
} from "@/lib/crypto/kdf";
import { DEFAULT_VAULT_SETTINGS } from "@/lib/constants/vault";
import {
  getCredentialAgeInDays,
  buildReuseCountMap,
  computeSecuritySummary,
} from "@/lib/health";
import { evaluatePasswordStrength } from "@/lib/passwords";
import type {
  CredentialFormValues,
  DecryptedCredential,
  EncryptedCredentialRecord,
  SecuritySummary,
  SessionStatus,
  VaultBackupExport,
  VaultSettings,
  VaultSnapshot,
  VaultSummary,
} from "@/lib/types";

interface VaultContextValue {
  status: SessionStatus;
  isReady: boolean;
  isUnlocked: boolean;
  hasVault: boolean;
  vaultSummaries: VaultSummary[];
  vault: VaultSnapshot | null;
  settings: VaultSettings;
  credentials: DecryptedCredential[];
  encryptedCredentials: EncryptedCredentialRecord[];
  health: SecuritySummary;
  unlock: (vaultId: string, masterPassword: string) => Promise<void>;
  createVault: (
    name: string,
    masterPassword: string,
    settings?: Partial<VaultSettings>,
  ) => Promise<void>;
  lock: (reason?: string) => void;
  saveCredential: (
    values: CredentialFormValues,
    id?: string,
  ) => Promise<DecryptedCredential>;
  deleteCredential: (id: string) => Promise<void>;
  updateSettings: (settings: VaultSettings) => Promise<void>;
  changeMasterPassword: (
    currentPassword: string,
    nextPassword: string,
  ) => Promise<void>;
  exportBackup: () => VaultBackupExport | null;
  findCredential: (id: string) => DecryptedCredential | undefined;
  reloadVault: () => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

function clearBytes(bytes: Uint8Array | null | undefined) {
  bytes?.fill(0);
}

function clearSessionKeys(keys: SessionKeys | null) {
  if (!keys) {
    return;
  }

  clearBytes(keys.fingerprintKeyBytes);
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json()) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }

  return data as T;
}

function createUnlockedCredential(
  record: EncryptedCredentialRecord,
  decrypted: {
    username: string;
    password: string;
    notes: string;
  },
  reusedCountMap: Map<string, number>,
  settings: VaultSettings,
): DecryptedCredential {
  const ageInDays = getCredentialAgeInDays(record.updatedAt);

  return {
    ...record,
    ...decrypted,
    reusedCount: reusedCountMap.get(record.passwordFingerprint) ?? 1,
    ageInDays,
    requiresReview: ageInDays >= settings.rotationReviewDays,
    isUngrouped:
      !record.department &&
      !record.project &&
      !record.category &&
      record.tags.length === 0,
  };
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("booting");
  const [vaultSummaries, setVaultSummaries] = useState<VaultSummary[]>([]);
  const [vault, setVault] = useState<VaultSnapshot | null>(null);
  const [encryptedCredentials, setEncryptedCredentials] = useState<
    EncryptedCredentialRecord[]
  >([]);
  const [credentials, setCredentials] = useState<DecryptedCredential[]>([]);
  const sessionKeysRef = useRef<SessionKeys | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);

  const settings = vault?.settings ?? DEFAULT_VAULT_SETTINGS;

  const replaceSessionKeys = useCallback((nextKeys: SessionKeys | null) => {
    clearSessionKeys(sessionKeysRef.current);
    sessionKeysRef.current = nextKeys;
  }, []);

  const resetSessionState = useCallback(() => {
    replaceSessionKeys(null);
    setEncryptedCredentials([]);
    setCredentials([]);
  }, [replaceSessionKeys]);

  const hydrateCredentials = useCallback(
    async (
      nextEncryptedCredentials: EncryptedCredentialRecord[],
      nextVault: VaultSnapshot | null = vault,
      nextKeys: SessionKeys | null = sessionKeysRef.current,
    ) => {
      setEncryptedCredentials(nextEncryptedCredentials);

      if (!nextVault || !nextKeys) {
        setCredentials([]);
        return [];
      }

      const reusedCountMap = buildReuseCountMap(nextEncryptedCredentials);
      let decryptedCredentials: DecryptedCredential[];

      try {
        decryptedCredentials = await Promise.all(
          nextEncryptedCredentials.map(async (record) => {
            const decrypted = await decryptSecretFields(
              {
                usernameCiphertext: record.usernameCiphertext,
                passwordCiphertext: record.passwordCiphertext,
                notesCiphertext: record.notesCiphertext,
              },
              nextKeys.encryptionKey,
            );

            return createUnlockedCredential(
              record,
              decrypted,
              reusedCountMap,
              nextVault.settings,
            );
          }),
        );
      } catch {
        throw new Error(
          "The vault could not be decrypted. Lock the vault and try again.",
        );
      }

      setCredentials(decryptedCredentials);
      return decryptedCredentials;
    },
    [vault],
  );

  const reloadVault = useCallback(async () => {
    const data = await requestJson<{ vaults: VaultSummary[] }>("/api/vault", {
      method: "GET",
    });

    setVaultSummaries(data.vaults);

    setStatus((currentStatus) =>
      currentStatus === "booting" ? "locked" : currentStatus,
    );
  }, []);

  useEffect(() => {
    void reloadVault();
  }, [reloadVault]);

  const lock = useCallback((reason?: string) => {
    resetSessionState();
    setVault(null);
    setStatus("locked");

    if (inactivityTimeoutRef.current) {
      window.clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }

    if (reason) {
      toast.info(reason);
    }
  }, [resetSessionState]);

  const scheduleAutoLock = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      window.clearTimeout(inactivityTimeoutRef.current);
    }

    if (status !== "unlocked") {
      return;
    }

    inactivityTimeoutRef.current = window.setTimeout(() => {
      lock("Vault locked after inactivity.");
    }, settings.autoLockMinutes * 60_000);
  }, [lock, settings.autoLockMinutes, status]);

  useEffect(() => {
    if (status !== "unlocked") {
      return;
    }

    const activityHandler = () => {
      scheduleAutoLock();
    };

    const events = [
      "keydown",
      "mousedown",
      "mousemove",
      "scroll",
      "touchstart",
    ] as const;

    events.forEach((eventName) =>
      window.addEventListener(eventName, activityHandler, { passive: true }),
    );
    scheduleAutoLock();

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, activityHandler),
      );

      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, [scheduleAutoLock, status]);

  const unlock = useCallback(
    async (vaultId: string, masterPassword: string) => {
      setStatus("unlocking");
      let masterKeyMaterial: Uint8Array | null = null;
      let keys: SessionKeys | null = null;

      try {
        const vaultData = await requestJson<{ vault: VaultSnapshot }>(
          `/api/vault/${vaultId}`,
          { method: "GET" },
        );
        const targetVault = vaultData.vault;

        masterKeyMaterial = await deriveMasterKeyMaterial(
          masterPassword,
          targetVault.salt,
        );
        keys = await deriveVaultKeys(masterKeyMaterial);

        if (!timingSafeEqual(keys.verifier, targetVault.verifier)) {
          throw new Error("The master password did not match this vault.");
        }

        const data = await requestJson<{
          credentials: EncryptedCredentialRecord[];
        }>(`/api/vault/${vaultId}/credentials`, { method: "GET" });

        replaceSessionKeys(keys);
        keys = null;
        setVault(targetVault);
        await hydrateCredentials(
          data.credentials,
          targetVault,
          sessionKeysRef.current,
        );
        setStatus("unlocked");
      } catch (error) {
        resetSessionState();
        setVault(null);
        setStatus("locked");
        throw error;
      } finally {
        clearBytes(masterKeyMaterial);
        clearSessionKeys(keys);
      }
    },
    [hydrateCredentials, replaceSessionKeys, resetSessionState],
  );

  const createVault = useCallback(
    async (
      name: string,
      masterPassword: string,
      settingsOverride?: Partial<VaultSettings>,
    ) => {
      const mergedSettings: VaultSettings = {
        ...DEFAULT_VAULT_SETTINGS,
        ...(settingsOverride ?? {}),
      };
      const salt = createSalt();
      let masterKeyMaterial: Uint8Array | null = null;
      let keys: SessionKeys | null = null;

      try {
        masterKeyMaterial = await deriveMasterKeyMaterial(masterPassword, salt);
        keys = await deriveVaultKeys(masterKeyMaterial);
        const data = await requestJson<{ vault: VaultSnapshot }>("/api/vault", {
          method: "POST",
          body: JSON.stringify({
            name,
            salt,
            verifier: keys.verifier,
            settings: mergedSettings,
          }),
        });

        replaceSessionKeys(keys);
        keys = null;
        setVault(data.vault);
        setVaultSummaries((prev) => [
          ...prev,
          {
            id: data.vault.id,
            name: data.vault.name,
            createdAt: data.vault.createdAt,
          },
        ]);
        setEncryptedCredentials([]);
        setCredentials([]);
        setStatus("unlocked");
      } finally {
        clearBytes(masterKeyMaterial);
        clearSessionKeys(keys);
      }
    },
    [replaceSessionKeys],
  );

  const saveCredential = useCallback(
    async (values: CredentialFormValues, id?: string) => {
      const keys = sessionKeysRef.current;

      if (!keys || !vault) {
        throw new Error("Unlock the vault before saving credentials.");
      }

      const passwordStrength = evaluatePasswordStrength(values.password).value;
      const passwordFingerprint = await fingerprintPassword(
        values.password,
        keys.fingerprintKeyBytes,
      );
      const encryptedFields = await encryptSecretFields(
        {
          username: values.username,
          password: values.password,
          notes: values.notes,
        },
        keys.encryptionKey,
      );

      const payload = {
        serviceName: values.serviceName,
        url: values.url,
        usernameCiphertext: encryptedFields.usernameCiphertext,
        passwordCiphertext: encryptedFields.passwordCiphertext,
        notesCiphertext: encryptedFields.notesCiphertext,
        department: values.department || null,
        project: values.project || null,
        category: values.category || null,
        tags: values.tags,
        passwordStrength,
        passwordFingerprint,
      };

      const endpoint = id
        ? `/api/vault/${vault.id}/credentials/${id}`
        : `/api/vault/${vault.id}/credentials`;
      const method = id ? "PUT" : "POST";
      const data = await requestJson<{ credential: EncryptedCredentialRecord }>(
        endpoint,
        {
          method,
          body: JSON.stringify(payload),
        },
      );

      const nextEncryptedCredentials = id
        ? encryptedCredentials.map((credential) =>
            credential.id === id ? data.credential : credential,
          )
        : [data.credential, ...encryptedCredentials];

      const nextDecryptedCredentials = await hydrateCredentials(
        nextEncryptedCredentials,
        vault,
        keys,
      );

      if (!id) {
        setVault((currentVault) =>
          currentVault
            ? {
                ...currentVault,
                credentialCount: currentVault.credentialCount + 1,
              }
            : currentVault,
        );
      }

      const savedCredential = nextDecryptedCredentials.find(
        (credential) => credential.id === data.credential.id,
      );

      if (!savedCredential) {
        throw new Error("The saved credential could not be decrypted.");
      }

      return savedCredential;
    },
    [encryptedCredentials, hydrateCredentials, vault],
  );

  const deleteCredential = useCallback(
    async (id: string) => {
      if (!sessionKeysRef.current || !vault) {
        throw new Error("Unlock the vault before deleting credentials.");
      }

      await requestJson<{ success: boolean }>(
        `/api/vault/${vault.id}/credentials/${id}`,
        { method: "DELETE" },
      );

      const nextEncryptedCredentials = encryptedCredentials.filter(
        (credential) => credential.id !== id,
      );
      await hydrateCredentials(
        nextEncryptedCredentials,
        vault,
        sessionKeysRef.current,
      );
      setVault((currentVault) =>
        currentVault
          ? {
              ...currentVault,
              credentialCount: Math.max(0, currentVault.credentialCount - 1),
            }
          : currentVault,
      );
    },
    [encryptedCredentials, hydrateCredentials, vault],
  );

  const updateSettings = useCallback(
    async (nextSettings: VaultSettings) => {
      if (!vault) {
        throw new Error("Unlock the vault before updating settings.");
      }

      const data = await requestJson<{ vault: VaultSnapshot }>(
        `/api/vault/${vault.id}/settings`,
        {
          method: "PATCH",
          body: JSON.stringify({ settings: nextSettings }),
        },
      );

      setVault(data.vault);
      await hydrateCredentials(
        encryptedCredentials,
        data.vault,
        sessionKeysRef.current,
      );
    },
    [encryptedCredentials, hydrateCredentials, vault],
  );

  const changeMasterPassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      if (!vault || !sessionKeysRef.current) {
        throw new Error("Unlock the vault before rotating the master password.");
      }

      let currentMaterial: Uint8Array | null = null;
      let nextMaterial: Uint8Array | null = null;
      let currentKeys: SessionKeys | null = null;
      let nextKeys: SessionKeys | null = null;

      try {
        currentMaterial = await deriveMasterKeyMaterial(currentPassword, vault.salt);
        currentKeys = await deriveVaultKeys(currentMaterial);

        if (!timingSafeEqual(currentKeys.verifier, vault.verifier)) {
          throw new Error("The current master password is incorrect.");
        }

        const nextSalt = createSalt();
        nextMaterial = await deriveMasterKeyMaterial(nextPassword, nextSalt);
        nextKeys = await deriveVaultKeys(nextMaterial);
        const rotatedKeys = nextKeys;

        const rotatedCredentials = await Promise.all(
          credentials.map(async (credential) => {
            const encryptedFields = await encryptSecretFields(
              {
                username: credential.username,
                password: credential.password,
                notes: credential.notes,
              },
              rotatedKeys.encryptionKey,
            );

            return {
              id: credential.id,
              ...encryptedFields,
              passwordFingerprint: await fingerprintPassword(
                credential.password,
                rotatedKeys.fingerprintKeyBytes,
              ),
              passwordStrength: credential.passwordStrength,
            };
          }),
        );

        const data = await requestJson<{
          vault: VaultSnapshot;
          credentials: EncryptedCredentialRecord[];
        }>(`/api/vault/${vault.id}/rotate-master`, {
          method: "POST",
          body: JSON.stringify({
            salt: nextSalt,
            verifier: rotatedKeys.verifier,
            credentials: rotatedCredentials,
          }),
        });

        replaceSessionKeys(nextKeys);
        nextKeys = null;
        setVault(data.vault);
        await hydrateCredentials(
          data.credentials,
          data.vault,
          sessionKeysRef.current,
        );
      } finally {
        clearBytes(currentMaterial);
        clearBytes(nextMaterial);
        clearSessionKeys(currentKeys);
        clearSessionKeys(nextKeys);
      }
    },
    [credentials, hydrateCredentials, replaceSessionKeys, vault],
  );

  const exportBackup = useCallback((): VaultBackupExport | null => {
    if (!vault || !sessionKeysRef.current) {
      return null;
    }

    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      vault: {
        id: vault.id,
        name: vault.name,
        salt: vault.salt,
        verifier: vault.verifier,
        settings: vault.settings,
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt,
      },
      credentials: encryptedCredentials,
    };
  }, [encryptedCredentials, vault]);

  const findCredential = useCallback(
    (id: string) => credentials.find((credential) => credential.id === id),
    [credentials],
  );

  const contextValue = useMemo<VaultContextValue>(
    () => ({
      status,
      isReady: status !== "booting",
      isUnlocked: status === "unlocked",
      hasVault: vaultSummaries.length > 0,
      vaultSummaries,
      vault,
      settings,
      credentials,
      encryptedCredentials,
      health: computeSecuritySummary(credentials, settings),
      unlock,
      createVault,
      lock,
      saveCredential,
      deleteCredential,
      updateSettings,
      changeMasterPassword,
      exportBackup,
      findCredential,
      reloadVault,
    }),
    [
      changeMasterPassword,
      createVault,
      credentials,
      deleteCredential,
      encryptedCredentials,
      exportBackup,
      findCredential,
      lock,
      reloadVault,
      saveCredential,
      settings,
      status,
      unlock,
      updateSettings,
      vault,
      vaultSummaries,
    ],
  );

  return (
    <VaultContext.Provider value={contextValue}>{children}</VaultContext.Provider>
  );
}

export function useVaultContext() {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error("useVaultContext must be used inside VaultProvider.");
  }

  return context;
}

"use client";

import { useMemo } from "react";

import { CredentialForm } from "@/components/vault/credential-form";
import { useVault } from "@/hooks/use-vault";

export function CredentialEditorPage({ credentialId }: { credentialId?: string }) {
  const { findCredential } = useVault();

  const credential = useMemo(
    () => (credentialId ? findCredential(credentialId) : undefined),
    [credentialId, findCredential],
  );

  if (credentialId && !credential) {
    return (
      <div className="rounded-xl border border-black/6 bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Credential not found</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          This record is unavailable in the current client session. Unlock the vault
          again or return to the overview and choose another entry.
        </p>
      </div>
    );
  }

  return <CredentialForm mode={credentialId ? "edit" : "create"} credential={credential} />;
}

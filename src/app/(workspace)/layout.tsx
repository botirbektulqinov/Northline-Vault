import { AppShell } from "@/components/layout/app-shell";
import { VaultGuard } from "@/components/layout/vault-guard";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <VaultGuard>
      <AppShell>{children}</AppShell>
    </VaultGuard>
  );
}

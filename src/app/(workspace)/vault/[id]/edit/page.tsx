import { CredentialEditorPage } from "@/components/vault/credential-editor-page";

interface EditCredentialPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCredentialPage({
  params,
}: EditCredentialPageProps) {
  const { id } = await params;

  return <CredentialEditorPage credentialId={id} />;
}

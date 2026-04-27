import { encryptedCredentialSchema } from "@/lib/schemas";
import { apiError, jsonNoStore } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { toCredentialRecord } from "@/lib/server/vault-store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
    credentialId: string;
  }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id, credentialId } = await context.params;
    const payload = encryptedCredentialSchema.parse(await request.json());

    const existing = await prisma.credential.findFirst({
      where: { id: credentialId, vaultId: id },
      select: { id: true },
    });

    if (!existing) {
      return jsonNoStore({ error: "Credential not found." }, { status: 404 });
    }

    const credential = await prisma.credential.update({
      where: { id: credentialId },
      data: {
        serviceName: payload.serviceName,
        url: payload.url,
        department: payload.department || null,
        project: payload.project || null,
        category: payload.category || null,
        tagsJson: JSON.stringify(payload.tags),
        usernameCiphertext: payload.usernameCiphertext,
        passwordCiphertext: payload.passwordCiphertext,
        notesCiphertext: payload.notesCiphertext,
        passwordStrength: payload.passwordStrength,
        passwordFingerprint: payload.passwordFingerprint,
      },
    });

    return jsonNoStore({
      credential: toCredentialRecord(credential),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, credentialId } = await context.params;

    const existing = await prisma.credential.findFirst({
      where: { id: credentialId, vaultId: id },
      select: { id: true },
    });

    if (!existing) {
      return jsonNoStore({ error: "Credential not found." }, { status: 404 });
    }

    await prisma.credential.delete({
      where: { id: credentialId },
    });

    return jsonNoStore({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

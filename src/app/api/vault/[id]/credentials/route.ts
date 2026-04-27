import { encryptedCredentialSchema } from "@/lib/schemas";
import { apiError, jsonNoStore } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { toCredentialRecord } from "@/lib/server/vault-store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const vault = await prisma.vault.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!vault) {
      return jsonNoStore({ credentials: [] });
    }

    const credentials = await prisma.credential.findMany({
      where: {
        vaultId: id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return jsonNoStore({
      credentials: credentials.map(toCredentialRecord),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = encryptedCredentialSchema.parse(await request.json());

    const vault = await prisma.vault.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!vault) {
      return jsonNoStore({ error: "Vault not found." }, { status: 404 });
    }

    const credential = await prisma.credential.create({
      data: {
        vaultId: id,
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

    return jsonNoStore(
      {
        credential: toCredentialRecord(credential),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

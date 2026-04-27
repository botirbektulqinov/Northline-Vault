import { rotateMasterPasswordSchema } from "@/lib/schemas";
import { apiError, jsonNoStore, PublicApiError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { toCredentialRecord, toVaultSnapshot } from "@/lib/server/vault-store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = rotateMasterPasswordSchema.parse(await request.json());

    const result = await prisma.$transaction(async (transaction) => {
      const vault = await transaction.vault.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              credentials: true,
            },
          },
        },
      });

      if (!vault) {
        throw new PublicApiError(404, "Vault not found.");
      }

      await transaction.vault.update({
        where: { id },
        data: {
          salt: payload.salt,
          verifier: payload.verifier,
        },
      });

      for (const credential of payload.credentials) {
        const updatedCredential = await transaction.credential.updateMany({
          where: {
            id: credential.id,
            vaultId: id,
          },
          data: {
            usernameCiphertext: credential.usernameCiphertext,
            passwordCiphertext: credential.passwordCiphertext,
            notesCiphertext: credential.notesCiphertext,
            passwordFingerprint: credential.passwordFingerprint,
            passwordStrength: credential.passwordStrength,
          },
        });

        if (updatedCredential.count !== 1) {
          throw new PublicApiError(400, "Credential payload did not match this vault.");
        }
      }

      const [freshVault, credentials] = await Promise.all([
        transaction.vault.findUniqueOrThrow({
          where: { id },
          include: {
            _count: {
              select: {
                credentials: true,
              },
            },
          },
        }),
        transaction.credential.findMany({
          where: { vaultId: id },
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      return {
        vault: freshVault,
        credentials,
      };
    });

    return jsonNoStore({
      vault: toVaultSnapshot(result.vault),
      credentials: result.credentials.map(toCredentialRecord),
    });
  } catch (error) {
    return apiError(error);
  }
}

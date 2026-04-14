import { rotateMasterPasswordSchema } from "@/lib/schemas";
import { apiError, jsonNoStore, PublicApiError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { toCredentialRecord, toVaultSnapshot } from "@/lib/server/vault-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = rotateMasterPasswordSchema.parse(await request.json());

    const result = await prisma.$transaction(async (transaction) => {
      const vault = await transaction.vault.findFirst({
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
        where: {
          id: vault.id,
        },
        data: {
          salt: payload.salt,
          verifier: payload.verifier,
        },
      });

      for (const credential of payload.credentials) {
        await transaction.credential.update({
          where: { id: credential.id },
          data: {
            usernameCiphertext: credential.usernameCiphertext,
            passwordCiphertext: credential.passwordCiphertext,
            notesCiphertext: credential.notesCiphertext,
            passwordFingerprint: credential.passwordFingerprint,
            passwordStrength: credential.passwordStrength,
          },
        });
      }

      const [freshVault, credentials] = await Promise.all([
        transaction.vault.findUniqueOrThrow({
          where: { id: vault.id },
          include: {
            _count: {
              select: {
                credentials: true,
              },
            },
          },
        }),
        transaction.credential.findMany({
          where: { vaultId: vault.id },
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

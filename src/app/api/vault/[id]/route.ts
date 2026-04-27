import { jsonNoStore, apiError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { toVaultSnapshot } from "@/lib/server/vault-store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const vault = await prisma.vault.findUnique({
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
      return jsonNoStore({ error: "Vault not found." }, { status: 404 });
    }

    return jsonNoStore({
      vault: toVaultSnapshot(vault),
    });
  } catch (error) {
    return apiError(error);
  }
}

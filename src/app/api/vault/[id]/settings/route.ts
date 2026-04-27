import { updateSettingsSchema } from "@/lib/schemas";
import { apiError, jsonNoStore } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { serializeSettings, toVaultSnapshot } from "@/lib/server/vault-store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = updateSettingsSchema.parse(await request.json());

    const vault = await prisma.vault.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!vault) {
      return jsonNoStore({ error: "Vault not found." }, { status: 404 });
    }

    const updatedVault = await prisma.vault.update({
      where: { id },
      data: {
        settingsJson: serializeSettings(payload.settings),
      },
      include: {
        _count: {
          select: {
            credentials: true,
          },
        },
      },
    });

    return jsonNoStore({
      vault: toVaultSnapshot(updatedVault),
    });
  } catch (error) {
    return apiError(error);
  }
}

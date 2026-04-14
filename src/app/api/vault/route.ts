import { createVaultSchema } from "@/lib/schemas";
import { jsonNoStore, apiError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { serializeSettings, toVaultSnapshot } from "@/lib/server/vault-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const vault = await prisma.vault.findFirst({
      include: {
        _count: {
          select: {
            credentials: true,
          },
        },
      },
    });

    return jsonNoStore({
      vault: vault ? toVaultSnapshot(vault) : null,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const existingVault = await prisma.vault.findFirst({
      select: { id: true },
    });

    if (existingVault) {
      return jsonNoStore(
        { error: "A vault already exists in this workspace." },
        { status: 409 },
      );
    }

    const payload = createVaultSchema.parse(await request.json());
    const vault = await prisma.vault.create({
      data: {
        salt: payload.salt,
        verifier: payload.verifier,
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

    return jsonNoStore(
      {
        vault: toVaultSnapshot(vault),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

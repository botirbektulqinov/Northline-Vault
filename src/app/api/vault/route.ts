import { createVaultSchema } from "@/lib/schemas";
import { jsonNoStore, apiError } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import {
  serializeSettings,
  toVaultSnapshot,
  toVaultSummary,
} from "@/lib/server/vault-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const vaults = await prisma.vault.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return jsonNoStore({
      vaults: vaults.map(toVaultSummary),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = createVaultSchema.parse(await request.json());

    const existing = await prisma.vault.findFirst({
      where: {
        name: {
          equals: payload.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      return jsonNoStore(
        { error: "A vault with this name already exists. Choose a different name." },
        { status: 409 },
      );
    }

    const vault = await prisma.vault.create({
      data: {
        name: payload.name,
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

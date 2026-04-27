// This route has been moved to /api/vault/[id]/credentials/[credentialId]
// Keeping this file to avoid 404 during transition.
import { jsonNoStore } from "@/lib/server/api";

export const runtime = "nodejs";

export async function PUT() {
  return jsonNoStore(
    {
      error:
        "This endpoint has moved. Use /api/vault/[id]/credentials/[credentialId] instead.",
    },
    { status: 410 },
  );
}

export async function DELETE() {
  return jsonNoStore(
    {
      error:
        "This endpoint has moved. Use /api/vault/[id]/credentials/[credentialId] instead.",
    },
    { status: 410 },
  );
}

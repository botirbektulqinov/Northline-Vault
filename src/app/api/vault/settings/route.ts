// This route has been moved to /api/vault/[id]/settings
// Keeping this file empty to avoid 404 during transition.
// All settings operations now use the vault-specific endpoint.
import { jsonNoStore } from "@/lib/server/api";

export const runtime = "nodejs";

export async function PATCH() {
  return jsonNoStore(
    {
      error: "This endpoint has moved. Use /api/vault/[id]/settings instead.",
    },
    { status: 410 },
  );
}

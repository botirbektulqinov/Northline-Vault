// This route has been moved to /api/vault/[id]/rotate-master
// Keeping this file to avoid 404 during transition.
import { jsonNoStore } from "@/lib/server/api";

export const runtime = "nodejs";

export async function POST() {
  return jsonNoStore(
    {
      error: "This endpoint has moved. Use /api/vault/[id]/rotate-master instead.",
    },
    { status: 410 },
  );
}

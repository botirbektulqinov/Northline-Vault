// This route has been moved to /api/vault/[id]/credentials
// Keeping this file to avoid 404 during transition.
import { jsonNoStore } from "@/lib/server/api";

export const runtime = "nodejs";

export async function GET() {
  return jsonNoStore(
    {
      error: "This endpoint has moved. Use /api/vault/[id]/credentials instead.",
    },
    { status: 410 },
  );
}

export async function POST() {
  return jsonNoStore(
    {
      error: "This endpoint has moved. Use /api/vault/[id]/credentials instead.",
    },
    { status: 410 },
  );
}

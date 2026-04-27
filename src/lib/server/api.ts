import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class PublicApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
  }
}

export function jsonNoStore(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function getServerErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonNoStore(
      {
        error: "Validation failed.",
        details: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof PublicApiError) {
    return jsonNoStore({ error: error.message }, { status: error.status });
  }

  const code = getServerErrorCode(error);

  if (code === "P2021" || code === "P2022") {
    return jsonNoStore(
      {
        error: "Vault storage is temporarily unavailable.",
      },
      { status: 503 },
    );
  }

  return jsonNoStore({ error: "Unexpected server error." }, { status: 500 });
}

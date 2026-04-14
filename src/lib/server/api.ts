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

  return jsonNoStore({ error: "Unexpected server error." }, { status: 500 });
}

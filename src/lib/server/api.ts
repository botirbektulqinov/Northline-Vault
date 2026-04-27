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

function getServerErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
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

  const message = getServerErrorMessage(error);
  const code = getServerErrorCode(error);

  if (
    message.includes("Environment variable not found") ||
    message.includes("DATABASE_URL")
  ) {
    return jsonNoStore(
      {
        error:
          "Vault storage is not configured. Set DATABASE_URL in the deployment environment.",
      },
      { status: 503 },
    );
  }

  if (
    code === "P2021" ||
    code === "P2022" ||
    message.includes("does not exist")
  ) {
    return jsonNoStore(
      {
        error:
          "Vault database schema is not ready. Apply the Prisma schema before using the app.",
      },
      { status: 503 },
    );
  }

  return jsonNoStore({ error: "Unexpected server error." }, { status: 500 });
}

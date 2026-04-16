import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, code?: string) {
  const body: { error: string; code?: string } = { error: message };
  if (code) body.code = code;
  return NextResponse.json(body, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal Server Error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Centralized API error handler. Maps known errors to HTTP responses,
 * logs all errors (structured in production), and never exposes stack or internal details in the response.
 */
export function handleApiError(error: unknown, requestId?: string): NextResponse {
  const meta: Record<string, unknown> = {};
  if (requestId) meta.requestId = requestId;

  if (error instanceof ZodError) {
    const message = error.issues.map((e) => e.message).join(", ");
    return badRequest(message, "VALIDATION_ERROR");
  }
  if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
    return error.message === "Unauthorized" ? unauthorized() : forbidden();
  }

  // Log every 5xx-worthy error; never expose stack or internal details in response
  logger.error("API error", { ...meta, error });
  return serverError();
}

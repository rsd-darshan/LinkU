/**
 * Structured logger for LinkU-AI. Avoids leaking PII in production.
 * Can be replaced with Pino later for JSON output.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

function serialize(obj: unknown): Record<string, unknown> {
  if (obj == null) return {};
  if (typeof obj !== "object") return { value: obj };
  if (obj instanceof Error) {
    return {
      message: obj.message,
      name: obj.name,
      ...(process.env.NODE_ENV === "development" && { stack: obj.stack }),
    };
  }
  return obj as Record<string, unknown>;
}

function log(level: LogLevel, message: string, meta?: unknown) {
  const payload = {
    level,
    message,
    ...serialize(meta),
    timestamp: new Date().toISOString(),
  };
  if (process.env.NODE_ENV === "development") {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[linku-ai][${level}]`, message, meta != null ? serialize(meta) : "");
  } else {
    // Production: structured one-liner, no PII in meta by default
    console.log(JSON.stringify(payload));
  }
}

export const linkuAiLogger = {
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
};

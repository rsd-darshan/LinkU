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
    const output = `[linku-ai][${level}] ${message}${meta != null ? ` ${JSON.stringify(serialize(meta))}` : ""}\n`;
    if (level === "error" || level === "warn") {
      process.stderr.write(output);
    } else {
      process.stdout.write(output);
    }
  } else {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }
}

export const linkuAiLogger = {
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
};

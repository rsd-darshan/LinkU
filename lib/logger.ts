/**
 * Simple structured logger for API and server code.
 * Replace with Pino/Axiom in production if needed.
 * In production, avoid logging sensitive data (tokens, PII).
 */
const isProd = process.env.NODE_ENV === "production";

type LogMeta = Record<string, unknown>;

function formatMessage(level: string, message: string, meta?: LogMeta) {
  const payload: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  return isProd ? JSON.stringify(payload) : `[${level}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    process.stdout.write(`${formatMessage("info", message, meta)}\n`);
  },
  warn(message: string, meta?: LogMeta) {
    process.stderr.write(`${formatMessage("warn", message, meta)}\n`);
  },
  error(message: string, meta?: LogMeta & { error?: unknown }) {
    const err = meta?.error;
    const safeMeta = { ...meta };
    if (err instanceof Error) {
      safeMeta.errorName = err.name;
      safeMeta.errorMessage = err.message;
      if (!isProd) safeMeta.stack = err.stack;
    }
    process.stderr.write(`${formatMessage("error", message, safeMeta)}\n`);
  },
};

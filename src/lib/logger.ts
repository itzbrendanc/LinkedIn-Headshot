export type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '"[unserializable]"';
  }
}

function write(level: LogLevel, message: string, ctx?: LogContext) {
  const line = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(ctx ? { ctx } : {}),
  };
  console.log(safeJson(line));
}

export const logger = {
  debug(message: string, ctx?: LogContext) {
    write("debug", message, ctx);
  },
  info(message: string, ctx?: LogContext) {
    write("info", message, ctx);
  },
  warn(message: string, ctx?: LogContext) {
    write("warn", message, ctx);
  },
  error(message: string, ctx?: LogContext) {
    write("error", message, ctx);
  },
};

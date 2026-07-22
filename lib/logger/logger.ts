import "server-only";

import type { LogLevel } from "@/lib/validation";

type LogFields = Readonly<Record<string, unknown>>;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY = /(authorization|cookie|database.?url|password|secret|token)/i;

function redact(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY.test(key)) return "[СКРЫТО]";
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redact(entryValue, entryKey)]),
    );
  }
  return value;
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(context: LogFields): Logger;
}

export function createLogger(options: { level: LogLevel; context?: LogFields }): Logger {
  const context = options.context ?? {};

  const write = (level: LogLevel, message: string, fields: LogFields = {}) => {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[options.level]) return;
    const entry = JSON.stringify(
      redact({ timestamp: new Date().toISOString(), level, message, ...context, ...fields }),
    );
    if (level === "error") console.error(entry);
    else if (level === "warn") console.warn(entry);
    else console.info(entry);
  };

  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
    child: (childContext) => createLogger({ level: options.level, context: { ...context, ...childContext } }),
  };
}

import type { AuditMetadata, AuditMetadataValue } from "./types";

const SENSITIVE_KEY = /(authorization|cookie|database.?url|password|secret|token)/i;
const MAX_DEPTH = 5;
const MAX_KEYS = 50;
const MAX_ARRAY_ITEMS = 50;
const MAX_STRING_LENGTH = 2_000;
const MAX_SERIALIZED_LENGTH = 16_384;

export class InvalidAuditMetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAuditMetadataError";
  }
}

function sanitizeText(value: string) {
  return value.replace(/[\r\n\u2028\u2029]/gu, " ").slice(0, MAX_STRING_LENGTH);
}

function sanitizeValue(value: AuditMetadataValue, depth: number): AuditMetadataValue {
  if (depth > MAX_DEPTH) throw new InvalidAuditMetadataError("Audit metadata превышает глубину");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return sanitizeText(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new InvalidAuditMetadataError("Audit metadata содержит нечисловое значение");
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) {
      throw new InvalidAuditMetadataError("Audit metadata содержит слишком большой массив");
    }
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new InvalidAuditMetadataError("Audit metadata содержит неподдерживаемый объект");
  }

  const entries = Object.entries(value);
  if (entries.length > MAX_KEYS) throw new InvalidAuditMetadataError("Audit metadata содержит слишком много полей");
  return Object.fromEntries(
    entries.map(([key, nestedValue]) => {
      if (SENSITIVE_KEY.test(key)) {
        throw new InvalidAuditMetadataError(`Чувствительное поле ${key} запрещено в audit metadata`);
      }
      return [sanitizeText(key), sanitizeValue(nestedValue, depth + 1)];
    }),
  );
}

export function sanitizeAuditMetadata(metadata: AuditMetadata = {}) {
  const sanitized = sanitizeValue(metadata, 0) as AuditMetadata;
  if (JSON.stringify(sanitized).length > MAX_SERIALIZED_LENGTH) {
    throw new InvalidAuditMetadataError("Audit metadata превышает допустимый размер");
  }
  return Object.freeze(sanitized);
}

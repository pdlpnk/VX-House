const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;
const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
const EMAIL_PROVIDERS = ["development", "disabled"] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];
export type LogLevel = (typeof LOG_LEVELS)[number];
export type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface ValidatedEnvironment {
  readonly NODE_ENV: NodeEnvironment;
  readonly APP_NAME: string;
  readonly LOG_LEVEL: LogLevel;
  readonly DATABASE_URL: string;
  readonly DIRECT_URL?: string;
  readonly SESSION_SECRET: string;
  readonly RATE_LIMIT_SECRET: string;
  readonly DATA_PROTECTION_KEY_ID: string;
  readonly DATA_PROTECTION_KEY: string;
  readonly AUTH_SESSION_IDLE_TTL_SECONDS: number;
  readonly AUTH_SESSION_ABSOLUTE_TTL_SECONDS: number;
  readonly AUTH_SESSION_REFRESH_AFTER_SECONDS: number;
  readonly BRUTE_FORCE_IDENTIFIER_LIMIT: number;
  readonly BRUTE_FORCE_IDENTIFIER_WINDOW_SECONDS: number;
  readonly BRUTE_FORCE_NETWORK_LIMIT: number;
  readonly BRUTE_FORCE_NETWORK_WINDOW_SECONDS: number;
  readonly HEALTH_CHECK_TIMEOUT_MS: number;
  readonly EMAIL_VERIFICATION_SECRET: string;
  readonly EMAIL_PROVIDER: (typeof EMAIL_PROVIDERS)[number];
  readonly EMAIL_CODE_TTL_SECONDS: number;
  readonly EMAIL_CODE_RESEND_COOLDOWN_SECONDS: number;
  readonly EMAIL_CODE_MAX_ATTEMPTS: number;
  readonly EMAIL_CODE_MAX_ACTIVE: number;
  readonly TRUST_PROXY_HEADERS: boolean;
}

export class EnvironmentValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Некорректная серверная конфигурация: ${issues.join("; ")}`);
    this.name = "EnvironmentValidationError";
    this.issues = issues;
  }
}

function required(source: EnvironmentSource, key: string, issues: string[]) {
  const value = source[key]?.trim();
  if (!value) issues.push(`${key}: значение обязательно`);
  return value ?? "";
}

function isPostgresUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}

function isSecureProductionPostgresUrl(value: string) {
  try {
    const url = new URL(value);
    const sslMode = url.searchParams.get("sslmode");
    return (
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1" &&
      ["require", "verify-ca", "verify-full"].includes(sslMode ?? "")
    );
  } catch {
    return false;
  }
}

function looksLikePlaceholder(value: string) {
  return /(change[-_ ]?me|replace[-_ ]?with|placeholder|example|development|local[-_ ]?only)/i.test(value);
}

function positiveInteger(
  source: EnvironmentSource,
  key: string,
  fallback: number,
  issues: string[],
) {
  const raw = source[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    issues.push(`${key}: ожидается положительное целое число`);
    return fallback;
  }
  return value;
}

function booleanValue(source: EnvironmentSource, key: string, fallback: boolean, issues: string[]) {
  const raw = source[key]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  issues.push(`${key}: ожидается true или false`);
  return fallback;
}

export function validateEnvironment(source: EnvironmentSource): ValidatedEnvironment {
  const issues: string[] = [];
  const nodeEnvironment = source.NODE_ENV?.trim() || "development";
  const appName = source.APP_NAME?.trim() || "VX House";
  const logLevel = source.LOG_LEVEL?.trim() || "info";
  const databaseUrl = required(source, "DATABASE_URL", issues);
  const directUrl = source.DIRECT_URL?.trim() || undefined;
  const sessionSecret = required(source, "SESSION_SECRET", issues);
  const rateLimitSecret = required(source, "RATE_LIMIT_SECRET", issues);
  const dataProtectionKeyId = required(source, "DATA_PROTECTION_KEY_ID", issues);
  const dataProtectionKey = required(source, "DATA_PROTECTION_KEY", issues);
  const sessionIdleTtl = positiveInteger(
    source,
    "AUTH_SESSION_IDLE_TTL_SECONDS",
    60 * 60 * 24 * 7,
    issues,
  );
  const sessionAbsoluteTtl = positiveInteger(
    source,
    "AUTH_SESSION_ABSOLUTE_TTL_SECONDS",
    60 * 60 * 24 * 30,
    issues,
  );
  const sessionRefreshAfter = positiveInteger(
    source,
    "AUTH_SESSION_REFRESH_AFTER_SECONDS",
    60 * 60 * 24,
    issues,
  );
  const bruteForceIdentifierLimit = positiveInteger(source, "BRUTE_FORCE_IDENTIFIER_LIMIT", 5, issues);
  const bruteForceIdentifierWindow = positiveInteger(
    source,
    "BRUTE_FORCE_IDENTIFIER_WINDOW_SECONDS",
    15 * 60,
    issues,
  );
  const bruteForceNetworkLimit = positiveInteger(source, "BRUTE_FORCE_NETWORK_LIMIT", 50, issues);
  const bruteForceNetworkWindow = positiveInteger(
    source,
    "BRUTE_FORCE_NETWORK_WINDOW_SECONDS",
    15 * 60,
    issues,
  );
  const healthCheckTimeout = positiveInteger(source, "HEALTH_CHECK_TIMEOUT_MS", 2_000, issues);
  const emailVerificationSecret = required(source, "EMAIL_VERIFICATION_SECRET", issues);
  const emailProvider = source.EMAIL_PROVIDER?.trim() || "development";
  const emailCodeTtl = positiveInteger(source, "EMAIL_CODE_TTL_SECONDS", 10 * 60, issues);
  const emailCodeCooldown = positiveInteger(source, "EMAIL_CODE_RESEND_COOLDOWN_SECONDS", 60, issues);
  const emailCodeMaxAttempts = positiveInteger(source, "EMAIL_CODE_MAX_ATTEMPTS", 5, issues);
  const emailCodeMaxActive = positiveInteger(source, "EMAIL_CODE_MAX_ACTIVE", 2, issues);
  const trustProxyHeaders = booleanValue(source, "TRUST_PROXY_HEADERS", false, issues);

  if (!NODE_ENVIRONMENTS.includes(nodeEnvironment as NodeEnvironment)) {
    issues.push("NODE_ENV: допустимы development, test или production");
  }
  if (!LOG_LEVELS.includes(logLevel as LogLevel)) {
    issues.push("LOG_LEVEL: допустимы debug, info, warn или error");
  }
  if (!EMAIL_PROVIDERS.includes(emailProvider as (typeof EMAIL_PROVIDERS)[number])) {
    issues.push("EMAIL_PROVIDER: допустимы development или disabled");
  }
  if (emailVerificationSecret && emailVerificationSecret.length < 32) {
    issues.push("EMAIL_VERIFICATION_SECRET: требуется не менее 32 символов");
  }
  if (databaseUrl && !isPostgresUrl(databaseUrl)) {
    issues.push("DATABASE_URL: ожидается PostgreSQL URL");
  }
  if (directUrl && !isPostgresUrl(directUrl)) {
    issues.push("DIRECT_URL: ожидается PostgreSQL URL");
  }
  if (sessionSecret && sessionSecret.length < 32) {
    issues.push("SESSION_SECRET: требуется не менее 32 символов");
  }
  if (rateLimitSecret && rateLimitSecret.length < 32) {
    issues.push("RATE_LIMIT_SECRET: требуется не менее 32 символов");
  }
  if (dataProtectionKey && !/^[A-Za-z0-9_-]{43}$/u.test(dataProtectionKey)) {
    issues.push("DATA_PROTECTION_KEY: ожидается base64url-ключ длиной 256 бит");
  }
  if (dataProtectionKeyId && !/^[a-z][a-z0-9_.:-]{2,63}$/u.test(dataProtectionKeyId)) {
    issues.push("DATA_PROTECTION_KEY_ID: некорректный идентификатор ключа");
  }
  if (sessionSecret && rateLimitSecret && sessionSecret === rateLimitSecret) {
    issues.push("RATE_LIMIT_SECRET: должен отличаться от SESSION_SECRET");
  }
  if (dataProtectionKey && [sessionSecret, rateLimitSecret].includes(dataProtectionKey)) {
    issues.push("DATA_PROTECTION_KEY: ключи разных назначений должны отличаться");
  }
  if (
    emailVerificationSecret &&
    [sessionSecret, rateLimitSecret, dataProtectionKey].includes(emailVerificationSecret)
  ) {
    issues.push("EMAIL_VERIFICATION_SECRET: должен быть отдельным секретом");
  }
  if (sessionIdleTtl > sessionAbsoluteTtl) {
    issues.push("AUTH_SESSION_IDLE_TTL_SECONDS: не может превышать абсолютный срок сессии");
  }
  if (sessionRefreshAfter >= sessionIdleTtl) {
    issues.push("AUTH_SESSION_REFRESH_AFTER_SECONDS: должен быть меньше неактивного срока сессии");
  }
  if (healthCheckTimeout < 100 || healthCheckTimeout > 30_000) {
    issues.push("HEALTH_CHECK_TIMEOUT_MS: допустим диапазон от 100 до 30000");
  }
  if (
    bruteForceIdentifierLimit > 1_000_000 ||
    bruteForceNetworkLimit > 1_000_000 ||
    bruteForceIdentifierWindow > 86_400 ||
    bruteForceNetworkWindow > 86_400
  ) {
    issues.push("Brute-force конфигурация превышает безопасные инфраструктурные границы");
  }
  if (nodeEnvironment === "production") {
    if (!isSecureProductionPostgresUrl(databaseUrl)) {
      issues.push("DATABASE_URL: production требует удалённый PostgreSQL с обязательным TLS sslmode");
    }
    if (directUrl && !isSecureProductionPostgresUrl(directUrl)) {
      issues.push("DIRECT_URL: production требует удалённый PostgreSQL с обязательным TLS sslmode");
    }
    if (/^(local|dev|test)[_.:-]/u.test(dataProtectionKeyId)) {
      issues.push("DATA_PROTECTION_KEY_ID: локальный key id запрещён в production");
    }
    if (emailProvider === "development") {
      issues.push("EMAIL_PROVIDER: development transport запрещён в production");
    }
    for (const [key, value] of [
      ["SESSION_SECRET", sessionSecret],
      ["RATE_LIMIT_SECRET", rateLimitSecret],
      ["DATA_PROTECTION_KEY", dataProtectionKey],
      ["EMAIL_VERIFICATION_SECRET", emailVerificationSecret],
    ] as const) {
      if (looksLikePlaceholder(value)) issues.push(`${key}: placeholder запрещён в production`);
    }
  }
  if (issues.length > 0) throw new EnvironmentValidationError(issues);

  return Object.freeze({
    NODE_ENV: nodeEnvironment as NodeEnvironment,
    APP_NAME: appName,
    LOG_LEVEL: logLevel as LogLevel,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
    SESSION_SECRET: sessionSecret,
    RATE_LIMIT_SECRET: rateLimitSecret,
    DATA_PROTECTION_KEY_ID: dataProtectionKeyId,
    DATA_PROTECTION_KEY: dataProtectionKey,
    AUTH_SESSION_IDLE_TTL_SECONDS: sessionIdleTtl,
    AUTH_SESSION_ABSOLUTE_TTL_SECONDS: sessionAbsoluteTtl,
    AUTH_SESSION_REFRESH_AFTER_SECONDS: sessionRefreshAfter,
    BRUTE_FORCE_IDENTIFIER_LIMIT: bruteForceIdentifierLimit,
    BRUTE_FORCE_IDENTIFIER_WINDOW_SECONDS: bruteForceIdentifierWindow,
    BRUTE_FORCE_NETWORK_LIMIT: bruteForceNetworkLimit,
    BRUTE_FORCE_NETWORK_WINDOW_SECONDS: bruteForceNetworkWindow,
    HEALTH_CHECK_TIMEOUT_MS: healthCheckTimeout,
    EMAIL_VERIFICATION_SECRET: emailVerificationSecret,
    EMAIL_PROVIDER: emailProvider as (typeof EMAIL_PROVIDERS)[number],
    EMAIL_CODE_TTL_SECONDS: emailCodeTtl,
    EMAIL_CODE_RESEND_COOLDOWN_SECONDS: emailCodeCooldown,
    EMAIL_CODE_MAX_ATTEMPTS: emailCodeMaxAttempts,
    EMAIL_CODE_MAX_ACTIVE: emailCodeMaxActive,
    TRUST_PROXY_HEADERS: trustProxyHeaders,
  });
}

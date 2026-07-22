import "server-only";

import type { ServerEnvironment } from "./env";
import { SecretValue } from "./secrets";

export function createSecurityConfig(environment: ServerEnvironment) {
  return Object.freeze({
    authentication: Object.freeze({
      sessionSecret: new SecretValue(environment.SESSION_SECRET),
      sessionIdleTtlSeconds: environment.AUTH_SESSION_IDLE_TTL_SECONDS,
      sessionAbsoluteTtlSeconds: environment.AUTH_SESSION_ABSOLUTE_TTL_SECONDS,
      sessionRefreshAfterSeconds: environment.AUTH_SESSION_REFRESH_AFTER_SECONDS,
      secureCookies: environment.NODE_ENV === "production",
    }),
    rateLimiting: Object.freeze({
      keySecret: new SecretValue(environment.RATE_LIMIT_SECRET),
    }),
    bruteForce: Object.freeze({
      identifier: Object.freeze({
        limit: environment.BRUTE_FORCE_IDENTIFIER_LIMIT,
        windowSeconds: environment.BRUTE_FORCE_IDENTIFIER_WINDOW_SECONDS,
      }),
      network: Object.freeze({
        limit: environment.BRUTE_FORCE_NETWORK_LIMIT,
        windowSeconds: environment.BRUTE_FORCE_NETWORK_WINDOW_SECONDS,
      }),
    }),
    dataProtection: Object.freeze({
      keyId: environment.DATA_PROTECTION_KEY_ID,
      key: new SecretValue(environment.DATA_PROTECTION_KEY),
    }),
    monitoring: Object.freeze({
      healthCheckTimeoutMs: environment.HEALTH_CHECK_TIMEOUT_MS,
    }),
    emailVerification: Object.freeze({
      secret: new SecretValue(environment.EMAIL_VERIFICATION_SECRET),
      provider: environment.EMAIL_PROVIDER,
      ttlSeconds: environment.EMAIL_CODE_TTL_SECONDS,
      resendCooldownSeconds: environment.EMAIL_CODE_RESEND_COOLDOWN_SECONDS,
      maxAttempts: environment.EMAIL_CODE_MAX_ATTEMPTS,
      maxActive: environment.EMAIL_CODE_MAX_ACTIVE,
    }),
    network: Object.freeze({ trustProxyHeaders: environment.TRUST_PROXY_HEADERS }),
  });
}

export type SecurityConfig = ReturnType<typeof createSecurityConfig>;

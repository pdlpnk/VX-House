import "server-only";

import { getServerEnvironment } from "./env";
import { createSecurityConfig } from "./security-config";
import { SecretValue } from "./secrets";

export function getServerConfig() {
  const environment = getServerEnvironment();

  return Object.freeze({
    application: Object.freeze({ name: environment.APP_NAME, siteUrl: environment.NEXT_PUBLIC_SITE_URL }),
    runtime: Object.freeze({ environment: environment.NODE_ENV }),
    logging: Object.freeze({ level: environment.LOG_LEVEL }),
    database: Object.freeze({
      url: environment.DATABASE_URL,
      directUrl: environment.DIRECT_URL,
    }),
    security: createSecurityConfig(environment),
    analytics: Object.freeze({
      keitaro: Object.freeze({
        enabled: environment.KEITARO_ENABLED,
        postbackUrl: environment.KEITARO_POSTBACK_URL ? new SecretValue(environment.KEITARO_POSTBACK_URL) : undefined,
        requestTimeoutMs: environment.KEITARO_REQUEST_TIMEOUT_MS,
        maxRetries: environment.KEITARO_MAX_RETRIES,
        dashboardStatus: environment.KEITARO_DASHBOARD_STATUS,
      }),
    }),
  });
}

export type ServerConfig = ReturnType<typeof getServerConfig>;

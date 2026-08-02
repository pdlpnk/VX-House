import "server-only";

import { getServerEnvironment } from "./env";
import { createSecurityConfig } from "./security-config";

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
  });
}

export type ServerConfig = ReturnType<typeof getServerConfig>;

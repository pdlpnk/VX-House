import "server-only";

import { getServerConfig } from "@/lib/config";
import { getDatabase } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { createAuthenticationSystem } from "./authentication";
import { createAuthorizationSystem } from "./authorization";
import { createAuditSystem } from "./audit";
import { createMonitoringSystem } from "./monitoring";
import { createSecurityInfrastructure } from "./security-infrastructure";

export function createServerContext() {
  const config = getServerConfig();
  const authorization = createAuthorizationSystem();

  return Object.freeze({
    authentication: createAuthenticationSystem(),
    authorization,
    audit: createAuditSystem(),
    monitoring: createMonitoringSystem(),
    security: createSecurityInfrastructure(authorization.permissions),
    config,
    database: getDatabase(),
    logger: createLogger({
      level: config.logging.level,
      context: { application: config.application.name },
    }),
  });
}

export type ServerContext = ReturnType<typeof createServerContext>;

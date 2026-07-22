import "server-only";

import { getServerConfig } from "@/lib/config";
import { getDatabase, Prisma } from "@/lib/db";
import { HealthCheckRegistry, OperationalMetrics, ServerDiagnostics } from "@/lib/monitoring";

export function createMonitoringSystem() {
  const config = getServerConfig();
  const health = new HealthCheckRegistry(config.security.monitoring.healthCheckTimeoutMs)
    .register({ name: "process", kind: "liveness", critical: true, run: async () => {} })
    .register({
      name: "database",
      kind: "readiness",
      critical: true,
      run: async () => {
        await getDatabase().$queryRaw(Prisma.sql`SELECT 1`);
      },
    });
  return Object.freeze({
    health,
    metrics: new OperationalMetrics(),
    diagnostics: new ServerDiagnostics(config.application.name, config.runtime.environment),
  });
}

export type MonitoringSystem = ReturnType<typeof createMonitoringSystem>;

import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";
import { cache } from "react";

import { getServerConfig } from "@/lib/config";
import { PrismaClient } from "./generated/client";

const globalDatabase = globalThis as typeof globalThis & {
  vxHouseDatabase?: PrismaClient;
};

function isWorkerdRuntime() {
  return globalThis.navigator?.userAgent === "Cloudflare-Workers";
}

function createStatementNameGenerator() {
  const prefix = randomUUID().replaceAll("-", "").slice(0, 20);
  let sequence = 0;
  return () => `vx_${prefix}_${(sequence++).toString(36)}`;
}

async function serializeDevelopmentQuery<T>(operation: () => Promise<T>) {
  const lockUrl = process.env.VX_DATABASE_LOCK_URL;
  const lockSecret = process.env.VX_DATABASE_LOCK_SECRET;
  if (!lockUrl || !lockSecret) return operation();

  const response = await fetch(`${lockUrl}/acquire`, {
    method: "POST",
    headers: { authorization: `Bearer ${lockSecret}` },
    signal: AbortSignal.timeout(35_000),
  });
  if (!response.ok) {
    throw new Error(`Development database lock failed (${response.status}).`);
  }
  const lease = await response.text();

  try {
    return await operation();
  } finally {
    await fetch(`${lockUrl}/release`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${lockSecret}`,
        "x-vx-database-lease": lease,
      },
    }).catch(() => {});
  }
}

function createDatabaseClient(config = getServerConfig()) {
  const development = config.runtime.environment !== "production";
  const adapter = new PrismaPg(
    {
      connectionString: config.database.url,
      ...(development
        ? {
            max: 1,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
            allowExitOnIdle: true,
          }
        : {}),
    },
    development ? { statementNameGenerator: createStatementNameGenerator() } : undefined,
  );
  const client = new PrismaClient({ adapter });
  if (!development || !isWorkerdRuntime()) return client;

  // Vinext renders layouts and pages in separate Workerd isolates. Prisma
  // Dev Server's local PostgreSQL bridge shares unnamed protocol state across
  // those connections, so development model operations are coordinated by the
  // Node launcher. Production databases keep normal concurrency.
  return client.$extends({
    query: {
      $allModels: {
        $allOperations({ args, query }) {
          return serializeDevelopmentQuery(() => query(args));
        },
      },
    },
  }) as unknown as PrismaClient;
}

const getRequestDatabase = cache(() => createDatabaseClient());

export function getDatabase() {
  const config = getServerConfig();

  // Local Vinext executes RSC layouts and pages concurrently in one Workerd
  // isolate. They must share one pool; creating one client per loader caused
  // PostgreSQL protocol errors and terminated the RSC stream.
  if (isWorkerdRuntime()) {
    return getRequestDatabase();
  }

  globalDatabase.vxHouseDatabase ??= createDatabaseClient(config);
  return globalDatabase.vxHouseDatabase;
}

export async function disconnectDatabase() {
  if (!globalDatabase.vxHouseDatabase) return;
  await globalDatabase.vxHouseDatabase.$disconnect();
  globalDatabase.vxHouseDatabase = undefined;
}

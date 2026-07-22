import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { getServerConfig } from "@/lib/config";
import { PrismaClient } from "./generated/client";

const globalDatabase = globalThis as typeof globalThis & {
  vxHouseDatabase?: PrismaClient;
};

function isWorkerdRuntime() {
  return globalThis.navigator?.userAgent === "Cloudflare-Workers";
}

function createDatabaseClient() {
  const config = getServerConfig();
  const adapter = new PrismaPg({ connectionString: config.database.url });
  return new PrismaClient({ adapter });
}

export function getDatabase() {
  // Workerd does not allow a socket created by one request to be reused by
  // another request. Node keeps the conventional process-level pool.
  if (isWorkerdRuntime()) return createDatabaseClient();
  globalDatabase.vxHouseDatabase ??= createDatabaseClient();
  return globalDatabase.vxHouseDatabase;
}

export async function disconnectDatabase() {
  if (!globalDatabase.vxHouseDatabase) return;
  await globalDatabase.vxHouseDatabase.$disconnect();
  globalDatabase.vxHouseDatabase = undefined;
}

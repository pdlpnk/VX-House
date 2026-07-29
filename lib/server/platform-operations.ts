import "server-only";

import { getServerConfig } from "@/lib/config";
import { AesGcmDataProtector } from "@/lib/data-protection";
import { getDatabase, type PrismaClient } from "@/lib/db";
import { PlatformOperationsService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHousePlatformOperations?: PlatformOperationsService };

export function getPlatformOperationsService(database?: PrismaClient) {
  if (database) {
    const config = getServerConfig().security.dataProtection;
    return new PlatformOperationsService(database, new AesGcmDataProtector(config.keyId, config.key.reveal()));
  }
  if (globalServices.vxHousePlatformOperations) return globalServices.vxHousePlatformOperations;
  const config = getServerConfig().security.dataProtection;
  const service = new PlatformOperationsService(getDatabase(), new AesGcmDataProtector(config.keyId, config.key.reveal()));
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalServices.vxHousePlatformOperations = service;
  return service;
}

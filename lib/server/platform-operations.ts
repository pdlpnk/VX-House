import "server-only";

import { getServerConfig } from "@/lib/config";
import { AesGcmDataProtector } from "@/lib/data-protection";
import { getDatabase } from "@/lib/db";
import { PlatformOperationsService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHousePlatformOperations?: PlatformOperationsService };

export function getPlatformOperationsService() {
  if (globalServices.vxHousePlatformOperations) return globalServices.vxHousePlatformOperations;
  const config = getServerConfig().security.dataProtection;
  const service = new PlatformOperationsService(getDatabase(), new AesGcmDataProtector(config.keyId, config.key.reveal()));
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalServices.vxHousePlatformOperations = service;
  return service;
}

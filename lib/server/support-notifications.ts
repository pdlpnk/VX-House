import "server-only";

import { getServerConfig } from "@/lib/config";
import { AesGcmDataProtector } from "@/lib/data-protection";
import { getDatabase, type PrismaClient } from "@/lib/db";
import { SupportNotificationApplicationService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHouseSupportNotifications?: SupportNotificationApplicationService };
export function getSupportNotificationService(database?: PrismaClient) {
  if (database) {
    const config = getServerConfig().security.dataProtection;
    return new SupportNotificationApplicationService(database, new AesGcmDataProtector(config.keyId, config.key.reveal()));
  }
  if (globalServices.vxHouseSupportNotifications) return globalServices.vxHouseSupportNotifications;
  const config = getServerConfig().security.dataProtection;
  const service = new SupportNotificationApplicationService(getDatabase(), new AesGcmDataProtector(config.keyId, config.key.reveal()));
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalServices.vxHouseSupportNotifications = service;
  return service;
}

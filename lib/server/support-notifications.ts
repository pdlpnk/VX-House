import "server-only";

import { getServerConfig } from "@/lib/config";
import { AesGcmDataProtector } from "@/lib/data-protection";
import { getDatabase } from "@/lib/db";
import { SupportNotificationApplicationService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHouseSupportNotifications?: SupportNotificationApplicationService };
export function getSupportNotificationService() {
  if (globalServices.vxHouseSupportNotifications) return globalServices.vxHouseSupportNotifications;
  const config = getServerConfig().security.dataProtection;
  const service = new SupportNotificationApplicationService(getDatabase(), new AesGcmDataProtector(config.keyId, config.key.reveal()));
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalServices.vxHouseSupportNotifications = service;
  return service;
}

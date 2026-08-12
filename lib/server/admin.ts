import "server-only";

import { getServerConfig } from "@/lib/config";
import { AesGcmDataProtector } from "@/lib/data-protection";
import { getDatabase } from "@/lib/db";
import { AdminApplicationService, AdminMessengerService, AdminTagService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHouseAdmin?: AdminApplicationService };
const globalMessenger = globalThis as typeof globalThis & { vxHouseAdminMessenger?: AdminMessengerService };
const globalTags = globalThis as typeof globalThis & { vxHouseAdminTags?: AdminTagService };

export function getAdminService() {
  if (globalServices.vxHouseAdmin) return globalServices.vxHouseAdmin;
  const config = getServerConfig().security.dataProtection;
  const service = new AdminApplicationService(getDatabase(), new AesGcmDataProtector(config.keyId, config.key.reveal()));
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalServices.vxHouseAdmin = service;
  return service;
}

export function getAdminTagService() {
  if (globalTags.vxHouseAdminTags) return globalTags.vxHouseAdminTags;
  const service = new AdminTagService(getDatabase());
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalTags.vxHouseAdminTags = service;
  return service;
}

export function getAdminMessengerService() {
  if (globalMessenger.vxHouseAdminMessenger) return globalMessenger.vxHouseAdminMessenger;
  const config = getServerConfig().security.dataProtection;
  const service = new AdminMessengerService(getDatabase(), new AesGcmDataProtector(config.keyId, config.key.reveal()));
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalMessenger.vxHouseAdminMessenger = service;
  return service;
}

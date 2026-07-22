import "server-only";

import { getServerConfig } from "@/lib/config";
import { AesGcmDataProtector } from "@/lib/data-protection";
import { getDatabase } from "@/lib/db";
import { AdminApplicationService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHouseAdmin?: AdminApplicationService };

export function getAdminService() {
  if (globalServices.vxHouseAdmin) return globalServices.vxHouseAdmin;
  const config = getServerConfig().security.dataProtection;
  const service = new AdminApplicationService(getDatabase(), new AesGcmDataProtector(config.keyId, config.key.reveal()));
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalServices.vxHouseAdmin = service;
  return service;
}

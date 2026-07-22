import "server-only";

import { getDatabase } from "@/lib/db";
import { EconomyRewardApplicationService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHouseEconomyRewards?: EconomyRewardApplicationService };

export function getEconomyRewardService() {
  if (globalThis.navigator?.userAgent === "Cloudflare-Workers") return new EconomyRewardApplicationService(getDatabase());
  globalServices.vxHouseEconomyRewards ??= new EconomyRewardApplicationService(getDatabase());
  return globalServices.vxHouseEconomyRewards;
}

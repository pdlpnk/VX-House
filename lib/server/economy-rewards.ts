import "server-only";

import { getDatabase, type PrismaClient } from "@/lib/db";
import { EconomyRewardApplicationService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHouseEconomyRewards?: EconomyRewardApplicationService };

export function getEconomyRewardService(database?: PrismaClient) {
  if (database) return new EconomyRewardApplicationService(database);
  if (globalThis.navigator?.userAgent === "Cloudflare-Workers") return new EconomyRewardApplicationService(getDatabase());
  globalServices.vxHouseEconomyRewards ??= new EconomyRewardApplicationService(getDatabase());
  return globalServices.vxHouseEconomyRewards;
}

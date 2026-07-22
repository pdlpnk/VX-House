import "server-only";

import { getDatabase } from "@/lib/db";
import { OpportunityTaskApplicationService } from "@/lib/services";

const globalServices = globalThis as typeof globalThis & { vxHouseOpportunityTasks?: OpportunityTaskApplicationService };

export function getOpportunityTaskService() {
  if (globalThis.navigator?.userAgent === "Cloudflare-Workers") return new OpportunityTaskApplicationService(getDatabase());
  globalServices.vxHouseOpportunityTasks ??= new OpportunityTaskApplicationService(getDatabase());
  return globalServices.vxHouseOpportunityTasks;
}

import type { OpportunityCatalogQuery, OpportunityView } from "@/lib/opportunities/types";
import { errorResponse, getOpportunityTaskService, json, requireRequestPrincipal } from "@/lib/server";

const types = new Set<OpportunityView["type"]>(["TASK", "INSTRUCTION", "PROMOCODE", "FORECAST", "PERSONAL_CONDITION"]);
const availability = new Set<NonNullable<OpportunityCatalogQuery["availability"]>>(["AVAILABLE", "UNAVAILABLE", "PENDING"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim().slice(0, 120) || undefined;
    const typeValue = url.searchParams.get("type") as OpportunityView["type"] | null;
    const availabilityValue = url.searchParams.get("availability") as NonNullable<OpportunityCatalogQuery["availability"]> | null;
    const query: OpportunityCatalogQuery = { search, type: typeValue && types.has(typeValue) ? typeValue : undefined, availability: availabilityValue && availability.has(availabilityValue) ? availabilityValue : undefined };
    return json({ items: await getOpportunityTaskService().list(await requireRequestPrincipal(request), query) });
  } catch (error) { return errorResponse(error); }
}

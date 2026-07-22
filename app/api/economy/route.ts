import { errorResponse, getEconomyRewardService, json, requireRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try { return json(await getEconomyRewardService().getSnapshot(await requireRequestPrincipal(request))); }
  catch (error) { return errorResponse(error); }
}

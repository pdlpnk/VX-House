import { errorResponse, getEconomyRewardService, json, requireRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try { return json({ items: await getEconomyRewardService().listRewards(await requireRequestPrincipal(request)) }); }
  catch (error) { return errorResponse(error); }
}

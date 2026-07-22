import { errorResponse, getPlatformOperationsService, json, requireRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try { return json({ items: await getPlatformOperationsService().listPromocodes(await requireRequestPrincipal(request)) }); }
  catch (error) { return errorResponse(error); }
}

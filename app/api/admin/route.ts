import { errorResponse, getAdminService, json, requireAdminRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try { const principal = await requireAdminRequestPrincipal(request); return json(await getAdminService().dashboard(principal)); }
  catch (error) { return errorResponse(error); }
}

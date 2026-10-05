import { errorResponse, getAdminMessengerService, json, requireAdminRequestPrincipal } from "@/lib/server";
import { isMessengerGeo, type AdminMessengerScope } from "@/lib/admin-messenger";
import { ApplicationError } from "@/lib/application";

export async function GET(request: Request) {
  try {
    const principal = await requireAdminRequestPrincipal(request);
    const params = new URL(request.url).searchParams;
    const scope: AdminMessengerScope = params.get("scope") === "archive" ? "archive" : "active";
    const geo = params.get("geo");
    if (geo !== null && !isMessengerGeo(geo)) throw new ApplicationError("VALIDATION", "Invalid GEO");
    return json(await getAdminMessengerService().list(principal, params.get("q") ?? "", scope, params.get("tag") ?? undefined, geo ?? undefined));
  } catch (error) {
    return errorResponse(error);
  }
}

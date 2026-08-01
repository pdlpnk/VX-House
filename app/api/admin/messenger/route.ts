import { errorResponse, getAdminMessengerService, json, requireAdminRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try {
    const principal = await requireAdminRequestPrincipal(request);
    return json(await getAdminMessengerService().list(principal, new URL(request.url).searchParams.get("q") ?? ""));
  } catch (error) {
    return errorResponse(error);
  }
}

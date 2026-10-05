import { errorResponse, getAdminMessengerService, json, readJsonBody, requireAdminRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireAdminRequestPrincipal(request);
    const body = await readJsonBody(request);
    return json(await getAdminMessengerService().changeGeo(principal, (await params).id, body.country));
  } catch (error) { return errorResponse(error); }
}

import { deriveNetworkIdentifier, errorResponse, getIdentitySystem, json, limitRequest, normalizedIdentifier, readJsonBody, requireTrustedOrigin } from "@/lib/server/identity-delivery";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const body = await readJsonBody(request);
    const email = normalizedIdentifier(body.email);
    await limitRequest({ namespace: "password-reset.request.network", key: deriveNetworkIdentifier(request), limit: 20, windowSeconds: 3600 });
    await limitRequest({ namespace: "password-reset.request.identifier", key: email || "invalid", limit: 5, windowSeconds: 3600 });
    const result = await getIdentitySystem().passwordReset.request({
      email,
      language: typeof body.language === "string" ? body.language : null,
    });
    return json(result, { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
}

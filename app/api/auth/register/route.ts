import { errorResponse, deriveNetworkIdentifier, getIdentitySystem, json, limitRequest, normalizedIdentifier, readJsonBody, requireTrustedOrigin } from "@/lib/server";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const body = await readJsonBody(request);
    const network = deriveNetworkIdentifier(request);
    const email = normalizedIdentifier(body.email);
    await limitRequest({ namespace: "registration.network", key: network, limit: 10, windowSeconds: 3600 });
    await limitRequest({ namespace: "registration.identifier", key: email || "invalid", limit: 5, windowSeconds: 3600 });
    const result = await getIdentitySystem().onboarding.register({
      command: body,
      idempotencyKey: String(body.idempotencyKey ?? request.headers.get("idempotency-key") ?? ""),
    });
    return json(
      {
        user: { id: result.userId, displayName: result.profile.user.displayName },
        profile: result.profile,
        deliveryAvailable: result.deliveryAvailable,
        redirectTo: result.redirectTo,
      },
      { status: result.replayed ? 200 : 201, headers: { "set-cookie": result.setCookie } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

import { deriveNetworkIdentifier, errorResponse, getIdentitySystem, json, limitRequest, normalizedIdentifier, readJsonBody, requireTrustedOrigin } from "@/lib/server/identity-delivery";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const body = await readJsonBody(request);
    const email = normalizedIdentifier(body.email);
    await limitRequest({ namespace: "password-reset.verify.network", key: deriveNetworkIdentifier(request), limit: 40, windowSeconds: 900 });
    await limitRequest({ namespace: "password-reset.verify.identifier", key: email || "invalid", limit: 10, windowSeconds: 900 });
    const result = await getIdentitySystem().passwordReset.verify({ email, code: typeof body.code === "string" ? body.code : "" });
    if (!result.ok) {
      const message = result.code === "EXPIRED_CODE" ? "Срок действия кода истёк." : result.code === "ATTEMPTS_EXHAUSTED" ? "Лимит попыток исчерпан. Запросите новый код." : "Код не подошёл.";
      return json({ error: result.code, message }, { status: 400 });
    }
    return json({ ok: true }, { headers: { "set-cookie": result.setCookie } });
  } catch (error) {
    return errorResponse(error);
  }
}

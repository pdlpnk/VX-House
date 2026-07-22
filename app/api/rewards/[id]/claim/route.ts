import { deriveNetworkIdentifier, errorResponse, getEconomyRewardService, json, limitRequest, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    await limitRequest({ namespace: "rewards.claim", key: `${principal.userId}:${deriveNetworkIdentifier(request)}`, limit: 20, windowSeconds: 3600 });
    const input = await readJsonBody(request);
    return json(await getEconomyRewardService().claimReward(principal, (await params).id, String(input.idempotencyKey ?? "")));
  } catch (error) { return errorResponse(error); }
}

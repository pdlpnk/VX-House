const NON_HUMAN_USER_AGENT = /bot|crawler|spider|preview|healthcheck/iu;

export function shouldRecordDashboardRequest(headers: Headers) {
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""}`.toLowerCase();
  const userAgent = headers.get("user-agent") ?? "";

  return !headers.has("next-router-prefetch")
    && !purpose.includes("prefetch")
    && !NON_HUMAN_USER_AGENT.test(userAgent);
}

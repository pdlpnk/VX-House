import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SECURITY_EVENT_TYPES } from "@/lib/security";
import { decideProductWorkspaceAccess } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getIdentitySystem } from "./identity-onboarding";
import { securityServices } from "./identity-delivery";

const logger = createLogger({ level: "info", context: { component: "workspace-guard" } });

async function currentAuthentication() {
  const requestHeaders = await headers();
  const request = new Request("http://vx-house.local/", { headers: requestHeaders });
  const system = getIdentitySystem();
  const authentication = await system.authentication.authenticate(system.cookies.read(request));
  const correlationId = requestHeaders.get("x-request-id") ?? crypto.randomUUID();
  logger.info("dashboard_session_resolved", {
    correlationId,
    authenticated: authentication.ok,
  });
  return { authentication, correlationId, system };
}

export async function requireProductWorkspace(kind: "PLAYER" | "PARTNER", returnTo: string) {
  return (await requireProductWorkspaceContext(kind, returnTo)).profile;
}

export async function requireProductWorkspaceContext(kind: "PLAYER" | "PARTNER", returnTo: string) {
  const { authentication, correlationId, system } = await currentAuthentication();
  if (!authentication.ok) redirect(`/access?mode=login&returnTo=${encodeURIComponent(returnTo)}`);
  const snapshot = await system.onboarding.getSnapshot(authentication.principal);
  if (!snapshot.profile) redirect("/access");
  logger.info("dashboard_profile_loaded", {
    correlationId,
    userId: authentication.principal.userId,
    role: snapshot.profile.productRole,
    onboardingStatus: snapshot.status,
  });
  const decision = decideProductWorkspaceAccess({ requestedRole: kind, actualRole: snapshot.profile.productRole, onboardingStatus: snapshot.status, accountStatus: snapshot.profile.accountStatus, onboardingRedirectTo: snapshot.redirectTo });
  if (!decision.allowed) {
    await securityServices().security.record({
      type: SECURITY_EVENT_TYPES.permissionDenied,
      actor: { type: "user", id: authentication.principal.userId, sessionId: authentication.principal.sessionId },
      target: { type: "workspace", id: returnTo },
      metadata: { policyKey: `workspace.${kind.toLowerCase()}`, reason: decision.reason },
    });
    redirect(decision.redirectTo);
  }
  return { principal: authentication.principal, profile: snapshot.profile, correlationId, database: system.database };
}

export async function requireAdminWorkspace() {
  const { authentication } = await currentAuthentication();
  if (!authentication.ok) redirect("/access?mode=login&returnTo=%2Fadmin");
  if (!authentication.principal.roleKeys.includes("admin")) {
    await securityServices().security.record({
      type: SECURITY_EVENT_TYPES.permissionDenied,
      actor: { type: "user", id: authentication.principal.userId, sessionId: authentication.principal.sessionId },
      target: { type: "workspace", id: "/admin" },
      metadata: { policyKey: "workspace.admin", reason: "INFRASTRUCTURE_ROLE_REQUIRED" },
    });
    redirect("/");
  }
  return authentication.principal;
}

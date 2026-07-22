import type { AuthenticatedPrincipal } from "@/lib/auth";
import type { AuthorizationPolicy } from "@/lib/policies";
import { PermissionEvaluationService } from "@/lib/services";
import { ApplicationError } from "./errors";

export function requireApplicationAuthorization(input: {
  principal: AuthenticatedPrincipal | null;
  policy: AuthorizationPolicy;
  ownerId?: string | null;
}) {
  const decision = new PermissionEvaluationService().evaluate({
    principal: input.principal,
    policy: input.policy,
    resource:
      input.ownerId === undefined
        ? undefined
        : { type: "application-resource", id: input.ownerId ?? "unknown", ownerId: input.ownerId ?? null },
  });
  if (!decision.allowed) {
    throw new ApplicationError("FORBIDDEN", "Недостаточно прав для операции", {
      policy: decision.policyKey,
      reason: decision.reason,
    });
  }
}

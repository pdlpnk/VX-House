import "server-only";

import type {
  AuthorizationRequest,
  AuthorizationReason,
  PolicyAuthorizationDecision,
} from "@/lib/auth/authorization-types";
import type { AuthorizationRule } from "@/lib/policies";

type RuleResult = Readonly<{ allowed: boolean; reason: AuthorizationReason }>;

const allowed: RuleResult = Object.freeze({ allowed: true, reason: "ALLOWED" });

function denied(reason: AuthorizationReason): RuleResult {
  return { allowed: false, reason };
}

function evaluateRule(rule: AuthorizationRule, request: AuthorizationRequest): RuleResult {
  const principal = request.principal;

  switch (rule.kind) {
    case "authenticated":
      return principal ? allowed : denied("AUTHENTICATION_REQUIRED");
    case "role":
      if (!principal) return denied("AUTHENTICATION_REQUIRED");
      if (rule.anyOf.length === 0) return denied("INVALID_POLICY");
      return rule.anyOf.some((role) => principal.roleKeys.includes(role))
        ? allowed
        : denied("ROLE_REQUIRED");
    case "permission":
      if (!principal) return denied("AUTHENTICATION_REQUIRED");
      if (rule.allOf.length === 0) return denied("INVALID_POLICY");
      return rule.allOf.every((permission) => principal.permissionKeys.includes(permission))
        ? allowed
        : denied("PERMISSION_REQUIRED");
    case "owner":
      if (!principal) return denied("AUTHENTICATION_REQUIRED");
      if (!request.resource) return denied("RESOURCE_REQUIRED");
      return request.resource.ownerId === principal.userId
        ? allowed
        : denied("OWNERSHIP_REQUIRED");
    case "all": {
      if (rule.rules.length === 0) return denied("INVALID_POLICY");
      for (const childRule of rule.rules) {
        const result = evaluateRule(childRule, request);
        if (!result.allowed) return result;
      }
      return allowed;
    }
    case "any": {
      if (rule.rules.length === 0) return denied("INVALID_POLICY");
      const results = rule.rules.map((childRule) => evaluateRule(childRule, request));
      if (results.some((result) => result.allowed)) return allowed;
      if (results.some((result) => result.reason === "AUTHENTICATION_REQUIRED")) {
        return denied("AUTHENTICATION_REQUIRED");
      }
      return denied("NO_POLICY_RULE_MATCHED");
    }
  }
}

export class PermissionEvaluationService {
  evaluate(request: AuthorizationRequest): PolicyAuthorizationDecision {
    const result = evaluateRule(request.policy.rule, request);
    return Object.freeze({
      allowed: result.allowed,
      policyKey: request.policy.key,
      reason: result.reason,
    });
  }
}

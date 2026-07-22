import type { AuthenticatedPrincipal, RouteAccessPolicy } from "./types";

export class AuthenticationRequiredError extends Error {
  readonly code = "AUTHENTICATION_REQUIRED";

  constructor() {
    super("Требуется аутентификация");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationDeniedError extends Error {
  readonly code = "AUTHORIZATION_DENIED";

  constructor() {
    super("Недостаточно прав");
    this.name = "AuthorizationDeniedError";
  }
}

export function requireAuthenticated(
  principal: AuthenticatedPrincipal | null | undefined,
): AuthenticatedPrincipal {
  if (!principal) throw new AuthenticationRequiredError();
  return principal;
}

export function requireInfrastructureRole(
  principal: AuthenticatedPrincipal | null | undefined,
  allowedRoles: readonly string[],
) {
  const authenticated = requireAuthenticated(principal);
  if (!allowedRoles.some((role) => authenticated.roleKeys.includes(role))) {
    throw new AuthorizationDeniedError();
  }
  return authenticated;
}

export function enforceRoutePolicy(
  policy: RouteAccessPolicy,
  principal: AuthenticatedPrincipal | null,
) {
  if (policy.kind === "public") return principal;
  if (policy.kind === "authenticated") return requireAuthenticated(principal);
  return requireInfrastructureRole(principal, policy.roles);
}

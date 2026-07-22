import "server-only";

import type { AuthenticationService } from "@/lib/services";
import type { SessionCookieManager } from "./session-cookie";
import type { AuthenticatedPrincipal, RouteAccessPolicy } from "./types";
import { enforceRoutePolicy } from "./guards";
import { hasTrustedRequestOrigin } from "./request-origin";

export interface ProtectedRequestContext {
  readonly principal: AuthenticatedPrincipal | null;
}

export type ProtectedRequestHandler = (
  request: Request,
  context: ProtectedRequestContext,
) => Response | Promise<Response>;

export interface AuthenticationMiddlewareDependencies {
  readonly authentication: AuthenticationService;
  readonly cookies: SessionCookieManager;
}

function unauthorized() {
  return Response.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "AUTHORIZATION_DENIED" }, { status: 403 });
}

export function withRouteProtection(
  dependencies: AuthenticationMiddlewareDependencies,
  policy: RouteAccessPolicy,
  handler: ProtectedRequestHandler,
) {
  return async (request: Request) => {
    let principal: AuthenticatedPrincipal | null = null;

    if (policy.kind !== "public") {
      const token = dependencies.cookies.read(request);
      const authentication = await dependencies.authentication.authenticate(token);
      if (!authentication.ok) return unauthorized();
      principal = authentication.principal;
    }

    try {
      enforceRoutePolicy(policy, principal);
      return await handler(request, { principal });
    } catch (error) {
      if (error instanceof Error && error.name === "AuthenticationRequiredError") return unauthorized();
      if (error instanceof Error && error.name === "AuthorizationDeniedError") return forbidden();
      throw error;
    }
  };
}

export function withTrustedOrigin(
  handler: (request: Request) => Response | Promise<Response>,
  allowedOrigins: readonly string[] = [],
) {
  return (request: Request) => {
    if (!hasTrustedRequestOrigin(request, allowedOrigins)) {
      return Response.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
    }
    return handler(request);
  };
}

import "server-only";

import type { AuthorizationResource } from "./authorization-types";
import type { SessionCookieManager } from "./session-cookie";
import type { AuthenticationService, PermissionEvaluationService } from "@/lib/services";
import type { AuthorizationPolicy } from "@/lib/policies";
import type { AuthenticatedPrincipal } from "./types";

export interface AuthorizationMiddlewareDependencies {
  readonly authentication: AuthenticationService;
  readonly cookies: SessionCookieManager;
  readonly permissions: PermissionEvaluationService;
}

export interface AuthorizedRequestContext {
  readonly principal: AuthenticatedPrincipal;
  readonly resource: AuthorizationResource | null;
}

export type AuthorizationResourceLoader = (
  request: Request,
  principal: AuthenticatedPrincipal,
) => Promise<AuthorizationResource | null>;

export type AuthorizedRequestHandler = (
  request: Request,
  context: AuthorizedRequestContext,
) => Response | Promise<Response>;

function authorizationFailure(status: 401 | 403) {
  const error = status === 401 ? "AUTHENTICATION_REQUIRED" : "AUTHORIZATION_DENIED";
  return Response.json({ error }, { status });
}

export function withAuthorization(
  dependencies: AuthorizationMiddlewareDependencies,
  policy: AuthorizationPolicy,
  handler: AuthorizedRequestHandler,
  loadResource?: AuthorizationResourceLoader,
) {
  return async (request: Request) => {
    const authentication = await dependencies.authentication.authenticate(
      dependencies.cookies.read(request),
    );
    if (!authentication.ok) return authorizationFailure(401);

    const resource = loadResource
      ? await loadResource(request, authentication.principal)
      : null;
    const decision = dependencies.permissions.evaluate({
      principal: authentication.principal,
      policy,
      resource,
    });
    if (!decision.allowed) return authorizationFailure(403);

    return handler(request, { principal: authentication.principal, resource });
  };
}

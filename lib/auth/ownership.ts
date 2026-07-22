import type { AuthenticatedPrincipal } from "./types";
import type { AuthorizationResource } from "./authorization-types";

export interface OwnershipResolver<TReference> {
  resolve(reference: TReference, principal: AuthenticatedPrincipal): Promise<AuthorizationResource | null>;
}

export async function resolveOwnedResource<TReference>(
  resolver: OwnershipResolver<TReference>,
  reference: TReference,
  principal: AuthenticatedPrincipal,
) {
  return resolver.resolve(reference, principal);
}

import "server-only";

import type { AuthorizationRequest } from "@/lib/auth";
import { requirePolicyAuthorization } from "@/lib/auth";
import type { AesGcmDataProtector, DataProtectionContext, EncryptedPayload } from "@/lib/data-protection";
import type { PermissionEvaluationService } from "./permission-evaluation-service";

export class ProtectedDataService {
  constructor(
    private readonly protector: AesGcmDataProtector,
    private readonly permissions: PermissionEvaluationService,
  ) {}

  protect(value: Uint8Array, context: DataProtectionContext) {
    return this.protector.encrypt(value, context);
  }

  unprotect(
    payload: EncryptedPayload,
    context: DataProtectionContext,
    authorization: AuthorizationRequest,
  ) {
    requirePolicyAuthorization(this.permissions, authorization);
    return this.protector.decrypt(payload, context);
  }
}

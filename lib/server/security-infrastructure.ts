import "server-only";

import { AesGcmDataProtector } from "@/lib/data-protection";
import { getServerConfig } from "@/lib/config";
import { getDatabase } from "@/lib/db";
import { PrismaRateLimitRepository } from "@/lib/repositories";
import {
  BruteForceProtectionService,
  ProtectedDataService,
  RateLimitService,
  type PermissionEvaluationService,
} from "@/lib/services";

export function createSecurityInfrastructure(permissions: PermissionEvaluationService) {
  const config = getServerConfig().security;
  const rateLimitRepository = new PrismaRateLimitRepository(getDatabase());
  const rateLimits = new RateLimitService(rateLimitRepository, config.rateLimiting.keySecret.reveal());
  const bruteForce = new BruteForceProtectionService(rateLimits, config.bruteForce);
  const protector = new AesGcmDataProtector(
    config.dataProtection.keyId,
    config.dataProtection.key.reveal(),
  );
  return Object.freeze({
    rateLimits,
    bruteForce,
    protectedData: new ProtectedDataService(protector, permissions),
    rateLimitRepository,
  });
}

export type SecurityInfrastructure = ReturnType<typeof createSecurityInfrastructure>;

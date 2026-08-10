import "server-only";

import { cache } from "react";

import { PasswordResetCookieManager, SessionCookieManager, SessionTokenManager, VerificationCodeHasher } from "@/lib/auth";
import { getServerConfig } from "@/lib/config";
import { getDatabase } from "@/lib/db";
import { PrismaAuthRepository } from "@/lib/repositories";
import {
  AuthenticationService,
  DevelopmentEmailProvider,
  IdentityOnboardingService,
  PasswordResetService,
  ResendEmailProvider,
  UnavailableEmailProvider,
} from "@/lib/services";
import { getAnalyticsSystem } from "./analytics";

const globalIdentity = globalThis as typeof globalThis & {
  vxHouseIdentitySystem?: ReturnType<typeof buildIdentitySystem>;
};

function buildIdentitySystem() {
  const config = getServerConfig();
  const database = getDatabase();
  const authenticationConfig = config.security.authentication;
  const verificationConfig = config.security.emailVerification;
  const tokens = new SessionTokenManager(authenticationConfig.sessionSecret.reveal());
  const cookies = new SessionCookieManager({
    secure: authenticationConfig.secureCookies,
    maxAgeSeconds: authenticationConfig.sessionIdleTtlSeconds,
  });
  const authentication = new AuthenticationService(
    new PrismaAuthRepository(database),
    tokens,
    cookies,
    authenticationConfig,
  );
  const emailProvider = verificationConfig.provider === "development" && config.runtime.environment !== "production"
    ? new DevelopmentEmailProvider(config.runtime.environment === "test" ? "test" : "development")
    : verificationConfig.provider === "resend" && verificationConfig.apiKey && verificationConfig.from
      ? new ResendEmailProvider({
          apiKey: verificationConfig.apiKey.reveal(),
          from: verificationConfig.from,
          timeoutMs: verificationConfig.requestTimeoutMs,
        })
      : new UnavailableEmailProvider();
  const onboarding = new IdentityOnboardingService(
    database,
    tokens,
    cookies,
    new VerificationCodeHasher(verificationConfig.secret.reveal()),
    emailProvider,
    {
      sessionIdleTtlSeconds: authenticationConfig.sessionIdleTtlSeconds,
      sessionAbsoluteTtlSeconds: authenticationConfig.sessionAbsoluteTtlSeconds,
      verificationTtlSeconds: verificationConfig.ttlSeconds,
      resendCooldownSeconds: verificationConfig.resendCooldownSeconds,
      maxVerificationAttempts: verificationConfig.maxAttempts,
      maxActiveChallenges: verificationConfig.maxActive,
    },
    getAnalyticsSystem().service,
  );
  const passwordResetCookies = new PasswordResetCookieManager(authenticationConfig.secureCookies);
  const passwordReset = new PasswordResetService(
    database,
    new VerificationCodeHasher(verificationConfig.secret.reveal()),
    tokens,
    passwordResetCookies,
    emailProvider,
    {
      ttlSeconds: verificationConfig.ttlSeconds,
      resetProofTtlSeconds: verificationConfig.ttlSeconds,
      resendCooldownSeconds: verificationConfig.resendCooldownSeconds,
      maxAttempts: verificationConfig.maxAttempts,
    },
  );
  return Object.freeze({ authentication, onboarding, passwordReset, cookies, passwordResetCookies, emailProvider, config, database });
}

const getRequestIdentitySystem = cache(buildIdentitySystem);

export function getIdentitySystem() {
  if (globalThis.navigator?.userAgent === "Cloudflare-Workers") return getRequestIdentitySystem();

  globalIdentity.vxHouseIdentitySystem ??= buildIdentitySystem();
  return globalIdentity.vxHouseIdentitySystem;
}

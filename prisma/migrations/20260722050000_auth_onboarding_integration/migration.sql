CREATE TYPE "OnboardingStatus" AS ENUM (
  'ACCOUNT_CREATED',
  'CONTACT_PENDING',
  'CONTACT_VERIFIED',
  'CONSENTS_PENDING',
  'PROFILE_READY',
  'PARTNER_APPROVAL_PENDING',
  'COMPLETED'
);

CREATE TABLE "OnboardingProgress" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "status" "OnboardingStatus" NOT NULL DEFAULT 'ACCOUNT_CREATED',
  "ageConfirmedAt" TIMESTAMP(3),
  "profileReadyAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailVerificationChallenge" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "codeHash" CHAR(64) NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "resendAvailableAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnboardingProgress_userId_key" ON "OnboardingProgress"("userId");
CREATE INDEX "OnboardingProgress_status_updatedAt_idx" ON "OnboardingProgress"("status", "updatedAt");
CREATE INDEX "EmailVerificationChallenge_userId_createdAt_idx" ON "EmailVerificationChallenge"("userId", "createdAt");
CREATE INDEX "EmailVerificationChallenge_expiresAt_idx" ON "EmailVerificationChallenge"("expiresAt");

ALTER TABLE "OnboardingProgress"
  ADD CONSTRAINT "OnboardingProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailVerificationChallenge"
  ADD CONSTRAINT "EmailVerificationChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailVerificationChallenge"
  ADD CONSTRAINT "EmailVerificationChallenge_attempts_check"
    CHECK ("attemptCount" >= 0 AND "maxAttempts" > 0 AND "attemptCount" <= "maxAttempts"),
  ADD CONSTRAINT "EmailVerificationChallenge_window_check"
    CHECK ("expiresAt" > "createdAt" AND "resendAvailableAt" >= "createdAt"),
  ADD CONSTRAINT "EmailVerificationChallenge_code_hash_check"
    CHECK ("codeHash" ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "EmailVerificationChallenge_terminal_check"
    CHECK ("consumedAt" IS NULL OR "revokedAt" IS NULL);

CREATE TABLE "PasswordResetChallenge" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "codeHash" CHAR(64) NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "resendAvailableAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "resetTokenHash" VARCHAR(128),
  "resetExpiresAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PasswordResetChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetChallenge_resetTokenHash_key"
  ON "PasswordResetChallenge"("resetTokenHash");
CREATE INDEX "PasswordResetChallenge_userId_createdAt_idx"
  ON "PasswordResetChallenge"("userId", "createdAt");
CREATE INDEX "PasswordResetChallenge_expiresAt_idx"
  ON "PasswordResetChallenge"("expiresAt");

ALTER TABLE "PasswordResetChallenge"
  ADD CONSTRAINT "PasswordResetChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

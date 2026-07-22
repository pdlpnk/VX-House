-- Functional Integration Module 6: forecasts, promocode ownership and final MVP operations.
CREATE TYPE "PromocodeActivationStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');

ALTER TABLE "ForecastAccessRule"
  ADD CONSTRAINT "ForecastAccessRule_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PromocodeActivation" (
    "id" UUID NOT NULL,
    "promocodeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "PromocodeActivationStatus" NOT NULL DEFAULT 'ACTIVE',
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    CONSTRAINT "PromocodeActivation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PromocodeActivation_idempotencyKey_key" ON "PromocodeActivation"("idempotencyKey");
CREATE UNIQUE INDEX "PromocodeActivation_promocodeId_userId_key" ON "PromocodeActivation"("promocodeId", "userId");
CREATE INDEX "PromocodeActivation_userId_status_activatedAt_idx" ON "PromocodeActivation"("userId", "status", "activatedAt");
CREATE INDEX "PromocodeActivation_promocodeId_status_idx" ON "PromocodeActivation"("promocodeId", "status");
ALTER TABLE "PromocodeActivation" ADD CONSTRAINT "PromocodeActivation_promocodeId_fkey" FOREIGN KEY ("promocodeId") REFERENCES "Promocode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromocodeActivation" ADD CONSTRAINT "PromocodeActivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PromocodeActivationHistory" (
    "id" UUID NOT NULL,
    "activationId" UUID NOT NULL,
    "fromStatus" "PromocodeActivationStatus",
    "toStatus" "PromocodeActivationStatus" NOT NULL,
    "actorId" UUID,
    "reason" VARCHAR(500) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromocodeActivationHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PromocodeActivationHistory_activationId_occurredAt_idx" ON "PromocodeActivationHistory"("activationId", "occurredAt");
ALTER TABLE "PromocodeActivationHistory" ADD CONSTRAINT "PromocodeActivationHistory_activationId_fkey" FOREIGN KEY ("activationId") REFERENCES "PromocodeActivation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER "PromocodeActivationHistory_append_only" BEFORE UPDATE OR DELETE ON "PromocodeActivationHistory" FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();

INSERT INTO "Permission" ("id", "key", "name", "description", "updatedAt") VALUES
('21000000-0000-4000-8000-000000000018', 'forecasts.read', 'Просмотр прогнозов', 'Просмотр доступных прогнозов.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000019', 'promocodes.read', 'Просмотр промокодов', 'Просмотр применимых промокодов.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000020', 'promocodes.activate', 'Активация промокодов', 'Активация применимого промокода владельцем.', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p."id", r."id" FROM "Permission" p CROSS JOIN "Role" r
WHERE r."key" = 'admin' AND p."key" IN ('forecasts.read','promocodes.read','promocodes.activate')
ON CONFLICT DO NOTHING;

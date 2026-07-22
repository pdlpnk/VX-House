-- Functional Integration Module 4: real support categories, appeal and notification histories.
CREATE TABLE "SupportCategory" (
    "id" UUID NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "roles" JSONB NOT NULL,
    "marketId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportCategory_key_key" ON "SupportCategory"("key");
CREATE INDEX "SupportCategory_marketId_isActive_idx" ON "SupportCategory"("marketId", "isActive");
ALTER TABLE "SupportCategory" ADD CONSTRAINT "SupportCategory_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "SupportCategory" ("id", "key", "title", "description", "roles", "updatedAt") VALUES
('10000000-0000-4000-8000-000000000001', 'access', 'Доступ к платформе', 'Вопросы о доступе, роли, стране и состоянии профиля.', '["PLAYER","PARTNER"]', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000002', 'task', 'Задание', 'Условия, инструкция, срок и подготовка результата.', '["PLAYER","PARTNER"]', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000003', 'review', 'Проверка результата', 'Статус проверки, уточнение и объяснение решения.', '["PLAYER","PARTNER"]', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000004', 'reward', 'VX Rewards', 'Тип Reward, основание, статус и способ предоставления.', '["PLAYER","PARTNER"]', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000005', 'account', 'Профиль и настройки', 'Контактные данные, страна и настройки пространства.', '["PLAYER","PARTNER"]', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000006', 'appeal', 'Апелляция', 'Пересмотр решения с сохранением связанного контекста.', '["PLAYER","PARTNER"]', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000007', 'partnership', 'Сотрудничество', 'Условия и рабочие вопросы партнёрского взаимодействия.', '["PARTNER"]', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_category_fkey" FOREIGN KEY ("category") REFERENCES "SupportCategory"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appeal" ADD COLUMN "userTaskId" UUID;
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_userTaskId_fkey" FOREIGN KEY ("userTaskId") REFERENCES "UserTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Appeal_userTaskId_idx" ON "Appeal"("userTaskId");
ALTER TABLE "Appeal" DROP CONSTRAINT "Appeal_target_check";
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_target_check" CHECK (num_nonnulls("userTaskId", "submissionReviewId", "trustScoreEventId", "rewardId") >= 1);

CREATE TABLE "AppealStatusHistory" (
    "id" UUID NOT NULL,
    "appealId" UUID NOT NULL,
    "fromStatus" "AppealStatus",
    "toStatus" "AppealStatus" NOT NULL,
    "actorId" UUID,
    "reason" VARCHAR(1000) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppealStatusHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AppealStatusHistory_appealId_occurredAt_idx" ON "AppealStatusHistory"("appealId", "occurredAt");
ALTER TABLE "AppealStatusHistory" ADD CONSTRAINT "AppealStatusHistory_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "Appeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "NotificationStatusHistory" (
    "id" UUID NOT NULL,
    "notificationId" UUID NOT NULL,
    "fromStatus" "NotificationStatus",
    "toStatus" "NotificationStatus" NOT NULL,
    "actorId" UUID,
    "reason" VARCHAR(500) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationStatusHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NotificationStatusHistory_notificationId_occurredAt_idx" ON "NotificationStatusHistory"("notificationId", "occurredAt");
ALTER TABLE "NotificationStatusHistory" ADD CONSTRAINT "NotificationStatusHistory_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER "AppealStatusHistory_append_only" BEFORE UPDATE OR DELETE ON "AppealStatusHistory" FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();
CREATE TRIGGER "NotificationStatusHistory_append_only" BEFORE UPDATE OR DELETE ON "NotificationStatusHistory" FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();

CREATE OR REPLACE FUNCTION "protect_submitted_appeal_source"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD."status" <> 'DRAFT' AND (
        NEW."reason" IS DISTINCT FROM OLD."reason" OR
        NEW."userTaskId" IS DISTINCT FROM OLD."userTaskId" OR
        NEW."submissionReviewId" IS DISTINCT FROM OLD."submissionReviewId" OR
        NEW."trustScoreEventId" IS DISTINCT FROM OLD."trustScoreEventId" OR
        NEW."rewardId" IS DISTINCT FROM OLD."rewardId"
    ) THEN RAISE EXCEPTION 'Submitted appeal source is immutable';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER "Appeal_submitted_source_immutable" BEFORE UPDATE ON "Appeal" FOR EACH ROW EXECUTE FUNCTION "protect_submitted_appeal_source"();

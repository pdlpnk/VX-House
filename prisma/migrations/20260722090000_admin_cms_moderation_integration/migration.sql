-- Functional Integration Module 5: administrative operations, versioned CMS and moderation audit.
CREATE TABLE "UserAccountStatusHistory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userProfileId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "fromStatus" "AccountStatus" NOT NULL,
    "toStatus" "AccountStatus" NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAccountStatusHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "UserAccountStatusHistory_userId_occurredAt_idx" ON "UserAccountStatusHistory"("userId", "occurredAt");
CREATE INDEX "UserAccountStatusHistory_actorId_occurredAt_idx" ON "UserAccountStatusHistory"("actorId", "occurredAt");
ALTER TABLE "UserAccountStatusHistory" ADD CONSTRAINT "UserAccountStatusHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAccountStatusHistory" ADD CONSTRAINT "UserAccountStatusHistory_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAccountStatusHistory" ADD CONSTRAINT "UserAccountStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PartnerApprovalHistory" (
    "id" UUID NOT NULL,
    "partnerProfileId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "fromStatus" "PartnerProfileStatus" NOT NULL,
    "toStatus" "PartnerProfileStatus" NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerApprovalHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PartnerApprovalHistory_partnerProfileId_occurredAt_idx" ON "PartnerApprovalHistory"("partnerProfileId", "occurredAt");
CREATE INDEX "PartnerApprovalHistory_actorId_occurredAt_idx" ON "PartnerApprovalHistory"("actorId", "occurredAt");
ALTER TABLE "PartnerApprovalHistory" ADD CONSTRAINT "PartnerApprovalHistory_partnerProfileId_fkey" FOREIGN KEY ("partnerProfileId") REFERENCES "PartnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerApprovalHistory" ADD CONSTRAINT "PartnerApprovalHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AdminContentRevision" (
    "id" UUID NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "createdById" UUID NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminContentRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminContentRevision_entityType_entityId_version_key" ON "AdminContentRevision"("entityType", "entityId", "version");
CREATE INDEX "AdminContentRevision_entityType_status_createdAt_idx" ON "AdminContentRevision"("entityType", "status", "createdAt");
CREATE INDEX "AdminContentRevision_createdById_createdAt_idx" ON "AdminContentRevision"("createdById", "createdAt");
ALTER TABLE "AdminContentRevision" ADD CONSTRAINT "AdminContentRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "NotificationBatch" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "audience" JSONB NOT NULL,
    "type" VARCHAR(120) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationBatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationBatch_idempotencyKey_key" ON "NotificationBatch"("idempotencyKey");
CREATE INDEX "NotificationBatch_actorId_createdAt_idx" ON "NotificationBatch"("actorId", "createdAt");
ALTER TABLE "NotificationBatch" ADD CONSTRAINT "NotificationBatch_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD COLUMN "batchId" UUID;
CREATE INDEX "Notification_batchId_idx" ON "Notification"("batchId");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "NotificationBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TRIGGER "UserAccountStatusHistory_append_only" BEFORE UPDATE OR DELETE ON "UserAccountStatusHistory" FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();
CREATE TRIGGER "PartnerApprovalHistory_append_only" BEFORE UPDATE OR DELETE ON "PartnerApprovalHistory" FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();
CREATE TRIGGER "AdminContentRevision_append_only" BEFORE UPDATE OR DELETE ON "AdminContentRevision" FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();
CREATE TRIGGER "NotificationBatch_append_only" BEFORE UPDATE OR DELETE ON "NotificationBatch" FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();

INSERT INTO "Role" ("id", "key", "name", "description", "updatedAt") VALUES
('20000000-0000-4000-8000-000000000001', 'admin', 'Администратор', 'Инфраструктурная роль административной панели.', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Permission" ("id", "key", "name", "description", "updatedAt") VALUES
('21000000-0000-4000-8000-000000000001', 'admin.dashboard.read', 'Статистика Admin', 'Просмотр операционной статистики.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000002', 'users.read', 'Просмотр пользователей', 'Поиск и просмотр профилей.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000003', 'users.write', 'Статусы пользователей', 'Блокировка, разблокировка и статусы.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000004', 'users.role.write', 'Роли пользователей', 'Разрешённые изменения продуктовой роли.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000005', 'users.partner.approve', 'Одобрение партнёров', 'Решения по партнёрскому доступу.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000006', 'content.read', 'Просмотр контента', 'Просмотр CMS и версий.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000007', 'content.write', 'Редактирование контента', 'Создание новых версий контента.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000008', 'content.publish', 'Публикация контента', 'Публикация и архивация версий.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000009', 'moderation.read', 'Очередь модерации', 'Просмотр отправленных результатов.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000010', 'moderation.write', 'Решения модерации', 'Подтверждение, отклонение и уточнение.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000011', 'support.admin', 'Операции поддержки', 'Назначение, ответы и внутренние заметки.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000012', 'economy.admin', 'Корректировки экономики', 'Append-only ручные корректировки.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000013', 'audit.read', 'Просмотр аудита', 'Просмотр неизменяемого журнала.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000014', 'support.write', 'Изменение поддержки', 'Серверные переходы обращений.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000015', 'appeals.write', 'Решения апелляций', 'Серверные решения по апелляциям.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000016', 'economy.write', 'Изменение экономики', 'Серверные события экономики.', CURRENT_TIMESTAMP),
('21000000-0000-4000-8000-000000000017', 'notifications.write', 'Отправка уведомлений', 'Серверная отправка уведомлений.', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p."id", r."id" FROM "Permission" p CROSS JOIN "Role" r
WHERE r."key" = 'admin' AND p."key" IN (
  'admin.dashboard.read','users.read','users.write','users.role.write','users.partner.approve',
  'content.read','content.write','content.publish','moderation.read','moderation.write','support.admin',
  'economy.admin','audit.read','support.write','appeals.write','economy.write','notifications.write'
)
ON CONFLICT DO NOTHING;

-- Operational notification coverage for server-side moderation and administration.
CREATE OR REPLACE FUNCTION "append_operational_notification"(
  target_user UUID,
  event_type TEXT,
  event_title TEXT,
  event_body TEXT,
  related_type TEXT,
  related_id TEXT,
  event_key TEXT,
  actor_id UUID,
  occurred_at TIMESTAMP(3)
) RETURNS VOID AS $$
DECLARE notification_id UUID;
BEGIN
  INSERT INTO "Notification" (
    "id", "userId", "type", "channel", "status", "title", "body",
    "relatedType", "relatedId", "idempotencyKey", "sentAt", "createdAt"
  ) VALUES (
    gen_random_uuid(), target_user, event_type, 'IN_APP', 'SENT', event_title, event_body,
    related_type, related_id, event_key, occurred_at, occurred_at
  ) ON CONFLICT ("idempotencyKey") DO NOTHING
  RETURNING "id" INTO notification_id;

  IF notification_id IS NOT NULL THEN
    INSERT INTO "NotificationStatusHistory" (
      "id", "notificationId", "fromStatus", "toStatus", "actorId", "reason", "occurredAt"
    ) VALUES (
      gen_random_uuid(), notification_id, NULL, 'SENT', actor_id,
      'Серверное событие платформы', occurred_at
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "notify_submission_review"() RETURNS TRIGGER AS $$
DECLARE owner_id UUID;
BEGIN
  SELECT ut."userId" INTO owner_id
  FROM "TaskSubmission" ts
  JOIN "UserTask" ut ON ut."id" = ts."userTaskId"
  WHERE ts."id" = (SELECT sv."taskSubmissionId" FROM "SubmissionVersion" sv WHERE sv."id" = NEW."submissionVersionId");
  PERFORM "append_operational_notification"(
    owner_id, 'task.reviewed', 'Проверка задания завершена', NEW."reason",
    'USER_TASK', (SELECT ut."id"::TEXT FROM "TaskSubmission" ts JOIN "UserTask" ut ON ut."id" = ts."userTaskId" JOIN "SubmissionVersion" sv ON sv."taskSubmissionId" = ts."id" WHERE sv."id" = NEW."submissionVersionId"),
    'task-reviewed:' || NEW."id"::TEXT, NEW."reviewerId", NEW."decidedAt"
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "SubmissionReview_notify_owner" AFTER INSERT ON "SubmissionReview" FOR EACH ROW EXECUTE FUNCTION "notify_submission_review"();

CREATE OR REPLACE FUNCTION "notify_support_operator_message"() RETURNS TRIGGER AS $$
DECLARE owner_id UUID;
BEGIN
  IF NEW."authorType" = 'OPERATOR' THEN
    SELECT "userId" INTO owner_id FROM "SupportConversation" WHERE "id" = NEW."conversationId";
    PERFORM "append_operational_notification"(
      owner_id, 'support.reply', 'Получен ответ поддержки', 'В обращении появилось новое сообщение.',
      'SUPPORT_CONVERSATION', NEW."conversationId"::TEXT, 'support-reply:' || NEW."id"::TEXT,
      NEW."authorId", NEW."createdAt"
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "SupportMessage_notify_owner" AFTER INSERT ON "SupportMessage" FOR EACH ROW EXECUTE FUNCTION "notify_support_operator_message"();

CREATE OR REPLACE FUNCTION "notify_partner_approval"() RETURNS TRIGGER AS $$
DECLARE owner_id UUID;
BEGIN
  SELECT up."userId" INTO owner_id FROM "PartnerProfile" pp JOIN "UserProfile" up ON up."id" = pp."userProfileId" WHERE pp."id" = NEW."partnerProfileId";
  PERFORM "append_operational_notification"(
    owner_id, 'partner.status', 'Изменился статус партнёрского профиля', NEW."reason",
    'PARTNER_PROFILE', NEW."partnerProfileId"::TEXT, 'partner-status:' || NEW."id"::TEXT,
    NEW."actorId", NEW."occurredAt"
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "PartnerApprovalHistory_notify_owner" AFTER INSERT ON "PartnerApprovalHistory" FOR EACH ROW EXECUTE FUNCTION "notify_partner_approval"();

CREATE OR REPLACE FUNCTION "notify_admin_points_adjustment"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."sourceType" = 'ADMIN_ADJUSTMENT' THEN
    PERFORM "append_operational_notification"(
      NEW."userId", 'economy.adjusted', 'Скорректированы VX Points', NEW."reason",
      'POINTS_ENTRY', NEW."id"::TEXT, 'points-adjusted:' || NEW."id"::TEXT,
      NEW."sourceId"::UUID, NEW."occurredAt"
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "VXPointsLedgerEntry_notify_adjustment" AFTER INSERT ON "VXPointsLedgerEntry" FOR EACH ROW EXECUTE FUNCTION "notify_admin_points_adjustment"();

CREATE OR REPLACE FUNCTION "notify_admin_trust_adjustment"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."eventType" = 'ADMIN_ADJUSTMENT' AND NEW."sourceType" = 'ADMIN' THEN
    PERFORM "append_operational_notification"(
      NEW."userId", 'trust.adjusted', 'Обновлён Trust Score', NEW."reason",
      'TRUST_EVENT', NEW."id"::TEXT, 'trust-adjusted:' || NEW."id"::TEXT,
      NEW."sourceId"::UUID, NEW."occurredAt"
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "TrustScoreEvent_notify_adjustment" AFTER INSERT ON "TrustScoreEvent" FOR EACH ROW EXECUTE FUNCTION "notify_admin_trust_adjustment"();

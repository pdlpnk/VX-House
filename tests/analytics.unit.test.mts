import assert from "node:assert/strict";
import { test } from "node:test";

import { buildKeitaroPostbackUrl, keitaroStatus, keitaroTransactionId, sanitizeFirstTouch, shouldRecordDashboardRequest, validKeitaroSubId, validateClientAnalyticsCommand } from "../lib/analytics/index.ts";

test("subid/clickid и first-touch параметры проходят строгую очистку", () => {
  assert.equal(validKeitaroSubId("click_ABC-123.~"), "click_ABC-123.~");
  assert.equal(validKeitaroSubId("<script>alert(1)</script>"), null);
  assert.equal(sanitizeFirstTouch({ clickid: "alias-1", subid: "invalid value", landing_path: "/?secret=removed", referrer: "https://example.com/path?token=hidden", utm_source: "campaign" }, new Date("2026-08-06T00:00:00Z")).subid, "alias-1");
  const touch = sanitizeFirstTouch({ landing_path: "https://evil.example", referrer: "javascript:alert(1)" });
  assert.equal(touch.landing_path, "/");
  assert.equal(touch.referrer, null);
});

test("клиентский API принимает только allowlist событий и metadata", () => {
  assert.deepEqual(validateClientAnalyticsCommand({ eventName: "access_clicked", clientEventId: "event-12345678", metadata: { placement: "hero", password: "secret" } }).metadata, { placement: "hero" });
  assert.throws(() => validateClientAnalyticsCommand({ eventName: "email_confirmed" }));
  assert.throws(() => validateClientAnalyticsCommand({ eventName: "access_clicked", clientEventId: "short", metadata: { placement: "hero" } }));
  assert.throws(() => validateClientAnalyticsCommand({ eventName: "access_clicked", clientEventId: "event-12345678", metadata: { placement: "unknown" } }));
});

test("Keitaro URL кодирует subid/status и использует стабильный уникальный tid", () => {
  const eventId = "11111111-1111-4111-8111-111111111111";
  const tid = keitaroTransactionId("email_confirmed", eventId);
  assert.equal(tid, keitaroTransactionId("email_confirmed", eventId));
  assert.notEqual(tid, keitaroTransactionId("registration_started", eventId));
  const url = buildKeitaroPostbackUrl("https://tracker.example/secret/postback", { subid: "a+b/c?", status: "sale ready", transactionId: tid });
  assert.equal(url.searchParams.get("subid"), "a+b/c?");
  assert.equal(url.searchParams.get("status"), "sale ready");
  assert.match(url.toString(), /subid=a%2Bb%2Fc%3F/u);
  assert.equal(keitaroStatus("registration_started"), "lead");
  assert.equal(keitaroStatus("email_confirmed"), "sale");
  assert.equal(keitaroStatus("dashboard_opened"), null);
  assert.equal(keitaroStatus("dashboard_opened", "activated"), "activated");
});

test("prefetch, боты и health-check не считаются открытием Dashboard", () => {
  assert.equal(shouldRecordDashboardRequest(new Headers({ "user-agent": "Mozilla/5.0" })), true);
  assert.equal(shouldRecordDashboardRequest(new Headers({ "next-router-prefetch": "1" })), false);
  assert.equal(shouldRecordDashboardRequest(new Headers({ "sec-purpose": "prefetch" })), false);
  assert.equal(shouldRecordDashboardRequest(new Headers({ "user-agent": "ExampleBot/1.0" })), false);
  assert.equal(shouldRecordDashboardRequest(new Headers({ "user-agent": "healthcheck" })), false);
});

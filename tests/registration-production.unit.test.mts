import assert from "node:assert/strict";
import { test } from "node:test";

import { hasTrustedRequestOrigin } from "../lib/auth/request-origin.ts";
import {
  EmailDeliveryError,
  ResendEmailProvider,
  UnavailableEmailProvider,
} from "../lib/services/email-provider.ts";
import { EnvironmentValidationError, validateEnvironment } from "../lib/validation/index.ts";

const publicOrigin = "https://vxhouse.online";

function unsafeRequest(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { method: "POST", headers });
}

test("безопасные методы проходят без Origin", () => {
  assert.equal(hasTrustedRequestOrigin(new Request(`${publicOrigin}/api/health`)), true);
});

test("прямой same-origin POST проходит", () => {
  assert.equal(
    hasTrustedRequestOrigin(unsafeRequest(`${publicOrigin}/api/auth/register`, { origin: publicOrigin })),
    true,
  );
});

test("POST за доверенным reverse proxy использует внешний proto и host", () => {
  const request = unsafeRequest("http://127.0.0.1:3000/api/auth/register", {
    origin: publicOrigin,
    host: "127.0.0.1:3000",
    "x-forwarded-proto": "https",
    "x-forwarded-host": "vxhouse.online",
  });
  assert.equal(hasTrustedRequestOrigin(request, { trustProxyHeaders: true }), true);
  assert.equal(hasTrustedRequestOrigin(request, { trustProxyHeaders: false }), false);
});

test("явный публичный origin работает независимо от внутреннего URL", () => {
  const request = unsafeRequest("http://127.0.0.1:3000/api/auth/register", { origin: publicOrigin });
  assert.equal(hasTrustedRequestOrigin(request, { allowedOrigins: [publicOrigin] }), true);
});

test("чужой, отсутствующий и некорректный Origin отклоняются без исключения", () => {
  assert.equal(hasTrustedRequestOrigin(unsafeRequest(`${publicOrigin}/api`, { origin: "https://evil.invalid" })), false);
  assert.equal(hasTrustedRequestOrigin(unsafeRequest(`${publicOrigin}/api`)), false);
  assert.doesNotThrow(() => hasTrustedRequestOrigin(unsafeRequest(`${publicOrigin}/api`, { origin: "not a url" })));
  assert.equal(hasTrustedRequestOrigin(unsafeRequest(`${publicOrigin}/api`, { origin: "not a url" })), false);
});

test("неправильные протокол и порт не считаются тем же origin", () => {
  assert.equal(hasTrustedRequestOrigin(unsafeRequest(`${publicOrigin}/api`, { origin: "http://vxhouse.online" })), false);
  assert.equal(hasTrustedRequestOrigin(unsafeRequest(`${publicOrigin}/api`, { origin: "https://vxhouse.online:444" })), false);
});

test("allowed origin нормализует завершающий slash", () => {
  const request = unsafeRequest("http://127.0.0.1:3000/api", { origin: publicOrigin });
  assert.equal(hasTrustedRequestOrigin(request, { allowedOrigins: [`${publicOrigin}/`] }), true);
});

test("недоверенные forwarded host и proto не расширяют allowlist", () => {
  const request = unsafeRequest("http://127.0.0.1:3000/api", {
    origin: publicOrigin,
    "x-forwarded-proto": "javascript",
    "x-forwarded-host": "vxhouse.online@evil.invalid",
  });
  assert.equal(hasTrustedRequestOrigin(request, { trustProxyHeaders: true }), false);
});

test("Resend получает минимальный запрос и ключ идемпотентности", async () => {
  let captured: { url: string; init?: RequestInit } | undefined;
  const provider = new ResendEmailProvider({
    apiKey: "re_test_key_that_must_never_be_logged",
    from: "VX House <noreply@vxhouse.online>",
    timeoutMs: 2_000,
    fetchImplementation: (async (input: URL | RequestInfo, init?: RequestInit) => {
      captured = { url: String(input), init };
      return new Response(JSON.stringify({ id: "email-id" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  });
  await provider.sendVerificationCode({
    idempotencyKey: "challenge-123",
    userId: "user-123",
    email: "user@example.com",
    code: "123456",
    expiresAt: new Date("2026-08-02T12:10:00.000Z"),
    language: "ru",
  });
  assert.equal(captured?.url, "https://api.resend.com/emails");
  const headers = new Headers(captured?.init?.headers);
  assert.equal(headers.get("idempotency-key"), "vxhouse-verification/challenge-123");
  assert.equal(headers.get("authorization"), "Bearer re_test_key_that_must_never_be_logged");
  const body = JSON.parse(String(captured?.init?.body)) as Record<string, unknown>;
  assert.equal(body.from, "VX House <noreply@vxhouse.online>");
  assert.deepEqual(body.to, ["user@example.com"]);
  assert.equal(body.subject, "Код подтверждения VX House");
  assert.match(String(body.text), /123456/);
});

test("ошибка Resend и disabled provider имеют безопасное стабильное сообщение", async () => {
  const secret = "re_secret_never_exposed";
  const provider = new ResendEmailProvider({
    apiKey: secret,
    from: "noreply@vxhouse.online",
    timeoutMs: 2_000,
    fetchImplementation: (async () => new Response(`provider leaked ${secret}`, { status: 500 })) as typeof fetch,
  });
  const message = {
    idempotencyKey: "challenge-456",
    userId: "user-456",
    email: "user@example.com",
    code: "654321",
    expiresAt: new Date("2026-08-02T12:10:00.000Z"),
    language: "ru" as const,
  };
  await assert.rejects(provider.sendVerificationCode(message), (error: unknown) => {
    assert.ok(error instanceof EmailDeliveryError);
    assert.equal(error.message.includes(secret), false);
    assert.equal(error.message.includes("provider leaked"), false);
    return true;
  });
  await assert.rejects(new UnavailableEmailProvider().sendVerificationCode(message), EmailDeliveryError);
});

function productionEnvironment(overrides: Record<string, string> = {}) {
  return {
    NODE_ENV: "production",
    APP_NAME: "VX House",
    NEXT_PUBLIC_SITE_URL: publicOrigin,
    DATABASE_URL: "postgresql://vxhouse:password@127.0.0.1:5432/vxhouse?sslmode=disable",
    SESSION_SECRET: "s".repeat(40),
    RATE_LIMIT_SECRET: "r".repeat(40),
    DATA_PROTECTION_KEY_ID: "production.primary",
    DATA_PROTECTION_KEY: "A".repeat(43),
    EMAIL_VERIFICATION_SECRET: "e".repeat(40),
    EMAIL_PROVIDER: "resend",
    RESEND_API_KEY: "re_" + "k".repeat(32),
    EMAIL_FROM: "noreply@vxhouse.online",
    ...overrides,
  };
}

test("production принимает локальный PostgreSQL и полную Resend конфигурацию", () => {
  const environment = validateEnvironment(productionEnvironment());
  assert.equal(environment.NEXT_PUBLIC_SITE_URL, publicOrigin);
  assert.equal(environment.EMAIL_PROVIDER, "resend");
});

test("production отклоняет Resend без ключа или отправителя", () => {
  assert.throws(
    () => validateEnvironment(productionEnvironment({ RESEND_API_KEY: "", EMAIL_FROM: "" })),
    (error: unknown) => error instanceof EnvironmentValidationError
      && error.issues.some((issue) => issue.startsWith("RESEND_API_KEY"))
      && error.issues.some((issue) => issue.startsWith("EMAIL_FROM")),
  );
});

test("environment отклоняет невалидный site URL", () => {
  assert.throws(
    () => validateEnvironment(productionEnvironment({ NEXT_PUBLIC_SITE_URL: "not-a-url" })),
    (error: unknown) => error instanceof EnvironmentValidationError
      && error.issues.some((issue) => issue.includes("корректный HTTP(S) origin")),
  );
});

test("Keitaro включается только с публичным HTTPS endpoint в production", () => {
  const enabled = validateEnvironment(productionEnvironment({
    KEITARO_ENABLED: "true",
    KEITARO_POSTBACK_URL: "https://tracker.example/private-key/postback",
  }));
  assert.equal(enabled.KEITARO_ENABLED, true);
  assert.equal(enabled.KEITARO_REQUEST_TIMEOUT_MS, 5_000);
  assert.equal(enabled.KEITARO_MAX_RETRIES, 5);

  for (const unsafeUrl of [
    "http://tracker.example/postback",
    "https://localhost/postback",
    "https://127.0.0.1/postback",
    "https://10.0.0.1/postback",
    "https://192.168.1.10/postback",
    "https://[::1]/postback",
    "https://[fd00::1]/postback",
  ]) {
    assert.throws(
      () => validateEnvironment(productionEnvironment({ KEITARO_ENABLED: "true", KEITARO_POSTBACK_URL: unsafeUrl })),
      (error: unknown) => error instanceof EnvironmentValidationError
        && error.issues.some((issue) => issue.includes("публичный HTTPS endpoint")),
    );
  }
});

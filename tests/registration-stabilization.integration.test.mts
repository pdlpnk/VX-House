import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен");

Object.assign(process.env, {
  NODE_ENV: "development",
  DATABASE_URL: connectionString,
  DIRECT_URL: connectionString,
  SESSION_SECRET: randomBytes(48).toString("base64url"),
  RATE_LIMIT_SECRET: randomBytes(48).toString("base64url"),
  DATA_PROTECTION_KEY_ID: "test.registration",
  DATA_PROTECTION_KEY: randomBytes(32).toString("base64url"),
  EMAIL_VERIFICATION_SECRET: randomBytes(48).toString("base64url"),
  EMAIL_PROVIDER: "development",
  NEXT_PUBLIC_SITE_URL: "https://vxhouse.online",
  BRUTE_FORCE_IDENTIFIER_LIMIT: "50",
  BRUTE_FORCE_NETWORK_LIMIT: "100",
});

const { PrismaClient } = await import("../lib/db/generated-node/client.ts");
const database = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const port = 31_317;
const origin = `http://127.0.0.1:${port}`;
const password = "StableRegistration!2026";
let application: ChildProcess | undefined;

function request(path: string, init: RequestInit = {}, cookie?: string) {
  return new Request(`${origin}${path}`, {
    ...init,
    headers: {
      ...(init.method && init.method !== "GET" ? { origin, "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...init.headers,
    },
  });
}

function send(path: string, init: RequestInit = {}, cookie?: string) {
  return fetch(request(path, init, cookie));
}

function sessionCookie(response: Response) {
  const value = response.headers.get("set-cookie");
  assert.ok(value, "ответ должен установить session cookie");
  assert.match(value, /Path=\//i);
  assert.match(value, /HttpOnly/i);
  assert.match(value, /SameSite=Lax/i);
  assert.doesNotMatch(value, /;\s*Secure/i, "localhost development cookie не должна требовать HTTPS");
  return value.split(";", 1)[0]!;
}

async function json<T>(response: Response) {
  return (await response.json()) as T;
}

async function seedRequiredIdentityData() {
  const documents = new Map<string, { id: string }>();
  for (const [key, title] of [
    ["terms", "Условия использования"],
    ["privacy", "Политика конфиденциальности"],
  ] as const) {
    documents.set(
      key,
      await database.consentDocument.create({ data: { key, title, isRequired: true }, select: { id: true } }),
    );
  }
  for (const [code, name, defaultLanguage] of [
    ["TR", "Турция", "TR"],
    ["AZ", "Азербайджан", "AZ"],
  ] as const) {
    const market = await database.market.create({ data: { code, name, defaultLanguage, isActive: true } });
    for (const [key, document] of documents) {
      for (const language of ["RU", defaultLanguage] as const) {
        await database.consentVersion.create({
          data: {
            consentDocumentId: document.id,
            marketId: market.id,
            version: 1,
            language,
            contentHash: `${key}-${code}-${language}`.padEnd(64, "0"),
            publishedAt: new Date("2026-01-01T00:00:00.000Z"),
            effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
          },
        });
      }
    }
  }
}

before(async () => {
  await database.$executeRawUnsafe('TRUNCATE TABLE "AuditEvent", "User", "Market", "ConsentDocument", "RateLimitBucket" CASCADE');
  await seedRequiredIdentityData();
  const vinext = fileURLToPath(new URL("../node_modules/vinext/dist/cli.js", import.meta.url));
  application = spawn(process.execPath, [vinext, "dev", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/registration-test.log" },
    stdio: "inherit",
  });
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (application.exitCode != null) throw new Error("Тестовый сервер завершился при запуске");
    try {
      const response = await fetch(`${origin}/access`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Тестовый сервер не запустился");
});

after(async () => {
  application?.kill("SIGTERM");
  if (application?.exitCode == null) {
    await new Promise<void>((resolve) => application?.once("exit", () => resolve()));
  }
  await database.$disconnect();
});

for (const account of [
  { role: "PLAYER", market: "TR", locale: "RU", expectedRoute: "/dashboard" },
  { role: "PLAYER", market: "AZ", locale: "AZ", expectedRoute: "/dashboard" },
  { role: "PLAYER", market: "TR", locale: "TR", expectedRoute: "/dashboard" },
] as const) {
  test(`полный HTTP-сценарий регистрации и повторного входа: ${account.role}/${account.market}/${account.locale}`, async () => {
    const email = `${account.role.toLowerCase()}-${randomUUID()}@registration.invalid`;
    const registration = await send(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          displayName: account.role === "PLAYER" ? "Тестовый игрок" : "Тестовый партнёр",
          email,
          password,
          productRole: account.role,
          marketCode: account.market,
          preferredLanguage: account.locale,
          idempotencyKey: randomUUID(),
        }),
      },
    );
    assert.equal(registration.status, 201, JSON.stringify(await registration.clone().json()));
    let cookie = sessionCookie(registration);

    const verificationCode = await send("/api/auth/email/development-code", {}, cookie);
    assert.equal(verificationCode.status, 200);
    const { code } = await json<{ code: string }>(verificationCode);
    const verified = await send(
      "/api/auth/email/verify",
      { method: "POST", body: JSON.stringify({ code }) },
      cookie,
    );
    assert.equal(verified.status, 200);

    const snapshotResponse = await send("/api/onboarding", {}, cookie);
    assert.equal(snapshotResponse.status, 200);
    const snapshot = await json<{ requiredConsents: Array<{ id: string }> }>(snapshotResponse);
    const completed = await send(
      "/api/onboarding/complete",
      {
        method: "POST",
        body: JSON.stringify({
          ageConfirmed: true,
          consentVersionIds: snapshot.requiredConsents.map(({ id }) => id),
          idempotencyKey: randomUUID(),
        }),
      },
      cookie,
    );
    assert.equal(completed.status, 200);
    assert.equal((await json<{ redirectTo: string }>(completed)).redirectTo, account.expectedRoute);

    const restored = await send("/api/auth/me", {}, cookie);
    assert.equal(restored.status, 200);
    assert.equal((await json<{ redirectTo: string }>(restored)).redirectTo, account.expectedRoute);

    for (let refresh = 0; refresh < 2; refresh += 1) {
      const dashboard = await send(account.expectedRoute, {}, cookie);
      assert.equal(dashboard.status, 200, await dashboard.clone().text());
      const html = await dashboard.text();
      assert.doesNotMatch(html, /Connection terminated unexpectedly|portal &quot;&quot; does not exist|RUNTIME ERROR/i);
      assert.match(
        html,
        account.role === "PLAYER" ? /Следующий шаг/ : /Партнёрское пространство/,
        "кабинет должен отрисоваться с пустыми серверными данными",
      );
    }

    const loggedOut = await send("/api/auth/logout", { method: "POST", body: "{}" }, cookie);
    assert.equal(loggedOut.status, 200);
    assert.equal((await send("/api/auth/me", {}, cookie)).status, 401);

    const login = await send(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    assert.equal(login.status, 200, JSON.stringify(await login.clone().json()));
    assert.equal((await json<{ redirectTo: string }>(login.clone())).redirectTo, account.expectedRoute);
    cookie = sessionCookie(login);
    const dashboardAfterLogin = await send(account.expectedRoute, {}, cookie);
    assert.equal(dashboardAfterLogin.status, 200, await dashboardAfterLogin.clone().text());

    const refreshed = await send("/api/auth/refresh", { method: "POST", body: "{}" }, cookie);
    assert.equal(refreshed.status, 200);
    cookie = sessionCookie(refreshed);
    assert.equal((await send("/api/auth/me", {}, cookie)).status, 200);

    const user = await database.user.findUniqueOrThrow({
      where: { email },
      include: {
        profile: { include: { playerProfile: true, partnerProfile: true } },
        onboardingProgress: true,
        sessions: true,
        userConsents: true,
      },
    });
    assert.equal(user.profile?.productRole, account.role);
    assert.equal(user.profile?.marketId != null, true);
    assert.equal(user.profile?.preferredLanguage, account.locale);
    assert.equal(user.profile?.playerProfile != null, account.role === "PLAYER");
    assert.equal(user.profile?.partnerProfile != null, account.role === "PARTNER");
    assert.ok(user.sessions.length >= 2);
    assert.equal(user.userConsents.length, 2);
    assert.ok(["COMPLETED", "PARTNER_APPROVAL_PENDING"].includes(user.onboardingProgress?.status ?? ""));
  });
}

test("публичный API отклоняет прямую попытку регистрации PARTNER", async () => {
  const before = await database.user.count();
  const response = await send("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      displayName: "Недоступный партнёр",
      email: `partner-${randomUUID()}@registration.invalid`,
      password,
      productRole: "PARTNER",
      marketCode: "TR",
      preferredLanguage: "RU",
      idempotencyKey: randomUUID(),
    }),
  });
  assert.equal(response.status, 403);
  assert.equal((await json<{ error: string }>(response)).error, "FORBIDDEN");
  assert.equal(await database.user.count(), before);
});

test("невалидная регистрация не оставляет частичных записей и возвращает обработанную ошибку", async () => {
  const before = await database.user.count();
  const response = await send(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        displayName: "А",
        email: "not-an-email",
        password: "short",
        productRole: "PLAYER",
        marketCode: "US",
        preferredLanguage: "EN",
        idempotencyKey: randomUUID(),
      }),
    },
  );
  assert.equal(response.status, 400);
  const body = await json<{ error: string; message: string }>(response);
  assert.equal(body.error, "VALIDATION");
  assert.ok(body.message.length > 0);
  assert.equal(await database.user.count(), before);
});

test("повторная отправка регистрации с тем же ключом не создаёт второй аккаунт", async () => {
  const email = `idempotent-${randomUUID()}@registration.invalid`;
  const idempotencyKey = randomUUID();
  const body = JSON.stringify({
    displayName: "Идемпотентный пользователь",
    email,
    password,
    productRole: "PLAYER",
    marketCode: "TR",
    preferredLanguage: "RU",
    idempotencyKey,
  });
  const first = await send("/api/auth/register", { method: "POST", body });
  const second = await send("/api/auth/register", { method: "POST", body });
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(await database.user.count({ where: { email } }), 1);
});

test("application runtime не отключает Prisma внутри request lifecycle", async () => {
  const roots = ["app", "components", "lib/server", "lib/services", "lib/repositories"];
  async function files(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    return (await Promise.all(entries.map((entry) => {
      const path = `${directory}/${entry.name}`;
      return entry.isDirectory() ? files(path) : [path];
    }))).flat();
  }
  const applicationFiles = (await Promise.all(roots.map(files))).flat().filter((path) => /\.(?:ts|tsx|mts|mjs)$/.test(path));
  for (const path of applicationFiles) {
    if (path === "lib/db/client.ts") continue;
    assert.doesNotMatch(await readFile(path, "utf8"), /\.\$disconnect\s*\(/, `${path} не должен отключать Prisma`);
  }
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  fromDatabaseLanguage,
  localeFromBrowser,
  resolveInitialLocale,
  toDatabaseLanguage,
} from "../lib/i18n/config.ts";
import {
  formatLocalDay,
  formatLocalTime,
  parseServerTimestamp,
} from "../lib/i18n/date-time.ts";
import { translate } from "../lib/i18n/translate.ts";
import { verificationEmailContent } from "../lib/services/email-provider.ts";
import { validateRegistrationInput } from "../lib/validation/identity-profile.ts";

test("выбор языка из браузера использует ожидаемые языки и English fallback", () => {
  assert.equal(localeFromBrowser(["tr-TR"]), "tr");
  assert.equal(localeFromBrowser(["az-Latn-AZ"]), "az");
  assert.equal(localeFromBrowser(["ru-RU"]), "ru");
  assert.equal(localeFromBrowser(["uk-UA"]), "ru");
  assert.equal(localeFromBrowser(["en-GB"]), "en");
  assert.equal(localeFromBrowser(["de-DE", "fr-FR"]), "en");
  assert.equal(localeFromBrowser(undefined), "en");
});

test("сохранённый глобальный выбор имеет приоритет над языком браузера", () => {
  assert.equal(resolveInitialLocale("az", ["tr-TR"]), "az");
  assert.equal(resolveInitialLocale("unsupported", ["ru-RU"]), "ru");
  assert.equal(toDatabaseLanguage(resolveInitialLocale("en", ["ru-RU"])), "EN");
});

test("язык профиля поддерживает существующие значения и English", () => {
  assert.equal(fromDatabaseLanguage("RU"), "ru");
  assert.equal(fromDatabaseLanguage("TR"), "tr");
  assert.equal(fromDatabaseLanguage("AZ"), "az");
  assert.equal(fromDatabaseLanguage("EN"), "en");
  assert.equal(fromDatabaseLanguage(undefined), "en");
});

test("переводы типизированы, интерполируются и доступны во всех четырёх языках", () => {
  assert.equal(translate("en", "progress.step", { current: 2, total: 8 }), "Step 2 of 8");
  assert.match(translate("ru", "email.text", { code: "123456" }), /123456/);
  assert.match(translate("tr", "email.text", { code: "123456" }), /123456/);
  assert.match(translate("az", "email.text", { code: "123456" }), /123456/);
});

test("серверные timestamp безопасно нормализуются как UTC и форматируются в локальной зоне", () => {
  assert.equal(parseServerTimestamp("2026-08-02T00:30:00")?.toISOString(), "2026-08-02T00:30:00.000Z");
  assert.equal(parseServerTimestamp("not-a-date"), null);
  const timestamp = "2026-08-02T00:30:00.000Z";
  const newYork = formatLocalTime("en", timestamp, { timeZone: "America/New_York" });
  const istanbul = formatLocalTime("en", timestamp, { timeZone: "Europe/Istanbul" });
  assert.notEqual(newYork, istanbul);
  assert.equal(
    formatLocalDay("en", timestamp, "Today", new Date("2026-08-02T01:00:00.000Z"), { timeZone: "Europe/Istanbul" }),
    "Today",
  );
  assert.notEqual(
    formatLocalDay("en", timestamp, "Today", new Date("2026-08-02T20:00:00.000Z"), { timeZone: "America/New_York" }),
    "Today",
  );
});

test("письмо подтверждения локализуется на язык профиля", () => {
  const expiresAt = new Date("2026-08-02T12:10:00.000Z");
  assert.equal(verificationEmailContent("123456", expiresAt, "en").subject, "VX House verification code");
  assert.equal(verificationEmailContent("123456", expiresAt, "ru").subject, "Код подтверждения VX House");
  assert.match(verificationEmailContent("123456", expiresAt, "tr").text, /123456/);
  assert.match(verificationEmailContent("123456", expiresAt, "az").html, /lang="az"/);
});

test("регистрация принимает пароль от 8 символов и отклоняет более короткий", () => {
  const base = {
    displayName: "Test User",
    email: "test@example.com",
    productRole: "PLAYER",
    marketCode: "TR",
    preferredLanguage: "EN",
  };
  assert.throws(() => validateRegistrationInput({ ...base, password: "1234567" }));
  assert.equal(validateRegistrationInput({ ...base, password: "12345678" }).password, "12345678");
});

test("в регистрации нет отдельного поля или шага выбора языка", async () => {
  const [flow, roleStep, workspace] = await Promise.all([
    readFile(new URL("../components/access/access-flow.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-onboarding-welcome-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/workspace-shell.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(roleStep, /onLanguageChange|languageOptions|name="language"/u);
  assert.match(flow, /preferredLanguage:\s*toDatabaseLanguage\(locale\)/u);
  assert.match(flow, /step === 1[\s\S]*AccessOnboardingWelcomeStep/u);
  assert.match(workspace, /setLocale\(fromDatabaseLanguage\(profile\.preferredLanguage\)\)/u);
});

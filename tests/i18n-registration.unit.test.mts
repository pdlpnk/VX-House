import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  fromDatabaseLanguage,
  languagesFromAcceptLanguage,
  localeFromBrowser,
  resolveInitialLocale,
  resolveLocalePriority,
  toDatabaseLanguage,
} from "../lib/i18n/config.ts";
import {
  formatLocalDay,
  formatLocalTime,
  parseServerTimestamp,
} from "../lib/i18n/date-time.ts";
import { translate } from "../lib/i18n/translate.ts";
import { publicContent } from "../lib/i18n/public-content.ts";
import { decodeSystemMessage, encodeSystemMessage, renderSystemMessage } from "../lib/i18n/system-messages.ts";
import { verificationEmailContent } from "../lib/services/email-provider.ts";
import { validateRegistrationInput } from "../lib/validation/identity-profile.ts";

test("выбор языка из браузера использует ожидаемые языки и English fallback", () => {
  assert.equal(localeFromBrowser(["tr-TR"]), "tr");
  assert.equal(localeFromBrowser(["tr-TR", "tr", "en"]), "tr");
  assert.equal(localeFromBrowser(["az-Latn-AZ"]), "az");
  assert.equal(localeFromBrowser(["az-AZ"]), "az");
  assert.equal(localeFromBrowser(["ru-RU"]), "ru");
  assert.equal(localeFromBrowser(["uk-UA"]), "ru");
  assert.equal(localeFromBrowser(["en-US"]), "en");
  assert.equal(localeFromBrowser(["de-DE", "fr-FR"]), "en");
  assert.equal(localeFromBrowser(["", "invalid"]), "en");
  assert.equal(localeFromBrowser(undefined), "en");
});

test("Accept-Language учитывает quality и никогда не использует геолокацию", () => {
  assert.deepEqual(languagesFromAcceptLanguage("en-US;q=0.5, tr-TR;q=0.9, ru;q=0"), ["tr-TR", "en-US"]);
  assert.equal(localeFromBrowser(languagesFromAcceptLanguage("tr-TR,tr;q=0.9,en;q=0.8")), "tr");
  assert.equal(localeFromBrowser(languagesFromAcceptLanguage("de-DE,de;q=0.9,*;q=0.8")), "en");
  assert.deepEqual(languagesFromAcceptLanguage(""), []);
});

test("сохранённый глобальный выбор имеет приоритет над языком браузера", () => {
  assert.equal(resolveInitialLocale("ru", ["tr-TR"]), "ru");
  assert.equal(resolveInitialLocale("unsupported", ["ru-RU"]), "ru");
  assert.equal(toDatabaseLanguage(resolveInitialLocale("en", ["ru-RU"])), "EN");
});

test("приоритет языка: профиль, сохранённый выбор, браузер, English fallback", () => {
  assert.deepEqual(resolveLocalePriority({ profileValue: "EN", savedValue: "tr", browserLanguages: ["ru-RU"] }), { locale: "en", source: "profile" });
  assert.deepEqual(resolveLocalePriority({ savedValue: "RU", browserLanguages: ["tr-TR"] }), { locale: "ru", source: "saved" });
  assert.deepEqual(resolveLocalePriority({ browserLanguages: ["az-Latn-AZ"] }), { locale: "az", source: "browser" });
  assert.deepEqual(resolveLocalePriority({ browserLanguages: ["de-DE"] }), { locale: "en", source: "fallback" });
  assert.deepEqual(resolveLocalePriority({ browserLanguages: [] }), { locale: "en", source: "fallback" });
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

test("публичный лендинг полностью локализован и не содержит legacy-механики", async () => {
  const cyrillic = /[А-Яа-яЁё]/u;
  for (const locale of ["en", "tr", "az"] as const) {
    const visibleCopy = JSON.stringify(publicContent[locale]);
    assert.doesNotMatch(visibleCopy, cyrillic, `${locale} landing contains Russian copy`);
    assert.doesNotMatch(visibleCopy, /\b(?:tasks?|rewards?|points?|cashback|rank|progress)\b|görev|ödül|tapşırıq|mükafat/iu);
    assert.doesNotMatch(translate(locale, "hero.description"), cyrillic);
  }

  const allLandingCopy = JSON.stringify(publicContent);
  assert.doesNotMatch(allLandingCopy, /VX Points|Trust Score|Bronze|кешб[эе]к|история начислений|задания и инструкции/iu);

  const [heroVisual, platformPreview, header] = await Promise.all([
    readFile(new URL("../components/hero-visual.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/platform-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/navigation/site-header.tsx", import.meta.url), "utf8"),
  ]);
  for (const source of [heroVisual, platformPreview, header]) {
    assert.doesNotMatch(source, cyrillic);
    assert.match(source, /useI18n/u);
  }
  assert.match(heroVisual, /publicContent\[locale\]\.heroVisual/u);
  assert.match(platformPreview, /publicContent\[locale\]\.preview/u);
});

test("системные сообщения хранят ключ и параметры и рендерятся на текущем языке", () => {
  const stored = encodeSystemMessage("system.welcome", { name: "Roman" }, "tr");
  const envelope = decodeSystemMessage(stored);
  assert.ok(envelope);
  assert.equal(envelope.createdLocale, "tr");
  assert.match(renderSystemMessage("tr", envelope.key, envelope.params), /Roman/);
  assert.match(renderSystemMessage("en", envelope.key, envelope.params), /Welcome to VX House/);
  assert.match(renderSystemMessage("az", envelope.key, envelope.params), /VX House-a xoş gəlmisiniz/);
  assert.match(renderSystemMessage("ru", envelope.key, envelope.params), /Добро пожаловать в VX House/);
  assert.equal(decodeSystemMessage("Обычное пользовательское сообщение"), null);
});

test("TR → EN меняет только UI и системный рендер, но не свободный текст", () => {
  const stored = encodeSystemMessage("system.emailVerified", {}, "tr");
  const envelope = decodeSystemMessage(stored)!;
  assert.notEqual(renderSystemMessage("tr", envelope.key, envelope.params), renderSystemMessage("en", envelope.key, envelope.params));
  const userText = "Merhaba, yardım eder misiniz?";
  const adminText = "I'll check this for you.";
  assert.equal(decodeSystemMessage(userText), null);
  assert.equal(decodeSystemMessage(adminText), null);
});

test("основные player UI-строки доступны без русского fallback", () => {
  for (const locale of ["en", "ru", "tr", "az"] as const) {
    assert.notEqual(translate(locale, "economy.title"), "");
    assert.notEqual(translate(locale, "messenger.personalChannel"), "");
    assert.notEqual(translate(locale, "opportunity.playerTitle"), "");
    assert.notEqual(translate(locale, "rewardUi.title"), "");
  }
  assert.equal(translate("tr", "economy.title"), "VX House yolculuğunuz");
  assert.equal(translate("az", "messenger.personalChannel"), "Şəxsi kanal");
  assert.equal(translate("en", "rewardUi.title"), "Your benefits");
  assert.equal(translate("ru", "opportunity.playerTitle"), "Доступные задания");
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

test("SSR и hydration используют один язык без фиксированного RU/EN state", async () => {
  const [layout, provider] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/i18n/i18n-provider.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /<html lang=\{resolution\.locale\}/u);
  assert.match(layout, /initialLocale=\{resolution\.locale\}/u);
  assert.match(layout, /initialSource=\{resolution\.source\}/u);
  assert.match(layout, /generateMetadata/u);
  assert.match(layout, /openGraphLocales\[locale\]/u);
  assert.match(provider, /useState<Locale>\(initialLocale\)/u);
  assert.doesNotMatch(provider, /useState<Locale>\((?:DEFAULT_LOCALE|["']ru["'])\)/u);
  assert.match(provider, /useLayoutEffect/u);
});

test("ручная смена сохраняется без навигации и не теряет hash", async () => {
  const provider = await readFile(new URL("../components/i18n/i18n-provider.tsx", import.meta.url), "utf8");
  assert.match(provider, /localStorage\.setItem\(LOCALE_STORAGE_KEY, nextLocale\)/u);
  assert.match(provider, /document\.cookie = `\$\{LOCALE_COOKIE\}=\$\{nextLocale\}/u);
  assert.doesNotMatch(provider, /location\.(?:assign|replace|href)|history\.(?:pushState|replaceState)/u);
  assert.equal(resolveLocalePriority({ savedValue: "tr", browserLanguages: ["en-US"] }).locale, "tr");
});

test("Dashboard и Admin Messenger используют единый словарь во всех направлениях переключения", async () => {
  assert.equal(translate("tr", "page.home"), "Ana sayfa");
  assert.equal(translate("en", "dashboard.nextStep"), "Next step");
  assert.equal(translate("az", "settings.interface"), "İnterfeys tənzimləmələri");
  assert.equal(translate("ru", "adminMessenger.archive"), "Архив");
  assert.equal(translate("tr", "dashboard.contactManager"), "Yöneticiyle iletişime geç");
  assert.equal(translate("az", "dashboard.personalManager"), "Şəxsi meneceriniz");
  assert.equal(translate("en", "adminTags.all"), "All");
  assert.equal(translate("ru", "adminTags.manage"), "Управление тегами");
  assert.notEqual(translate("tr", "dashboard.description"), translate("ru", "dashboard.description"));

  const [shell, home, settings, profile, adminMessenger] = await Promise.all([
    readFile(new URL("../components/dashboard/workspace-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-home.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-settings-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-profile-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-messenger-workspace.tsx", import.meta.url), "utf8"),
  ]);
  for (const source of [shell, home, settings, profile, adminMessenger]) assert.match(source, /useI18n/u);
  assert.doesNotMatch(home, /Здравствуйте|Главная|Следующий шаг|Активные задания/u);
  assert.doesNotMatch(settings, /Параметры интерфейса|Уменьшенное движение|Сбросить локальные/u);
  assert.doesNotMatch(profile, /Подтверждённые данные|Электронная почта|Контакт подтверждён/u);
  assert.match(adminMessenger, /adminMessenger\.archive/u);
  assert.match(shell, /t\(config\.labelKey\)/u);
});

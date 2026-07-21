import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the VX House landing experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>VX House<\/title>/i);
  assert.match(html, /<html[^>]*class="dark"/i);
  assert.match(html, /<main[^>]*id="main-content"/i);
  assert.match(html, /Перейти к содержимому/i);
  assert.match(html, /Единая платформа для игроков и партнёров/i);
  assert.match(html, /Закрытая платформа VX House/i);
  assert.match(html, /Изучить платформу/i);
  assert.match(html, /Всё необходимое — в одном месте/i);
  assert.match(html, /Статус профиля/i);
  assert.match(html, /Специальные условия/i);
  assert.match(html, /История активности/i);
  assert.match(html, /Уровень участника/i);
  assert.match(html, /href="\/access"/i);
  assert.doesNotMatch(html, /mailto:/i);
  assert.match(html, /aria-label="Основная навигация"/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders the access welcome screen", async () => {
  const response = await render("/access");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Получение доступа \| VX House<\/title>/i);
  assert.match(html, /Добро пожаловать в VX House/i);
  assert.match(html, /Шаг 1 из 6/i);
  assert.match(html, /Около двух минут\. Без пароля и длинной анкеты/i);
  assert.match(html, />Начать</i);
  assert.match(html, />Вернуться</i);
  assert.match(html, /Только для совершеннолетних/i);
});

test("server-renders every dashboard route", async () => {
  const routes = [
    ["/dashboard", /Добро пожаловать, Алексей/i],
    ["/dashboard/profile", /Управляйте основными данными/i],
    ["/dashboard/opportunities", /Ваши условия, преимущества и сервисы VX House/i],
    ["/dashboard/activity", /Все важные изменения профиля/i],
    ["/dashboard/support", /Помощь по профилю, возможностям/i],
    ["/dashboard/settings", /Настройте локальный профиль/i],
  ];

  for (const [pathname, content] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);

    const html = await response.text();
    assert.match(html, /Личное пространство \| VX House/i, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /aria-label="Навигация личного кабинета"/i, pathname);
    assert.match(html, /Алексей/i, pathname);
  }
});

test("dashboard keeps role-aware local product contracts", async () => {
  const [data, provider, shell, home, opportunities, settings, styles] = await Promise.all([
    readFile(new URL("../lib/dashboard-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-provider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-home.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-opportunities-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-settings-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(data, /vx-house-onboarding/);
  assert.match(data, /vx-house-access/);
  assert.match(data, /type DashboardRole = "player" \| "partner"/);
  assert.match(provider, /localStorage\.setItem/);
  assert.match(provider, /useReducedMotion/);
  assert.match(shell, /Главная/);
  assert.match(shell, /Уведомления/);
  assert.match(home, /Рекомендуемое действие/);
  assert.match(home, /Последнее изменение/);
  assert.match(opportunities, /playerOpportunities/);
  assert.match(opportunities, /partnerOpportunities/);
  assert.match(settings, /Уменьшенное движение/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /mobileBottomNav/);
});

test("includes scalable theme and component contracts", async () => {
  const [theme, effects, hero, platform, accessFlow, accessScenario, accessBenefits, accessProfile, accessPreparation, accessReady, accessProgress, components, page, packageJson] = await Promise.all([
    readFile(new URL("../styles/theme.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/effects.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/hero.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/platform.css", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-flow.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-scenario-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-benefits-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-profile-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-preparation-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-ready-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-progress.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components.json", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(theme, /--container-max:/);
  assert.match(theme, /--section-space:/);
  assert.match(theme, /--radius:/);
  assert.match(effects, /\.glass\s*\{/);
  assert.match(effects, /\.bg-radial-glow\s*\{/);
  assert.match(hero, /\.hero-visual\s*\{/);
  assert.match(hero, /prefers-reduced-motion/);
  assert.match(platform, /\.inside-platform\s*\{/);
  assert.match(platform, /prefers-reduced-motion/);
  assert.match(accessFlow, /AnimatePresence/);
  assert.match(accessFlow, /setCurrentStep/);
  assert.match(accessScenario, /Выберите подходящий сценарий/);
  assert.match(accessScenario, /aria-pressed/);
  assert.match(accessBenefits, /Ваше пространство игрока/);
  assert.match(accessBenefits, /Ваше партнёрское пространство/);
  assert.match(accessBenefits, /Продолжить создание пространства/);
  assert.match(accessBenefits, /reducedMotion/);
  assert.match(accessProfile, /Создадим ваше пространство VX House/);
  assert.match(accessProfile, /Профиль создаётся/);
  assert.match(accessProfile, /onNameChange/);
  assert.match(accessProfile, /onEmailChange/);
  assert.match(accessProfile, /onContinue/);
  assert.match(accessPreparation, /Подготавливаем ваше пространство/);
  assert.match(accessPreparation, /Подключение возможностей/);
  assert.match(accessPreparation, /setInterval/);
  assert.match(accessPreparation, /reducedMotion/);
  assert.match(accessReady, /Ваше пространство VX House готово/);
  assert.match(accessReady, /Перейти в VX House/);
  assert.match(accessReady, /Следующий этап разработки/);
  assert.match(accessReady, /Вернуться на главную/);
  assert.match(accessReady, /showModal/);
  assert.match(accessProgress, /"Подготовка"/);
  assert.match(accessProgress, /"Готово"/);
  assert.match(components, /"ui": "@\/components\/ui"/);
  assert.match(page, /<Hero \/>/);
  assert.match(page, /<InsidePlatform \/>/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(
    access(new URL("../public/_sites-preview", import.meta.url)),
  );
});

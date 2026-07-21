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
  assert.match(html, /<title>VX House — платформа лояльности и сотрудничества<\/title>/i);
  assert.match(html, /<html[^>]*class="dark"/i);
  assert.match(html, /<main[^>]*id="main-content"/i);
  assert.match(html, /Перейти к содержимому/i);
  assert.match(html, /Понятный путь к персональным условиям/i);
  assert.match(html, /Платформа лояльности и сотрудничества/i);
  assert.match(html, /Как это работает/i);
  assert.match(html, /Платформа, которая делает условия понятными/i);
  assert.match(html, /Личный маршрут без догадок/i);
  assert.match(html, /Сотрудничество в едином контексте/i);
  assert.match(html, /Действие у партнёра/i);
  assert.match(html, /VX Rewards — общее название подтверждённых преимуществ/i);
  assert.match(html, /Турция и Азербайджан/i);
  assert.match(html, /id="faq"/i);
  assert.match(html, /application\/ld\+json/i);
  assert.doesNotMatch(html, /12 480|\+ 1 250|Прайм|24\/7/i);
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
  assert.match(html, /Проверяем незавершённый процесс/i);
  assert.match(html, /Только для совершеннолетних/i);
  assert.doesNotMatch(html, /Кабинет готов|Профиль активирован|Данные защищены системой/i);
});

test("server-renders every dashboard route", async () => {
  const routes = [
    ["/dashboard", /Обзор прогресса/i],
    ["/dashboard/profile", /Локальное представление будущего профиля/i],
    ["/dashboard/opportunities", /Понятно, что доступно и что делать дальше/i],
    ["/dashboard/economy", /Прогресс без скрытых условий/i],
    ["/dashboard/economy/history", /Экономических событий пока нет/i],
    ["/dashboard/activity", /История пока не началась/i],
    ["/dashboard/support", /Помощь с сохранением контекста/i],
    ["/dashboard/settings", /Только локальные предпочтения/i],
  ];

  for (const [pathname, content] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);

    const html = await response.text();
    assert.match(html, /Кабинет игрока \| VX House/i, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /aria-label="Навигация кабинета игрока"/i, pathname);
    assert.match(html, /Демонстрационный кабинет/i, pathname);
    assert.doesNotMatch(html, /Алексей|Сотрудничество активно/i, pathname);
  }
});

test("dashboard keeps player-only transparent demo contracts", async () => {
  const [data, provider, shell, workspaceShell, home, opportunities, settings, styles] = await Promise.all([
    readFile(new URL("../lib/dashboard-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-provider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/workspace-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-home.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-opportunities-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-settings-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(data, /demoPlayerProgress|points:\s*\{[^}]*current:\s*\d/is);
  assert.doesNotMatch(data, /DashboardRole|partner/);
  assert.match(provider, /localStorage\.setItem/);
  assert.match(provider, /useReducedMotion/);
  assert.match(shell, /Главная/);
  assert.match(workspaceShell, /Уведомлений пока нет/);
  assert.match(workspaceShell, /WorkspaceShell/);
  assert.match(shell, /href: "\/dashboard\/support"/);
  assert.match(home, /Рекомендуемый следующий шаг/);
  assert.match(home, /Trust Score/);
  assert.match(home, /VX Points/);
  assert.match(home, /Прогресс до следующего ранга/);
  assert.match(home, /Реальных данных пока нет/);
  assert.match(opportunities, /OpportunityCatalog/);
  assert.doesNotMatch(opportunities, /partnerOpportunities|Прайм/);
  assert.match(settings, /Уменьшенное движение/);
  assert.doesNotMatch(settings, /Партнёр|notificationsEnabled/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /mobileBottomNav/);
});

test("server-renders the separate partner workspace", async () => {
  const routes = [
    ["/partner", /Рабочее пространство партнёра/i],
    ["/partner/opportunities", /Понятно, что доступно и что делать дальше/i],
    ["/partner/economy", /Прогресс без скрытых условий/i],
    ["/partner/economy/history", /Экономических событий пока нет/i],
    ["/partner/materials", /Материалы пока не назначены/i],
    ["/partner/forecasts", /Прогнозы пока недоступны/i],
    ["/partner/history", /Подтверждённых событий пока нет/i],
    ["/partner/support", /Помощь с сохранением контекста/i],
    ["/partner/profile", /Локальное представление будущего партнёрского профиля/i],
  ];

  for (const [pathname, content] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);

    const html = await response.text();
    assert.match(html, /Кабинет партнёра \| VX House/i, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /aria-label="Навигация кабинета партнёра"/i, pathname);
    assert.match(html, /Демонстрационное пространство/i, pathname);
    assert.doesNotMatch(html, /Алексей|₽|₺|₼|заработано|выплачено/i, pathname);
  }
});

test("partner workspace keeps honest frontend-only contracts", async () => {
  const [shell, data, home, forecasts, history] = await Promise.all([
    readFile(new URL("../components/partner/partner-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/partner-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/pages/partner-home.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/pages/partner-forecasts-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/pages/partner-history-page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(shell, /\/partner\/materials/);
  assert.match(shell, /\/partner\/forecasts/);
  assert.match(shell, /Кабинет партнёра/);
  assert.match(data, /vx-house-partner-dashboard-preferences/);
  assert.match(home, /Рекомендуемый следующий шаг/);
  assert.match(home, /Проверка роли/);
  assert.match(home, /Нет данных/);
  assert.doesNotMatch(home, /demoPartnerProgress|points:\s*\d|trust:\s*\d/i);
  assert.match(forecasts, /не будут гарантировать результат или доход/i);
  assert.match(history, /не заполняется демонстрационными успехами/i);
});

test("server-renders shared opportunity and task details for both roles", async () => {
  const routes = [
    ["/dashboard/opportunities/player-personal-route", /Статус и следующий шаг без ложных обещаний/i, /Кабинет игрока \| VX House/i],
    ["/dashboard/tasks/player-personal-route", /Жизненный цикл задания/i, /Кабинет игрока \| VX House/i],
    ["/partner/opportunities/partner-first-collaboration", /Статус и следующий шаг без ложных обещаний/i, /Кабинет партнёра \| VX House/i],
    ["/partner/tasks/partner-first-collaboration", /Жизненный цикл задания/i, /Кабинет партнёра \| VX House/i],
  ];

  for (const [pathname, content, title] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, title, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /Демонстрац/i, pathname);
    assert.match(html, /disabled/i, pathname);
    assert.doesNotMatch(html, /заработано|выплачено|успешно выполнено|₽|₺|₼/i, pathname);
  }
});

test("opportunity system keeps a unified frontend-only contract", async () => {
  const [data, catalog, detail, task] = await Promise.all([
    readFile(new URL("../lib/opportunity-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/opportunity-catalog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/opportunity-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/task-detail.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(data, /OpportunityRole/);
  assert.match(data, /OpportunityMarket/);
  assert.match(data, /OpportunityType/);
  assert.match(data, /OpportunityStatus/);
  assert.match(data, /nextStep/);
  assert.match(data, /unavailable/);
  assert.match(data, /soon/);
  assert.match(data, /awaiting-service/);
  assert.match(data, /no-data/);
  assert.match(data, /Турция/);
  assert.match(data, /Азербайджан/);
  assert.match(catalog, /getOpportunitiesByRole/);
  assert.match(detail, /Проверка результата/);
  assert.match(detail, /Промокод/);
  assert.match(detail, /VX Rewards/);
  assert.match(task, /TaskLifecycle/);
  assert.doesNotMatch(`${data}${catalog}${detail}${task}`, /fetch\(|\/api\/|localStorage|cookies?/i);
});

test("task lifecycle exposes nine honest frontend-only states", async () => {
  const [lifecycleData, lifecycleComponent, taskData, styles] = await Promise.all([
    readFile(new URL("../lib/task-lifecycle.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/task-lifecycle.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/opportunity-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const status of ["Доступно", "Принято", "Выполняется", "Ожидает отправки", "Отправлено", "Ожидает проверки", "Требуется уточнение", "Подтверждено", "Отклонено"]) {
    assert.match(lifecycleData, new RegExp(status, "i"));
  }

  assert.match(lifecycleComponent, /role="tablist"/);
  assert.match(lifecycleComponent, /aria-selected/);
  assert.match(lifecycleComponent, /Экран подтверждения отправки/);
  assert.match(lifecycleComponent, /Экран ожидания проверки/);
  assert.match(lifecycleComponent, /Экран решения проверки/);
  assert.match(lifecycleComponent, /Комментарий проверяющего/);
  assert.match(lifecycleComponent, /История изменений/);
  assert.match(lifecycleComponent, /Будет доступно после подключения сервиса/);
  assert.match(lifecycleComponent, /Решение отсутствует/);
  assert.match(lifecycleComponent, /disabled/);
  assert.match(taskData, /conditionsVersion/);
  assert.match(taskData, /resultFormats/);
  assert.match(taskData, /reviewEstimate/);
  assert.match(taskData, /resubmissionRule/);
  assert.match(styles, /lifecycleTabs/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${lifecycleData}${lifecycleComponent}`, /fetch\(|\/api\/|localStorage|sessionStorage|cookies?/i);
});

test("economy UI keeps four independent entities and honest empty data", async () => {
  const [data, overview, history, impact, playerShell, partnerShell, styles] = await Promise.all([
    readFile(new URL("../lib/economy-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/economy/economy-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/economy/economy-history.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/economy/economy-impact-preview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/partner-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const entity of ["VX Points", "Trust Score", "Ранг", "VX Rewards"]) {
    assert.match(`${data}${overview}${impact}`, new RegExp(entity, "i"));
  }
  for (const rank of ["Explorer", "Navigator", "Atlas", "Prime", "Signature"]) {
    assert.match(data, new RegExp(rank));
  }
  assert.match(data, /points: null/);
  assert.match(data, /trustScore: null/);
  assert.match(data, /currentRank: null/);
  assert.match(data, /rankProgress: null/);
  assert.match(overview, /Не являются деньгами/);
  assert.match(overview, /Демонстрация интерфейса/);
  assert.match(history, /неизменяемая хронология/i);
  assert.match(history, /Ни одного экономического события не создано/i);
  assert.match(playerShell, /\/dashboard\/economy/);
  assert.match(partnerShell, /\/partner\/economy/);
  assert.match(styles, /economyMetricGrid/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${data}${overview}${history}${impact}`, /fetch\(|\/api\/|localStorage|sessionStorage|cookies?/i);
  assert.doesNotMatch(`${data}${overview}${history}${impact}`, /₽|₺|₼|\$\d|успешно начислено|выплачено/i);
});

test("server-renders VX Rewards catalog, detail and history for both roles", async () => {
  const routes = [
    ["/dashboard/rewards", /Каталог типов преимуществ/i, /Кабинет игрока \| VX House/i],
    ["/dashboard/rewards/personal", /Жизненный цикл Reward/i, /Кабинет игрока \| VX House/i],
    ["/dashboard/rewards/history", /Событий VX Rewards пока нет/i, /Кабинет игрока \| VX House/i],
    ["/partner/rewards", /Каталог типов преимуществ/i, /Кабинет партнёра \| VX House/i],
    ["/partner/rewards/promo", /Жизненный цикл Reward/i, /Кабинет партнёра \| VX House/i],
    ["/partner/rewards/history", /Событий VX Rewards пока нет/i, /Кабинет партнёра \| VX House/i],
  ];

  for (const [pathname, content, title] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, title, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /Демонстрац|Не назначено|Нет данных/i, pathname);
    assert.doesNotMatch(html, /₽|₺|₼|\$\d|успешно начислено|выплачено|код:\s*[A-Z0-9]/i, pathname);
  }
});

test("VX Rewards keeps seven honest frontend-only states", async () => {
  const [data, catalog, detail, lifecycle, history, playerShell, partnerShell, styles] = await Promise.all([
    readFile(new URL("../lib/reward-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-catalog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-lifecycle.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-history.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/partner-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const type of ["Кешбэк", "Денежное вознаграждение", "Доступ к прогнозу", "Персональные условия", "Промокод", "Настраиваемый тип"]) {
    assert.match(data, new RegExp(type, "i"));
  }
  for (const status of ["Ожидается", "Ожидает подтверждения", "Готовится", "Доступен", "Предоставлен", "Отклонён", "Истёк"]) {
    assert.match(data, new RegExp(status, "i"));
  }
  assert.match(lifecycle, /role="tablist"/);
  assert.match(lifecycle, /aria-selected/);
  assert.match(lifecycle, /Причина изменения/);
  assert.match(lifecycle, /Связанное задание/);
  assert.match(lifecycle, /История изменений Reward/);
  assert.match(lifecycle, /Будет доступно после подключения сервиса/);
  assert.match(history, /не содержит демонстрационных успехов/i);
  assert.match(catalog, /Не назначено/);
  assert.match(detail, /Преимущество не выдано пользователю/);
  assert.match(playerShell, /\/dashboard\/rewards/);
  assert.match(partnerShell, /\/partner\/rewards/);
  assert.match(styles, /rewardLifecycleTabs/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${data}${catalog}${detail}${lifecycle}${history}`, /fetch\(|\/api\/|localStorage|sessionStorage|cookies?/i);
  assert.doesNotMatch(`${data}${catalog}${detail}${lifecycle}${history}`, /₽|₺|₼|\$\d|успешно начислено|выплачено/i);
});

test("server-renders support center, ticket and creation for both roles", async () => {
  const routes = [
    ["/dashboard/support", /Помощь с сохранением контекста/i, /Кабинет игрока \| VX House/i],
    ["/dashboard/support/demo-task-context", /Диалог с поддержкой/i, /Кабинет игрока \| VX House/i],
    ["/dashboard/support/new", /Структура обращения/i, /Кабинет игрока \| VX House/i],
    ["/partner/support", /Помощь с сохранением контекста/i, /Кабинет партнёра \| VX House/i],
    ["/partner/support/demo-partner-context", /Диалог с поддержкой/i, /Кабинет партнёра \| VX House/i],
    ["/partner/support/new", /Структура обращения/i, /Кабинет партнёра \| VX House/i],
  ];

  for (const [pathname, content, title] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, title, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /Демонстрац|Сервис не подключён|данные не сохраняются/i, pathname);
    assert.doesNotMatch(html, /обращение успешно создано|сообщение отправлено|оператор онлайн|ответ через \d/i, pathname);
  }
});

test("support center keeps six honest frontend-only statuses", async () => {
  const [data, center, detail, creation, statusGuide, playerShell, partnerShell, task, reward, styles] = await Promise.all([
    readFile(new URL("../lib/support-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/support/support-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/support/support-ticket-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/support/support-new-ticket.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/support/support-status-guide.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/partner-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/task-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const status of ["Новое", "Открыто", "Ожидает пользователя", "Ожидает оператора", "Решено", "Закрыто"]) {
    assert.match(data, new RegExp(status, "i"));
  }
  for (const category of ["Доступ к платформе", "Задание", "Проверка результата", "VX Rewards", "Профиль и настройки", "Апелляция", "Сотрудничество"]) {
    assert.match(data, new RegExp(category, "i"));
  }
  assert.match(center, /Демонстрационный список/);
  assert.match(center, /График не подключён/);
  assert.match(detail, /Не является реальным ответом|Диалог не является настоящим обращением/);
  assert.match(detail, /Вложения/);
  assert.match(detail, /История статусов/);
  assert.match(detail, /disabled/);
  assert.match(creation, /fieldset disabled/);
  assert.match(creation, /Создать обращение/);
  assert.match(statusGuide, /следующий шаг/i);
  assert.match(playerShell, /\/dashboard\/support/);
  assert.match(partnerShell, /\/partner\/support/);
  assert.match(task, /Открыть Центр поддержки/);
  assert.match(reward, /Открыть Центр поддержки/);
  assert.match(styles, /supportConversation/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${data}${center}${detail}${creation}${statusGuide}`, /fetch\(|\/api\/|WebSocket|localStorage|sessionStorage|cookies?|EventSource/i);
});

test("server-renders the complete administrative workspace", async () => {
  const routes = [
    ["/admin", /Операционный контур VX House/i],
    ["/admin/users", /Структура профиля пользователя/i],
    ["/admin/services", /Структура партнёрского сервиса/i],
    ["/admin/opportunities", /Структура возможности/i],
    ["/admin/tasks", /Структура задания/i],
    ["/admin/reviews", /Структура проверки результата/i],
    ["/admin/rewards", /Структура VX Reward/i],
    ["/admin/economy", /Структура версии экономики/i],
    ["/admin/support", /Структура обращения/i],
    ["/admin/content", /Структура редакционного материала/i],
    ["/admin/notifications", /Структура шаблона уведомления/i],
    ["/admin/team", /Матрица будущих прав/i],
    ["/admin/audit", /Журнал критических действий/i],
    ["/admin/settings", /Структура системной настройки/i],
    ["/admin/users/demo-profile-structure", /Состав сущности/i],
    ["/admin/users/demo-profile-structure/edit", /Параметры будущей версии/i],
  ];

  for (const [pathname, content] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, /Административная панель \| VX House/i, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /Демонстрац|Нет данных|Не подключен|отключен/i, pathname);
    assert.match(html, /aria-label="Навигация административной панели"/i, pathname);
    assert.doesNotMatch(html, /₽|₺|₼|реальных пользователей:\s*\d|выручка|выплачено/i, pathname);
  }
});

test("administrative workspace keeps honest frontend-only contracts", async () => {
  const [data, shell, overview, section, detail, editor, adminUi, styles] = await Promise.all([
    readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-section-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-entity-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-entity-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-ui.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const item of ["Пользователи", "Возможности", "Задания", "VX Rewards", "Экономика", "Поддержка", "Контент", "Настройки"]) {
    assert.match(`${data}${shell}`, new RegExp(item, "i"));
  }
  assert.match(shell, /kind: "admin"/);
  assert.match(overview, /Числовая статистика намеренно не показывается/);
  assert.match(data, /Демонстрационная схема/);
  assert.match(detail, /История изменений/);
  assert.match(editor, /fieldset disabled/);
  assert.match(adminUi, /Будет доступно после подключения backend/);
  assert.match(styles, /adminSectionGrid/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${data}${overview}${section}${detail}${editor}`, /fetch\(|\/api\/|WebSocket|localStorage|sessionStorage|cookies?|EventSource/i);
  assert.doesNotMatch(`${data}${overview}${section}${detail}${editor}`, /₽|₺|₼|\$\d|успешно начислено|выплачено/i);
});

test("manager panel covers Stage 12 frontend safeguards", async () => {
  const [data, overview, section, operations, editor, shell, styles] = await Promise.all([
    readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-section-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-operational-panels.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-entity-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const area of ["Партнёрские сервисы", "Проверки", "Уведомления", "Команда и права", "Аудит"]) {
    assert.match(`${data}${shell}`, new RegExp(area, "i"));
  }
  for (const requirement of ["Инструкции", "Промокоды", "Апелляции", "VX Points", "Trust Score", "Прогнозы", "Материалы"]) {
    assert.match(data, new RegExp(requirement, "i"));
  }
  assert.match(overview, /Операционная статистика/);
  assert.match(section, /Сохранённые представления/);
  assert.match(section, /Массовые действия недоступны/);
  assert.match(section, /adminPagination/);
  assert.match(operations, /Матрица будущих прав/);
  assert.match(operations, /Предпросмотр пользовательского результата/);
  assert.match(operations, /Подтверждение критического действия/);
  assert.match(operations, /Экспортировать/);
  assert.match(operations, /Значение до/);
  assert.match(operations, /Значение после/);
  assert.match(editor, /AdminCriticalActionPreview/);
  assert.match(styles, /adminPermissionTable/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${data}${overview}${section}${operations}${editor}`, /fetch\(|\/api\/|WebSocket|localStorage|sessionStorage|cookies?|EventSource/i);
});

test("includes scalable theme and component contracts", async () => {
  const [theme, effects, hero, platform, accessFlow, accessScenario, accessBenefits, accessMarket, accessProfile, accessConsent, accessComplete, accessProgress, accessDraft, components, page, packageJson] = await Promise.all([
    readFile(new URL("../styles/theme.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/effects.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/hero.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/platform.css", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-flow.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-scenario-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-benefits-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-market-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-profile-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-consent-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-complete-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-progress.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/access-draft.ts", import.meta.url), "utf8"),
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
  assert.match(accessFlow, /const TOTAL_STEPS = 7/);
  assert.match(accessFlow, /window\.localStorage\.setItem/);
  assert.match(accessFlow, /window\.localStorage\.removeItem/);
  assert.doesNotMatch(accessFlow, /fetch\(|\/api\//);
  assert.match(accessScenario, /Выберите подходящий сценарий/);
  assert.match(accessScenario, /aria-pressed/);
  assert.match(accessBenefits, /Предварительный состав/);
  assert.match(accessBenefits, /Доступность уточняется/);
  assert.match(accessBenefits, /reducedMotion/);
  assert.match(accessMarket, /Турция/);
  assert.match(accessMarket, /Азербайджан/);
  assert.match(accessMarket, /Предпочтительный язык/);
  assert.match(accessMarket, /интерфейс остаётся на русском/i);
  assert.match(accessProfile, /Как с вами связаться/);
  assert.match(accessProfile, /не отправляются на сервер/);
  assert.match(accessProfile, /Контакт не сохраняется в черновике/);
  assert.match(accessProfile, /onNameChange/);
  assert.match(accessProfile, /onEmailChange/);
  assert.match(accessProfile, /onContinue/);
  assert.match(accessConsent, /Мне исполнилось 18 лет/);
  assert.match(accessConsent, /Я принимаю правила использования/);
  assert.match(accessConsent, /политикой конфиденциальности/);
  assert.match(accessComplete, /аккаунт ещё не создан/);
  assert.match(accessComplete, /Подтверждение контакта и безопасный вход/);
  assert.match(accessComplete, /Вернуться на главную/);
  assert.doesNotMatch(accessComplete, /Кабинет готов|Профиль активирован|Перейти в VX House/i);
  assert.match(accessProgress, /"Следующий шаг"/);
  assert.match(accessDraft, /ACCESS_DRAFT_TTL_MS/);
  assert.match(accessDraft, /getSafeResumeStep/);
  assert.match(components, /"ui": "@\/components\/ui"/);
  assert.match(page, /<Hero \/>/);
  assert.match(page, /<InsidePlatform \/>/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(
    access(new URL("../public/_sites-preview", import.meta.url)),
  );
});

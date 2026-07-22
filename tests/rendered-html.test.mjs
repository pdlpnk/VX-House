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
  assert.match(html, /<title>VX House — специальные условия и вознаграждения<\/title>/i);
  assert.match(html, /<html[^>]*class="dark"/i);
  assert.match(html, /<main[^>]*id="main-content"/i);
  assert.match(html, /Перейти к содержимому/i);
  assert.match(html, /Получайте больше от своей активности/i);
  assert.match(html, /Закрытые условия и вознаграждения/i);
  assert.match(html, /Как это работает/i);
  assert.match(html, /Всё необходимое в одном месте/i);
  assert.match(html, /Специальные условия и вознаграждения/i);
  assert.match(html, /Готовые сценарии и сопровождение/i);
  assert.match(html, /Четыре простых шага/i);
  assert.match(html, /Больше условий\. Меньше неопределённости\./i);
  assert.match(html, /Посмотрите, какие возможности доступны вам/i);
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
  assert.match(html, /Проверяем безопасный сеанс/i);
  assert.match(html, /Только для совершеннолетних/i);
  assert.doesNotMatch(html, /Кабинет готов|Профиль активирован|Данные защищены системой/i);
});

test.skip("server-renders every dashboard route (requires authenticated database fixture)", async () => {
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

test("dashboard keeps player-only server-backed contracts", async () => {
  const [data, provider, shell, workspaceShell, home, opportunities, settings, styles] = await Promise.all([
    readFile(new URL("../lib/dashboard-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-provider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/workspace-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/pages/dashboard-home.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/opportunities/page.tsx", import.meta.url), "utf8"),
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
  assert.match(home, /summary\.activeTasks/);
  assert.match(home, /ForecastCatalog/);
  assert.match(home, /PromocodeCatalog/);
  assert.match(opportunities, /OpportunityCatalog/);
  assert.doesNotMatch(opportunities, /partnerOpportunities|Прайм/);
  assert.match(settings, /Уменьшенное движение/);
  assert.doesNotMatch(settings, /Партнёр|notificationsEnabled/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /mobileBottomNav/);
});

test.skip("server-renders the separate partner workspace (requires authenticated database fixture)", async () => {
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

test("partner workspace keeps honest server-backed contracts", async () => {
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
  assert.match(home, /summary\.partnerStatus/);
  assert.match(home, /summary\.availableForecasts/);
  assert.match(home, /Нет данных/);
  assert.doesNotMatch(home, /demoPartnerProgress|points:\s*\d|trust:\s*\d/i);
  assert.match(forecasts, /ForecastCatalog/);
  assert.match(history, /ActivityTimeline/);
});

test.skip("server-renders shared opportunity and task details for both roles (requires authenticated database fixture)", async () => {
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

test("opportunity system uses a unified server-backed contract", async () => {
  const [data, catalog, detail, task, service, repository] = await Promise.all([
    readFile(new URL("../lib/opportunities/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/opportunity-catalog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/opportunity-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/task-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/services/opportunity-task-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/repositories/prisma-opportunity-task-repository.ts", import.meta.url), "utf8"),
  ]);

  assert.match(data, /OpportunityView/);
  assert.match(data, /UserTaskView/);
  assert.match(data, /nextStep/);
  assert.match(data, /availability/);
  assert.match(catalog, /\/api\/opportunities/);
  assert.match(detail, /\/accept/);
  assert.match(task, /TaskLifecycle/);
  assert.match(service, /assertTransition/);
  assert.match(service, /taskVersionId/);
  assert.match(repository, /productRole/);
  assert.match(repository, /marketId/);
  assert.doesNotMatch(`${data}${catalog}${detail}${task}`, /localStorage|sessionStorage/i);
});

test("task lifecycle renders only server state and real commands", async () => {
  const [lifecycleComponent, service, styles] = await Promise.all([
    readFile(new URL("../components/opportunities/task-lifecycle.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/services/opportunity-task-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const status of ["Доступно", "Принято", "Выполняется", "Ожидает отправки", "Отправлено", "Ожидает проверки", "Требуется уточнение", "Подтверждено", "Отклонено"]) {
    assert.match(lifecycleComponent, new RegExp(status, "i"));
  }

  assert.match(lifecycleComponent, /\/api\/tasks/);
  assert.match(lifecycleComponent, /Сохранить черновик/);
  assert.match(lifecycleComponent, /Отправить результат/);
  assert.match(lifecycleComponent, /История изменений/);
  assert.match(service, /SubmissionVersion/);
  assert.match(service, /assertTransition/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(lifecycleComponent, /role="tablist"|aria-selected|localStorage|sessionStorage/i);
});

test("economy UI uses four independent server-backed entities", async () => {
  const [types, service, overview, history, impact, playerShell, partnerShell, styles] = await Promise.all([
    readFile(new URL("../lib/economy/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/services/economy-reward-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/economy/economy-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/economy/economy-history.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/economy/economy-impact-preview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/partner-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const entity of ["VX Points", "Trust Score", "Ранг", "VX Rewards"]) {
    assert.match(`${types}${service}${overview}${impact}`, new RegExp(entity, "i"));
  }
  for (const rank of ["Explorer", "Navigator", "Atlas", "Prime", "Signature"]) {
    assert.match(service, new RegExp(rank, "i"));
  }
  assert.match(service, /pointsTotals/);
  assert.match(service, /findTrustSnapshot/);
  assert.match(service, /promoteRank/);
  assert.match(service, /getHistory/);
  assert.match(overview, /Не являются деньгами/);
  assert.match(overview, /Серверные данные/);
  assert.match(history, /неизменяемая серверная хронология/i);
  assert.match(history, /История не переписывается/i);
  assert.match(playerShell, /\/dashboard\/economy/);
  assert.match(partnerShell, /\/partner\/economy/);
  assert.match(styles, /economyMetricGrid/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${types}${overview}${history}${impact}`, /localStorage|sessionStorage/i);
  assert.doesNotMatch(`${types}${overview}${history}${impact}`, /₽|₺|₼|\$\d|успешно начислено|выплачено/i);
});

test.skip("server-renders VX Rewards catalog, detail and history for both roles (requires authenticated database fixture)", async () => {
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

test("VX Rewards uses server lifecycle, ownership and claim", async () => {
  const [types, service, status, catalog, detail, lifecycle, history, playerShell, partnerShell, styles] = await Promise.all([
    readFile(new URL("../lib/economy/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/services/economy-reward-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-status.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-catalog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-lifecycle.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-history.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/partner-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const label of ["Ожидается", "Ожидает подтверждения", "Подтверждён", "Готовится", "Доступен", "Предоставлен", "Отклонён", "Отменён", "Истёк"]) {
    assert.match(status, new RegExp(label, "i"));
  }
  assert.match(service, /rewardStateMachine/);
  assert.match(service, /claimReward/);
  assert.match(service, /findReward\(rewardId, principal\.userId\)/);
  assert.doesNotMatch(lifecycle, /role="tablist"|aria-selected/);
  assert.match(lifecycle, /Связанное задание/);
  assert.match(lifecycle, /История изменений Reward/);
  assert.match(lifecycle, /\/api\/rewards/);
  assert.match(history, /неизменяемая серверная хронология/i);
  assert.match(catalog, /Серверные данные/);
  assert.match(detail, /серверные данные/i);
  assert.match(playerShell, /\/dashboard\/rewards/);
  assert.match(partnerShell, /\/partner\/rewards/);
  assert.match(styles, /rewardLifecycleTabs/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${types}${catalog}${detail}${lifecycle}${history}`, /localStorage|sessionStorage/i);
  assert.doesNotMatch(`${types}${catalog}${detail}${lifecycle}${history}`, /₽|₺|₼|\$\d|успешно начислено|выплачено/i);
});

test.skip("server-renders support center and creation for both roles (requires authenticated database fixture)", async () => {
  const routes = [
    ["/dashboard/support", /Помощь с сохранением контекста/i, /Кабинет игрока \| VX House/i],
    ["/dashboard/support/new", /Опишите вопрос в одном контексте/i, /Кабинет игрока \| VX House/i],
    ["/partner/support", /Помощь с сохранением контекста/i, /Кабинет партнёра \| VX House/i],
    ["/partner/support/new", /Опишите вопрос в одном контексте/i, /Кабинет партнёра \| VX House/i],
  ];

  for (const [pathname, content, title] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, title, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /Серверн|сохраняются защищённо на сервере/i, pathname);
    assert.doesNotMatch(html, /Демонстрац|данные не сохраняются|оператор онлайн|ответ через \d/i, pathname);
  }
});

test("support, appeals and notifications use server-backed contracts", async () => {
  const [data, service, migration, center, detail, creation, statusGuide, workspace, playerShell, partnerShell, task, reward, styles] = await Promise.all([
    readFile(new URL("../lib/support-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/services/support-notification-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260722080000_support_appeals_notifications_integration/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../components/support/support-center.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/support/support-ticket-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/support/support-new-ticket.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/support/support-status-guide.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/workspace-shell.tsx", import.meta.url), "utf8"),
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
    assert.match(migration, new RegExp(category, "i"));
  }
  assert.match(center, /Серверные данные/);
  assert.match(center, /Ваши обращения/);
  assert.match(detail, /Сообщения защищены и неизменяемы/);
  assert.match(detail, /Вложения/);
  assert.match(detail, /История статусов/);
  assert.match(detail, /\/api\/support/);
  assert.match(creation, /Создать обращение/);
  assert.match(creation, /\/api\/support/);
  assert.match(service, /createAppeal/);
  assert.match(service, /appealStateMachine/);
  assert.match(service, /markNotificationRead/);
  assert.match(workspace, /\/api\/notifications/);
  assert.match(migration, /AppealStatusHistory_append_only/);
  assert.match(migration, /NotificationStatusHistory_append_only/);
  assert.match(statusGuide, /следующий шаг/i);
  assert.match(playerShell, /\/dashboard\/support/);
  assert.match(partnerShell, /\/partner\/support/);
  assert.match(task, /Открыть Центр поддержки/);
  assert.match(reward, /Открыть Центр поддержки/);
  assert.match(styles, /supportConversation/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${data}${center}${detail}${creation}${statusGuide}`, /WebSocket|localStorage|sessionStorage|EventSource/i);
});

test.skip("server-renders the complete administrative workspace (requires authenticated database fixture)", async () => {
  const routes = [
    ["/admin", /Операционный контур VX House/i],
    ["/admin/users", /Поиск пользователей/i],
    ["/admin/opportunities", /публикация и архивация/i],
    ["/admin/reviews", /Подтверждение, отклонение/i],
    ["/admin/support", /Назначение оператора/i],
    ["/admin/economy", /компенсирующих ручных корректировок/i],
    ["/admin/notifications", /массовая отправка/i],
    ["/admin/audit", /Неизменяемый журнал/i],
  ];

  for (const [pathname, content] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, /Административная панель \| VX House/i, pathname);
    assert.match(html, content, pathname);
    assert.match(html, /Серверные данные|Записей пока нет|RBAC/i, pathname);
    assert.match(html, /aria-label="Навигация административной панели"/i, pathname);
    assert.doesNotMatch(html, /₽|₺|₼|реальных пользователей:\s*\d|выручка|выплачено/i, pathname);
  }
});

test("administrative workspace uses server-backed contracts", async () => {
  const [data, shell, overview, section, detail, editor, command, service, repository, migration, styles] = await Promise.all([
    readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-section-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-entity-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-entity-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-command-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/services/admin-application-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/repositories/prisma-admin-repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260722090000_admin_cms_moderation_integration/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const item of ["Пользователи", "Возможности", "Задания", "VX Rewards", "Экономика", "Поддержка", "Контент", "Настройки"]) {
    assert.match(`${data}${shell}`, new RegExp(item, "i"));
  }
  assert.match(shell, /kind: "admin"/);
  assert.match(overview, /Рассчитано сервером/);
  assert.match(service, /requirePermission/);
  assert.match(service, /AdminContentRevision|adminContentRevision/);
  assert.match(service, /MODERATION_DECISION|submissionReview/);
  assert.match(service, /admin\.economy\.adjusted/);
  assert.match(service, /notificationBatch/);
  assert.match(repository, /dashboard\(since/);
  assert.match(migration, /append_only/);
  assert.match(detail, /История изменений/);
  assert.match(editor, /AdminCommandForm/);
  assert.match(command, /\/api\/admin/);
  assert.match(styles, /adminSectionGrid/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${data}${overview}${section}${detail}${editor}${service}`, /localStorage|sessionStorage|WebSocket|EventSource/i);
  assert.doesNotMatch(`${data}${overview}${section}${detail}${editor}`, /₽|₺|₼|\$\d|успешно начислено|выплачено/i);
});

test("manager panel enforces Module 5 operational safeguards", async () => {
  const [data, overview, section, command, service, shell, styles] = await Promise.all([
    readFile(new URL("../lib/admin-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-section-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-command-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/services/admin-application-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
  ]);

  for (const area of ["Партнёрские сервисы", "Проверки", "Уведомления", "Команда и права", "Аудит"]) {
    assert.match(`${data}${shell}`, new RegExp(area, "i"));
  }
  for (const requirement of ["Инструкци", "Апелляци", "VX Points", "Trust Score"]) assert.match(`${data}${service}`, new RegExp(requirement, "i"));
  assert.match(overview, /Операционная статистика/);
  assert.match(section, /Сохранённые представления/);
  assert.match(section, /Массовые изменения/);
  assert.match(section, /adminPagination/);
  assert.match(command, /Обязательное основание/);
  assert.match(service, /users\.partner\.approve/);
  assert.match(service, /supportInternalNote/);
  assert.match(service, /idempotencyRecord/);
  assert.match(styles, /adminCommandForm/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${data}${overview}${section}${service}`, /WebSocket|localStorage|sessionStorage|EventSource/i);
});

test("connects final MVP platform operations without product demo sources", async () => {
  const [service, repository, forecastRoute, promocodeRoute, activationRoute, searchRoute, playerPage, partnerPage, partnerForecasts, partnerMaterials, workspaceShell, accessFlow, dashboardData, migration] = await Promise.all([
    readFile(new URL("../lib/services/platform-operations-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/repositories/prisma-platform-operations-repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/forecasts/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/promocodes/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/promocodes/[id]/activate/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/search/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/partner/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/pages/partner-forecasts-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/pages/partner-materials-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/workspace-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-flow.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/dashboard-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260722100000_platform_operations_mvp_completion/migration.sql", import.meta.url), "utf8"),
  ]);
  assert.match(service, /listForecasts/); assert.match(service, /activatePromocode/); assert.match(service, /workspaceSummary/); assert.match(service, /async search/);
  assert.match(repository, /ForecastAccessRule|accessRules/); assert.match(repository, /promocodeActivationHistory/);
  for (const route of [forecastRoute, promocodeRoute, activationRoute, searchRoute]) assert.match(route, /requireRequestPrincipal/);
  assert.match(activationRoute, /requireTrustedOrigin/); assert.match(activationRoute, /limitRequest/);
  assert.match(playerPage, /listForecasts/); assert.match(playerPage, /listPromocodes/); assert.match(partnerPage, /workspaceSummary/);
  assert.match(partnerForecasts, /ForecastCatalog/); assert.match(partnerMaterials, /PromocodeCatalog/); assert.match(workspaceShell, /\/api\/search/);
  assert.doesNotMatch(accessFlow, /localStorage|sessionStorage/);
  assert.doesNotMatch(dashboardData, /displayName|productRole|email/);
  assert.match(migration, /PromocodeActivation/); assert.match(migration, /append_only/);
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
    readFile(new URL("../lib/access-types.ts", import.meta.url), "utf8"),
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
  assert.match(accessFlow, /applySnapshot/);
  assert.match(accessFlow, /const TOTAL_STEPS = 8/);
  assert.doesNotMatch(accessFlow, /localStorage|sessionStorage/);
  assert.match(accessFlow, /fetch\(/);
  assert.match(accessFlow, /\/api\/auth\/register/);
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
  assert.match(accessProfile, /создадим защищённый\s+профиль/i);
  assert.match(accessProfile, /не сохраняется в черновике/i);
  assert.match(accessProfile, /onNameChange/);
  assert.match(accessProfile, /onEmailChange/);
  assert.match(accessProfile, /onContinue/);
  assert.match(accessConsent, /Мне исполнилось 18 лет/);
  assert.match(accessConsent, /опубликованной версией/i);
  assert.match(accessConsent, /обязательные документы/i);
  assert.match(accessComplete, /Профиль создан/);
  assert.match(accessComplete, /Безопасный вход настроен/);
  assert.match(accessComplete, /Открыть VX House/);
  assert.doesNotMatch(accessComplete, /Кабинет готов|Профиль активирован/i);
  assert.match(accessProgress, /"Проверка почты"/);
  assert.match(accessDraft, /AccessScenario/);
  assert.match(accessDraft, /AccessCountry/);
  assert.match(components, /"ui": "@\/components\/ui"/);
  assert.match(page, /<Hero \/>/);
  assert.match(page, /<InsidePlatform \/>/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(
    access(new URL("../public/_sites-preview", import.meta.url)),
  );
});

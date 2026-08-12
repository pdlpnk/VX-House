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
  assert.match(html, /<title>VX House — Private terms and rewards<\/title>/i);
  assert.match(html, /<html[^>]*lang="en"/i);
  assert.match(html, /<html[^>]*class="dark"/i);
  assert.match(html, /<main[^>]*id="main-content"/i);
  assert.match(html, /Skip to content/i);
  assert.match(html, /Get more from your activity/i);
  assert.match(html, /Private terms and rewards/i);
  assert.match(html, /How it works/i);
  assert.match(html, /Everything important at a glance/i);
  assert.match(html, /Special terms and rewards/i);
  assert.match(html, /Ready-to-use scenarios and guidance/i);
  assert.match(html, /Four simple steps/i);
  assert.match(html, /More opportunities\. Less uncertainty\./i);
  assert.match(html, /See which opportunities are available to you/i);
  assert.match(html, /VX Rewards are confirmed benefits/i);
  assert.match(html, /Türkiye and Azerbaijan/i);
  assert.match(html, /id="faq"/i);
  assert.match(html, /application\/ld\+json/i);
  assert.doesNotMatch(html, /12 480|\+ 1 250|Прайм|24\/7/i);
  assert.match(html, /href="\/access"/i);
  assert.doesNotMatch(html, /mailto:/i);
  assert.match(html, /aria-label="Main navigation"/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders the access welcome screen", async () => {
  const response = await render("/access");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Получение доступа \| VX House<\/title>/i);
  assert.match(html, /Checking your session/i);
  assert.match(html, /Adults only/i);
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
  assert.match(shell, /nav\.home/);
  assert.match(workspaceShell, /workspace\.notifications/);
  assert.match(workspaceShell, /WorkspaceShell/);
  assert.match(shell, /href: "\/dashboard\/support"/);
  assert.match(home, /dashboard\.personalManager/);
  assert.match(home, /dashboard\.contactManager/);
  assert.doesNotMatch(home, /Trust Score/);
  assert.doesNotMatch(home, /VX Points|dashboard\.quickAccess|summary\.activeTasks|dashboard\.firstTask/);
  assert.doesNotMatch(home, /ForecastCatalog|PromocodeCatalog/);
  assert.match(opportunities, /redirect\("\/dashboard"\)/);
  assert.match(settings, /settings\.reducedMotion/);
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
  assert.match(shell, /workspace\.partnerArea/);
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

  for (const status of ["lifecycle.available", "lifecycle.accepted", "lifecycle.inProgress", "lifecycle.awaitingSubmission", "lifecycle.submitted", "lifecycle.underReview", "lifecycle.clarification", "lifecycle.confirmed", "lifecycle.rejected"]) {
    assert.match(lifecycleComponent, new RegExp(status, "i"));
  }

  assert.match(lifecycleComponent, /\/api\/tasks/);
  assert.match(lifecycleComponent, /lifecycle\.saveDraft/);
  assert.match(lifecycleComponent, /lifecycle\.submit/);
  assert.match(lifecycleComponent, /lifecycle\.happened/);
  assert.match(service, /SubmissionVersion/);
  assert.match(service, /assertTransition/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(lifecycleComponent, /role="tablist"|aria-selected|localStorage|sessionStorage/i);
});

test("player progress UI keeps server data and hides internal Trust Score", async () => {
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

  for (const entity of ["VX Points", "Trust Score", "impact.rank", "VX Rewards"]) assert.match(`${types}${service}${impact}`, new RegExp(entity, "i"));
  for (const rank of ["Explorer", "Navigator", "Atlas", "Prime", "Signature"]) {
    assert.match(service, new RegExp(rank, "i"));
  }
  assert.match(service, /pointsTotals/);
  assert.match(service, /findTrustSnapshot/);
  assert.match(service, /promoteRank/);
  assert.match(service, /getHistory/);
  for (const level of ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]) assert.match(overview, new RegExp(level, "i"));
  assert.match(overview, /economy\.monthAccruals/);
  assert.match(overview, /economy\.accrualHistory/);
  assert.match(history, /history\.title/i);
  assert.doesNotMatch(`${overview}${history}`, /Trust Score|серверная хронология|Серверные данные/i);
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

  for (const label of ["reward.statusExpected", "reward.statusAwaiting", "reward.statusConfirmed", "reward.statusPreparing", "reward.statusAvailable", "reward.statusProvided", "reward.statusRejected", "reward.statusCancelled", "reward.statusExpired"]) {
    assert.match(status, new RegExp(label, "i"));
  }
  assert.match(service, /rewardStateMachine/);
  assert.match(service, /claimReward/);
  assert.match(service, /findReward\(rewardId, principal\.userId\)/);
  assert.doesNotMatch(lifecycle, /role="tablist"|aria-selected/);
  assert.match(lifecycle, /rewardUi\.relatedTask/);
  assert.match(lifecycle, /rewardLife\.changeHistory/);
  assert.match(lifecycle, /\/api\/rewards/);
  assert.match(history, /rewardUi\.fullHistory/i);
  assert.match(catalog, /rewardUi\.currentData/);
  assert.match(detail, /rewardUi\.current/i);
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
  const [service, migration, messenger, messengerStyles, workspace, dashboardStyles, readRoute, playerShell, partnerShell, task, reward] = await Promise.all([
    readFile(new URL("../lib/services/support-notification-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260722080000_support_appeals_notifications_integration/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../components/messenger/personal-messenger.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/messenger/personal-messenger.module.css", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/workspace-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/api/support/[id]/read/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/partner/partner-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/opportunities/task-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/rewards/reward-detail.tsx", import.meta.url), "utf8"),
  ]);

  for (const category of ["Доступ к платформе", "Задание", "Проверка результата", "VX Rewards", "Профиль и настройки", "Апелляция", "Сотрудничество"]) {
    assert.match(migration, new RegExp(category, "i"));
  }
  assert.match(messenger, /messenger\.manager/);
  assert.match(messenger, /messenger\.placeholder/);
  assert.match(messenger, /messenger\.attachFile/);
  assert.match(messenger, /messenger\.expand/);
  assert.match(messenger, /\/api\/support/);
  assert.match(service, /createAppeal/);
  assert.match(service, /appealStateMachine/);
  assert.match(service, /getPersonalConversation/);
  assert.match(service, /markConversationRead/);
  assert.match(service, /markNotificationRead/);
  assert.match(workspace, /\/api\/notifications/);
  assert.doesNotMatch(workspace, /const unreadMessages = notifications\.filter/);
  assert.match(readRoute, /markConversationRead/);
  assert.match(dashboardStyles, /\.navLink > i \{ position: absolute;/);
  assert.match(migration, /AppealStatusHistory_append_only/);
  assert.match(migration, /NotificationStatusHistory_append_only/);
  assert.match(playerShell, /\/dashboard\/support/);
  assert.match(partnerShell, /\/partner\/support/);
  assert.match(task, /task\.messageManager/);
  assert.match(reward, /rewardUi\.manager/);
  assert.match(messengerStyles, /prefers-reduced-motion/);
  assert.doesNotMatch(`${messenger}${playerShell}${partnerShell}`, /Новый диалог|Создать обращение|Ожидает оператора|Приоритет/i);
  assert.doesNotMatch(messenger, /WebSocket|localStorage|EventSource/i);
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
  assert.match(overview, /Рабочее пространство VX House/);
  assert.doesNotMatch(overview, /Активные задания|VX Points|Rewards в процессе|Результаты на проверке/);
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
  assert.doesNotMatch(playerPage, /listForecasts|listPromocodes|workspaceSummary/); assert.match(partnerPage, /workspaceSummary/);
  assert.match(partnerForecasts, /ForecastCatalog/); assert.match(partnerMaterials, /PromocodeCatalog/); assert.match(workspaceShell, /\/api\/search/);
  assert.doesNotMatch(accessFlow, /localStorage|sessionStorage/);
  assert.doesNotMatch(dashboardData, /displayName|productRole|email/);
  assert.match(migration, /PromocodeActivation/); assert.match(migration, /append_only/);
});

test("includes scalable theme and component contracts", async () => {
  const [theme, effects, hero, platform, accessFlow, accessScenario, accessBenefits, accessWelcome, accessRegistration, accessConsent, accessComplete, accessProgress, accessDraft, accessContent, components, page, packageJson] = await Promise.all([
    readFile(new URL("../styles/theme.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/effects.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/hero.css", import.meta.url), "utf8"),
    readFile(new URL("../styles/platform.css", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-flow.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-scenario-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-benefits-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-onboarding-welcome-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-registration-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-consent-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-complete-step.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/access/access-progress.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/access-types.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/i18n/access-content.ts", import.meta.url), "utf8"),
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
  assert.match(accessWelcome, /onCountryChange/);
  assert.doesNotMatch(accessWelcome, /onLanguageChange|access-language/);
  assert.match(accessRegistration, /onNameChange/);
  assert.match(accessRegistration, /onEmailChange/);
  assert.match(accessRegistration, /onSubmit/);
  assert.match(accessFlow, /preferredLanguage:\s*toDatabaseLanguage\(locale\)/);
  assert.match(accessContent, /Мне исполнилось 18 лет/);
  assert.match(accessConsent, /useI18n/);
  assert.match(accessContent, /опубликованной версией/i);
  assert.match(accessContent, /обязательные документы/i);
  assert.match(accessContent, /Знакомство завершено/);
  assert.match(accessContent, /Безопасный вход настроен/);
  assert.match(accessContent, /Перейти к заданиям/);
  assert.doesNotMatch(accessComplete, /Кабинет готов|Профиль активирован/i);
  assert.match(accessProgress, /"progress\.email"/);
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

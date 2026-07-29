# Registration Stabilization — отчёт

## Итог

Сценарий регистрации восстановлен полностью: новый пользователь создаёт профиль, подтверждает почту и согласия, нажимает «Открыть VX House» и видит рабочий кабинет. Проверены Player `/dashboard` и Partner `/partner`, повторная загрузка, выход, повторный вход и восстановление сессии.

UI, тексты, лендинг и структура кабинетов не менялись. Добавлено только нейтральное состояние временной ошибки кабинета после устранения технической причины.

## Точная первопричина

Аккаунт создавался успешно. Падал первый серверный рендер Dashboard.

Vinext выполняет RSC layout и page в отдельных Cloudflare Workerd-изолятах. Каждый изолят создавал собственный Prisma/`pg` pool, а локальный PostgreSQL bridge Prisma Dev Server разделял состояние безымянных prepared statements и portals между соединениями. Параллельные запросы профиля, экономики, уведомлений, прогнозов и промокодов повреждали PostgreSQL protocol state.

Зафиксированные серверные ошибки:

```text
PrismaClientKnownRequestError
Invalid prisma.vXReward.count() invocation
Database error 08P01:
bind message supplies 2 parameters, prepared statement "" requires 3

PrismaClientKnownRequestError
Invalid prisma.vXReward.findMany() invocation
Database error 34000:
portal "" does not exist

PrismaClientKnownRequestError
Invalid prisma.onboardingProgress.create() invocation
Database error 08P01:
bind message supplies 5 parameters, prepared statement "" requires 0
```

Сокращённый стек воспроизведения:

```text
EconomyRewardApplicationService.snapshot
→ PrismaEconomyRewardRepository.listRewards
→ prisma.vXReward.findMany / count
→ Prisma adapter-pg
→ Prisma Dev PostgreSQL bridge
→ React Server Components stream
→ resolveErrorDev / processFullBinaryRow
→ Connection terminated unexpectedly
```

PostgreSQL и Prisma Dev Server не завершались. `DATABASE_URL` был корректен. Ошибка находилась в локальном transport/concurrency layer, а сообщение React было лишь следствием преждевременно оборванного RSC stream.

## Состояние БД в момент исходного падения

Read-only проверка БД после воспроизведения подтвердила:

- `User` создан;
- `UserProfile` создан;
- соответствующий `PlayerProfile` создан;
- `Session` создана и не истекла;
- `OnboardingProgress` имеет статус `COMPLETED`;
- контакт имеет статус `VERIFIED`;
- две актуальные consent records сохранены;
- аккаунт имеет статус `ACTIVE`;
- частичных записей текущей регистрации нет.

Следовательно, регистрационная транзакция завершалась до перехода, cookie устанавливалась, а Dashboard корректно определял current user. Падал именно последующий Dashboard loader.

## Исправление

- Для локального Prisma Dev добавлен единый FIFO-координатор запросов между Workerd-изолятами.
- Development `pg` pool ограничен одним соединением на client.
- Каждому development SQL statement назначается уникальное имя.
- Настройки координатора передаются в локальные Workerd bindings по закрытому allowlist; в production они не включаются.
- Production PostgreSQL сохраняет штатную конкурентность и не использует development-координатор.
- Dashboard loaders используют один переданный Prisma client в пределах своего server context.
- Независимые запросы пустого Dashboard выполняются последовательно там, где локальный bridge не поддерживает безопасную параллельность.
- Ненужная вложенная связь `profile.user` удалена из workspace summary; дата берётся из обязательного `UserProfile.createdAt`.
- В runtime нет вызовов `prisma.$disconnect()`; отключение осталось только в явном lifecycle helper и тестовых/CLI-процессах.
- Добавлены структурированные события `registration_started`, `user_created`, `profile_created`, `session_created`, `registration_committed`, `redirect_started`, `dashboard_session_resolved`, `dashboard_profile_loaded`, `dashboard_data_loaded`.
- Логи не содержат пароль, session token, verification token, email или cookie. Каждый критичный путь имеет correlation ID.
- Добавлены error states Player/Partner с кнопкой «Повторить»; они не использовались как замена исправлению.

## Redirect, session и cookie

Проверенная цепочка:

`register → commit transaction → Set-Cookie → email verification → consent transaction → redirect target → dashboard guard → dashboard data`.

Клиент делает один `window.location.assign()` только после успешного ответа. Серверный `redirect()` не находится в `try/catch` регистрационной транзакции. Повторная отправка с тем же idempotency key возвращает существующий результат и не создаёт второй аккаунт.

Session cookie проверена на `Path=/`, `HttpOnly`, `SameSite=Lax`. В development по HTTP отсутствует `Secure`; production-настройки не ослаблены. Session присутствует в БД, доступна на Dashboard, переживает refresh и корректно отзывается при logout.

## Пустой Dashboard и роли

Новый Player корректно видит пустые серверные состояния:

- VX Points: `0`;
- ранг: нет данных;
- Trust Score: нет данных;
- задания, Rewards, возможности, уведомления, обращения, прогнозы и промокоды: пустые состояния.

Новый Partner направляется на `/partner` и видит состояние партнёрского пространства/ожидания одобрения. Redirect loop, `Unauthorized`, `Missing Profile`, 404 и конфликт profile type не воспроизведены.

## Регрессионные тесты

`tests/registration-stabilization.integration.test.mts` теперь проверяет:

- Player registration → session → onboarding → `/dashboard` 200 → пустой Dashboard;
- Partner registration → session → onboarding → `/partner` 200;
- две последовательные загрузки кабинета после регистрации;
- logout → 401 → login → кабинет → refresh session;
- 3 Player и 2 Partner конфигурации рынка/языка;
- cookie attributes;
- атомарность невалидной регистрации;
- idempotent double submit без второго User;
- отсутствие `$disconnect()` в application request lifecycle.

Отдельные database tests подтверждают rollback мутации и audit в одной транзакции.

## Ручная проверка

В браузере вручную проверены:

- Player №1: регистрация, onboarding, Dashboard, refresh, logout, login;
- Player №2: регистрация после исправления, «Открыть VX House», две повторные загрузки, logout и повторный login;
- Partner №1: регистрация, подтверждение, `/partner`, refresh, logout и повторный login.

Для всех проверенных переходов React runtime overlay отсутствует. Player Dashboard показывает `Обзор прогресса`, Partner Dashboard — `Рабочее пространство партнёра`.

## Изменённые файлы

Ключевые изменения:

- `lib/db/client.ts`;
- `scripts/database-lock-coordinator.mjs`;
- `scripts/start-development.mjs`;
- `scripts/run-isolated-database-tests.mjs`;
- `vite.config.ts`;
- `lib/server/page-guards.ts`;
- `app/dashboard/page.tsx`, `app/dashboard/layout.tsx`;
- `app/partner/page.tsx`, `app/partner/layout.tsx`;
- server services/repositories экономики, уведомлений и platform operations;
- `lib/services/identity-onboarding-service.ts`;
- `app/api/auth/register/route.ts`;
- `app/api/onboarding/complete/route.ts`;
- `components/dashboard/dashboard-error-state.tsx`;
- `app/dashboard/error.tsx`, `app/partner/error.tsx`;
- `tests/registration-stabilization.integration.test.mts`.

Prisma schema и миграции не менялись.

## Результаты проверок

| Проверка | Результат |
|---|---|
| Prisma validate | успешно |
| Prisma generate | успешно, edge и Node clients |
| Миграции | 12 из 12 успешно применены к чистой изолированной БД |
| Database/auth/integration tests | 81 успешно, 0 ошибок |
| Registration regression suite | 8 успешно, включая 5 полных аккаунтов |
| SSR/static contracts | 13 успешно, 6 fixture-dependent проверок штатно пропущены |
| Lint | успешно |
| Typecheck | успешно |
| Production build | успешно |
| Browser Player/Partner smoke | успешно |
| `/dashboard` после первого входа | 200, рабочий интерфейс |
| `/dashboard` после повторных загрузок | 200, рабочий интерфейс |

Предупреждения Prisma Dev об experimental SQLite, `pg client.query()` deprecation и Vite-оптимизации `lucide-react` относятся к локальным зависимостям и не являются ошибками приложения.

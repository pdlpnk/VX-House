# Stage 13 — Part 6: отчёт

## Что реализовано

### Проверяемая база данных

- Добавлена воспроизводимая конфигурация PostgreSQL 17 для раздельных development и test окружений.
- Добавлен автоматический stateless-прогон временного локального Prisma PostgreSQL для CI и окружений без Docker.
- Все пять Prisma migrations применены с нуля через `prisma migrate deploy`.
- Исправлено приведение CamelCase-имён append-only таблиц в миграции Part 5, обнаруженное только при реальном применении SQL.
- Добавлена отдельная миграция Identity/Profile/Consent foundation.

### Проверенные ограничения

Integration tests подтверждают:

- запрет UPDATE и DELETE для `AuditEvent` и `UserConsent`;
- уникальность idempotency receipt;
- уникальность market-specific версии согласия;
- корректность арифметики Trust Score;
- связность amount/currency у Rewards;
- соответствие `UserTask.taskVersionId` выбранному `taskDefinitionId`;
- обязательный источник Appeal;
- невозможность системного сообщения выдавать себя за пользователя;
- атомарный rollback мутации и audit event.

### Транзакционные примитивы

- Единая граница `Serializable`-транзакции с ограниченным повтором конфликтов сериализации.
- Один серверный timestamp на транзакционную попытку.
- Типизированные application errors и отображение Prisma conflict/not-found/optimistic errors.
- Серверная authorization policy до мутации.
- Канонический SHA-256 hash payload и durable idempotency receipt.
- Audit и security event services, работающие на том же transaction client.
- Атомарная последовательность authorize → validate → mutate → audit/idempotency → commit.

### Первый вертикальный серверный сценарий

Реализованы только Identity + Profile + Market + Consent:

- чтение активных рынков;
- создание продуктового профиля игрока или партнёра;
- обязательная серверная проверка активного рынка, языка и продуктовой роли;
- `PlayerProfile` и `PartnerProfile` создаются только в состоянии `PENDING`;
- безопасное чтение профиля без password hash, session token и других секретов;
- отдельные операции смены языка и рынка;
- смена рынка требует отдельного серверного permission;
- продуктовая роль неизменяема обычной командой и защищена trigger;
- контакт остаётся `UNVERIFIED`; публичного способа отметить его подтверждённым нет;
- версии согласий привязаны к рынку и языку;
- принятие фиксирует конкретную опубликованную версию;
- повтор той же команды идемпотентен;
- обязательные согласия проверяются по актуальным версиям документов.

### Repositories и fixtures

Добавлены Prisma repositories только для разрешённого вертикального среза и инфраструктурной идемпотентности. Все запросы используют ограниченные `select` и поддерживают `Prisma.TransactionClient`.

Development fixtures содержат только синтетические рынки TR/AZ, языки RU/TR/AZ, пользователя `.invalid` и синтетические документы. Автоматический запуск в production исключён.

## Архитектурные решения

- Product role отделена от инфраструктурных RBAC roles и permissions.
- Согласие является append-only историей конкретных версий, а не изменяемым флагом профиля.
- Идемпотентность хранится в БД и коммитится вместе с результатом команды.
- Соответствие product role и subtype проверяется deferred constraint triggers в момент commit.
- Клиент не является источником истины для рынка, роли, статуса партнёра, contact verification или consent eligibility.

## Проверки

- Fresh migration deploy: успешно, 5 из 5 миграций.
- Prisma validate: успешно.
- Prisma generate: успешно.
- DB/service integration tests: успешно, 12 из 12.
- Lint: успешно.
- Typecheck: успешно.
- Production build: успешно, все существующие маршруты собраны без ошибок.

## Что сознательно не реализовано

- frontend, пользовательские API endpoints и Server Actions;
- подключение к Landing, onboarding, Dashboard, Partner или Admin UI;
- настоящая авторизация экранов;
- задания, VX Rewards, VX Points, Trust Score, Support и другие продуктовые домены;
- изменение или удаление demo/mock/localStorage источников;
- production secrets и production database credentials;
- автоматические production fixtures;
- background jobs и внешние интеграции.

## Что остаётся до завершения Stage 13

- подключить серверные сценарии к будущим API/Server Actions только на отдельном согласованном этапе;
- реализовать остальные vertical slices по ROADMAP;
- настроить production PostgreSQL, secrets, observability и backup jobs в целевой инфраструктуре;
- добавить настоящую end-to-end авторизацию и миграцию frontend-источников данных без преждевременного удаления текущих демонстрационных источников.

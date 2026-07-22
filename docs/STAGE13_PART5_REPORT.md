# Отчёт по Этапу 13, часть 5 — доменная модель и контракты данных

## Результат

Подготовлена единая серверная доменная модель VX House, которая связывает продуктовую концепцию, frontend foundation Этапов 2–12 и инфраструктуру Stage 13 Parts 1–4.

Frontend, Landing, onboarding, Dashboard, Partner и Admin не изменялись. API routes, Server Actions и подключение UI к Prisma не создавались. Существующие demo/mock/localStorage-источники сохранены.

## Что реализовано

### Аудит источников данных

Проверены:

- публичные статические демонстрации;
- React state и временный draft onboarding;
- оба localStorage-ключа настроек кабинетов;
- `opportunity-data`, `task-lifecycle`, `economy-data`, `reward-data`, `support-data`, `admin-data`;
- hardcoded массивы Dashboard, Partner, Admin и публичных секций;
- временные frontend-типы ролей, рынков, статусов, рангов и экономики.

Создан `docs/DATA_SOURCE_MIGRATION_MAP.md` с цепочкой:

`Frontend source → Domain entity → Repository → Service → Future contract`.

Карта отдельно фиксирует порядок замены и запрещённые сокращения миграции. Никакие текущие источники не удалены.

### Доменные границы

В `lib/domain/boundaries.ts` формализованы 16 логических границ:

1. Identity and Profile;
2. Market and Localization;
3. Consent;
4. Partner Services;
5. Opportunities;
6. Instructions;
7. Tasks and Submissions;
8. VX Points;
9. Ranks;
10. Trust Score;
11. VX Rewards;
12. Support and Appeals;
13. Forecasts and Content;
14. Notifications;
15. Admin Operations;
16. Audit and Security.

Это модули одного приложения, а не микросервисы.

### Prisma domain model

В `schema.prisma` добавлены 42 доменные модели поверх шести инфраструктурных моделей Parts 1–4. Всего схема содержит 48 моделей и 24 enum.

Identity и рынки:

- `Market`;
- `UserProfile`;
- `PlayerProfile`;
- `PartnerProfile`.

Согласия:

- `ConsentDocument`;
- `ConsentVersion`;
- `UserConsent`.

Партнёры и возможности:

- `PartnerService`;
- `PartnerServiceMarket`;
- `Opportunity`;
- `OpportunityAudience`;
- `OpportunityEligibility`;
- `Promocode`.

Инструкции:

- `Instruction`;
- `InstructionVersion`;
- `InstructionStep`;
- `InstructionAudience`.

Задания и проверки:

- `TaskDefinition`;
- `TaskVersion`;
- `TaskVersionAudience`;
- `UserTask`;
- `UserTaskStatusHistory`;
- `TaskSubmission`;
- `SubmissionVersion`;
- `SubmissionReview`.

Экономика и Rewards:

- `VXPointsLedgerEntry`;
- `RankDefinition`;
- `UserRank`;
- `TrustScoreEvent`;
- `TrustScoreSnapshot`;
- `RewardType`;
- `VXReward`;
- `RewardStatusHistory`.

Поддержка, контент и операции:

- `SupportConversation`;
- `SupportMessage`;
- `SupportInternalNote`;
- `SupportStatusHistory`;
- `Appeal`;
- `Forecast`;
- `ForecastVersion`;
- `ForecastAccessRule`;
- `Notification`.

### Версии, uniqueness и idempotency

Уникальность закреплена для версий согласий, инструкций, заданий, отправок, прогнозов и ранговых конфигураций.

Idempotency key добавлен для:

- оценки доступности;
- назначения задания;
- VX Points;
- ранга;
- Trust Score;
- VX Reward;
- уведомлений.

Для повторных попыток задания действует уникальность `user + task definition + attempt number`. Для принятого задания база дополнительно проверяет принадлежность версии тому же определению задания.

### Append-only и ограничения БД

Миграция защищает от `UPDATE` и `DELETE`:

- eligibility history;
- историю статусов задания;
- решения проверки;
- ledger VX Points;
- историю рангов;
- события Trust Score;
- историю Reward;
- сообщения, внутренние заметки и историю статусов поддержки.

Добавлены database checks:

- Trust Score остаётся в диапазоне 0–100 и соответствует delta;
- денежный Reward имеет трёхбуквенную валюту;
- versions и attempt numbers положительны;
- интервалы публикации и действия корректны;
- reversal Points ссылается на исходную запись;
- апелляция имеет спорное основание;
- системное сообщение не имитирует пользователя или оператора.

### Domain types и contracts

Добавлены:

- DTO для профиля, аудиторий, возможностей, версий, заданий, экономики, Rewards, поддержки и прогнозов;
- cursor pagination;
- version identifiers;
- money как точная decimal-строка с ISO currency, без JavaScript float;
- actor/ownership boundaries;
- idempotent command contract;
- repository interfaces;
- service interfaces.

Контракты не принимают роль, рынок или owner от клиента как источник разрешения.

### State machines

Централизованы deny-by-default переходы для:

- account;
- publication и instruction publication;
- task lifecycle;
- submission;
- review;
- Reward;
- support conversation;
- appeal;
- forecast publication.

Недопустимый переход вызывает отказ. Реальная транзакционная интеграция намеренно не реализована.

### Документация

Созданы:

- `docs/DOMAIN_MODEL.md`;
- `docs/DATA_SOURCE_MIGRATION_MAP.md`;
- `docs/STAGE13_PART5_REPORT.md`.

## Найденные demo/mock/localStorage-источники

Основные авторитетно неиспользуемые источники:

- `vx-house-access-draft-v1`;
- `vx-house-player-dashboard-preferences`;
- `vx-house-partner-dashboard-preferences`;
- локальный state имени, email и согласий onboarding;
- 8 demo-возможностей и 2 demo-задания;
- frontend lifecycle задания;
- пустой economy snapshot, rank order и Reward previews;
- каталог из 6 типов и 7 frontend-статусов Reward;
- 4 demo-обращения поддержки;
- 13 Admin sections и их демонстрационные entities/capabilities;
- hardcoded рабочие области Player и Partner dashboard;
- публичные статические preview-данные, которые остаются редакционным объяснением.

Полный маршрут замены указан в `DATA_SOURCE_MIGRATION_MAP.md`.

## Архитектурные решения

1. `User` и инфраструктурные роли отделены от `UserProfile.productRole`.
2. Роль, рынок и ownership определяются серверными relations.
3. Сегментация моделируется relation-таблицами роли и рынка, а не строковыми массивами клиента.
4. Опубликованный контент и условия имеют immutable version identity.
5. Повторная отправка создаёт новую `SubmissionVersion`.
6. Проверка связана с конкретной версией результата.
7. Points, Rank и Trust представлены событиями; текущий Trust snapshot является производной проекцией.
8. Денежные и неденежные Rewards разделены value kind и полями значения.
9. Исторические actor ids не всегда имеют FK, чтобы удаление сотрудника не разрушало аудит.
10. Промокод подготовлен для хранения как защищённый payload, а не открытая строка.
11. State machines не зависят от Prisma Client или frontend.
12. Repository/service contracts введены до delivery layer, поэтому будущие API не становятся доменной моделью.

## Что сознательно не реализовано

- API routes и Server Actions;
- Prisma implementations продуктовых repositories;
- бизнес-логика services;
- подключение UI к базе;
- удаление demo/mock/localStorage;
- auth-интеграция существующих страниц;
- реальные задания и отправки;
- реальные проверки;
- реальные начисления Points или Trust;
- расчёт ранга;
- реальные Rewards, деньги и выплаты;
- поддержка и сообщения;
- прогнозы и промокоды;
- вложения и файловое хранилище;
- production seed;
- применение миграции к production или неизвестной базе;
- локализация, monitoring provider и deployment.

## Риски и открытые решения

- юридические версии согласий для TR/AZ ещё не утверждены;
- не утверждены data retention и deletion policies;
- не определены реальные валюты, типы Rewards и финансовый процесс;
- не утверждены Points, Trust и rank configurations;
- согласованность current status и append-only history должна обеспечиваться транзакционными services;
- Trust snapshot требует процедуры проверки и восстановления из event log;
- соответствие `ProductRole` ролевому subprofile должно проверяться domain service;
- polymorphic `sourceType/sourceId` требуют allowlist и service-level integrity;
- custom SQL checks и triggers пока проверены статически, но не на отдельном PostgreSQL instance;
- защищённые payload промокодов и сообщений требуют keyring/rotation интеграции Part 4;
- Prisma migration не применялась и требует проверки на изолированной development database до любого production решения.

## Проверки

- Prisma format — успешно;
- Prisma validate — успешно;
- Prisma Client generation — успешно;
- domain foundation tests, включая status transitions — 4 из 4 успешно;
- uniqueness/idempotency assumptions — успешно;
- migration append-only and integrity assertions — успешно;
- lint — успешно;
- typecheck — успешно;
- production build — успешно;
- frontend route set — production build сформировал прежние маршруты без новых endpoints.

## Что должно стать следующей частью Stage 13

Следующая часть должна реализовать транзакционные Prisma repositories и application services поверх утверждённых контрактов, связать status transitions, authorization, idempotency и audit в одной серверной операции, а затем проверить миграцию на изолированной development database.

Frontend и delivery endpoints следует подключать только отдельным явно утверждённым шагом после этого. Part 6 в рамках текущей задачи не начиналась.

# Карта миграции источников данных VX House

## Назначение

Документ инвентаризирует текущие hardcoded, demo, mock и localStorage-источники и связывает их с серверными сущностями. Статус строк обновляется только после фактической интеграции.

Колонка «Будущий контракт» фиксирует реализованный DTO/use case либо дальнейшее расширение контракта. После Functional Integration Module 6 все продуктовые пользовательские источники мигрированы на сервер; локально сохраняются только настройки интерфейса.

## 1. LocalStorage и onboarding

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| удалённый `lib/access-draft.ts` | **Мигрировано:** localStorage-черновик удалён | `UserProfile`, `Market`, `OnboardingProgress` | identity/onboarding repositories | `IdentityOnboardingService` | Auth/onboarding JSON contracts | До регистрации состояние живёт только в памяти вкладки; после регистрации восстановление выполняется по защищённой серверной сессии |
| `components/access/access-flow.tsx` | **Мигрировано:** имя, email, роль, рынок, язык, этап и согласия после регистрации | `User`, `UserProfile`, `OnboardingProgress`, `ConsentVersion`, `UserConsent` | identity/onboarding repositories | `IdentityOnboardingService` | Реальные auth/onboarding JSON contracts | Сервер — единственный источник истины после регистрации; localStorage не используется |
| `components/access/access-scenario-step.tsx` | `player`, `partner` | `ProductRole`, ролевые профили | `ProfileRepository` | access service | `ProductRoleChoiceDTO` | Клиент отправляет намерение; сервер проверяет и назначает роль |
| `components/access/access-market-step.tsx` | Турция, Азербайджан; RU/TR/AZ | `Market`, `LanguageCode`, `UserProfile` | profile/market repository | access service | `MarketPreferenceDTO` | Список рынков приходит из активной конфигурации; сервер подтверждает доступность |
| `components/access/access-consent-step.tsx` | **Мигрировано:** 18+ и конкретные опубликованные версии | `ConsentDocument`, `ConsentVersion`, `UserConsent` | consent repositories | `IdentityOnboardingService` | Onboarding snapshot/complete | Boolean остался только presentation state для 18+; согласия фиксируются по version id сервером |
| `lib/dashboard-data.ts`, ключи workspace preferences | Только `reducedMotion` | device-local UI preference | — | — | `DashboardPreferences` | Разрешённый локальный UI preference; имя, роль и данные продукта приходят с сервера |
| `lib/partner-data.ts` | Только ключ и default UI preference партнёрского workspace | device-local UI preference | — | — | `DashboardPreferences` | Продуктовые данные не хранятся локально |

## 2. Публичные демонстрации

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| `components/platform-dashboard.tsx` | Статическая демонстрация маршрута | Не пользовательские данные; концептуально Opportunity, Instruction, SubmissionReview, VXReward | — | — | Публичный product preview | Оставить статическим объяснением; не подставлять реальные персональные данные |
| `components/sections/product-model.tsx` | Два сценария роли | `ProductRole` | — | — | Публичный справочный контент | Оставить редакционным контентом до появления CMS |
| `components/sections/how-it-works.tsx` | Этапы общего процесса | Доменные lifecycle | — | — | Публичный справочный контент | Сверять с state machines, но не превращать public page в live data |
| `components/sections/benefits.tsx`, `faq.tsx` | Продуктовые объяснения | PRODUCT_V2, не пользовательские записи | — | — | Публичный content contract в будущем | Не мигрировать в продуктовую БД на этом этапе |

## 3. Возможности, инструкции и задания

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| Удалённый `lib/opportunity-data.ts` → `opportunities` | **Мигрировано:** demo-массив удалён; каталог, поиск, фильтр и доступность загружаются с сервера | `Opportunity`, `OpportunityAudience`, `OpportunityEligibility` | `PrismaOpportunityTaskRepository` | `OpportunityTaskApplicationService` | `OpportunityView`, server-derived availability | Сервер проверяет публикацию, архив, роль, рынок и персональную eligibility |
| Удалённый `lib/opportunity-data.ts` → `tasks` | **Мигрировано:** demo-задания удалены; используются конкретные опубликованные версии | `TaskDefinition`, `TaskVersion`, `TaskVersionAudience` | `PrismaOpportunityTaskRepository` | `OpportunityTaskApplicationService` | `TaskVersionView` | При принятии сохраняется конкретный `taskVersionId` |
| Удалённый `lib/opportunity-data.ts` → `sharedTaskSteps` | **Мигрировано:** временные шаги удалены | `InstructionVersion`, `InstructionSection`, `InstructionStep`, `InstructionAudience` | `PrismaOpportunityTaskRepository` | `OpportunityTaskApplicationService` | `InstructionView` | Задание продолжает читать закреплённый `instructionVersionId` после новой публикации |
| Удалённый `lib/task-lifecycle.ts` | **Мигрировано:** локальный переключатель состояний удалён | `UserTaskStatus`, `UserTaskStatusHistory`, server state machine | `PrismaOpportunityTaskRepository` | `OpportunityTaskApplicationService` | `UserTaskView` | UI содержит только presentation labels; допустимые переходы определяет сервер |
| `components/opportunities/*` | **Мигрировано:** серверный каталог, детали, принятие, draft, submit и read-only review | Opportunity/Task read models | `PrismaOpportunityTaskRepository` | `OpportunityTaskApplicationService` | JSON API list/detail/commands | Role prop больше не является источником доступа; сервер получает роль и рынок из профиля |
| `components/partner/pages/partner-materials-page.tsx` | **Мигрировано:** серверный каталог применимых промокодов и activation state | `Promocode`, `PromocodeActivation`, `PromocodeActivationHistory` | `PrismaPlatformOperationsRepository` | `PlatformOperationsService` | `PromocodeView` | Код раскрывается только владельцу после серверной проверки и активации |

## 4. Отправка и проверка результата

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| `components/opportunities/task-detail.tsx` | **Мигрировано:** показывает owned `UserTask` и закреплённые версии | `UserTask`, `UserTaskStatusHistory` | `PrismaOpportunityTaskRepository` | `OpportunityTaskApplicationService` | `UserTaskView` | История и текущее состояние приходят с сервера |
| `components/opportunities/task-lifecycle.tsx` | **Мигрировано:** draft и submit создают append-only версии | `TaskSubmission`, `SubmissionVersion` | `PrismaOpportunityTaskRepository` | `OpportunityTaskApplicationService` | `UserTaskView` после idempotent command | Клиент не может назначить статус; повторная отправка сохраняет прошлые версии |
| Решение в lifecycle | **Частично мигрировано:** реальное решение читается, но review command не входит в модуль | `SubmissionReview` | `PrismaOpportunityTaskRepository` | read path в `OpportunityTaskApplicationService` | `ReviewDecisionDTO` внутри `UserTaskView` | Создание решения остаётся будущей административной операцией |

## 5. Экономика

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| удалённый `lib/economy-data.ts` | Demo read model удалён | `VXPointsLedgerEntry`, `UserRank`, `TrustScoreSnapshot`, `VXReward`, `EconomyPolicy` | `PrismaEconomyRewardRepository` | `EconomyRewardApplicationService` | `EconomySnapshotView` | Миграция завершена: баланс, Trust, ранг и Rewards собираются сервером |
| `components/economy/*` | Серверный overview и объединённая история | ledger, rank history, trust events, rewards | `PrismaEconomyRewardRepository` | `EconomyRewardApplicationService` | `EconomySnapshotView`, `EconomyHistoryView` | Подключено; empty state показывается только при реальном отсутствии событий или конфигурации |

## 6. VX Rewards

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| удалённый `lib/reward-data.ts` | Demo-каталог и локальные состояния удалены | `RewardType`, `VXReward`, `RewardStatusHistory` | `PrismaEconomyRewardRepository` | `EconomyRewardApplicationService` | `RewardView` | Миграция завершена; тип, значение, статус и основание приходят с сервера |
| `components/rewards/*` | Реальный каталог назначенных Rewards, detail, claim и история | `VXReward`, `RewardStatusHistory` | `PrismaEconomyRewardRepository` | `EconomyRewardApplicationService` | `RewardView` | Локальный переключатель удалён; клиент может только запросить разрешённый сервером claim |

## 7. Поддержка и апелляции

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| `SupportCategory` | Серверный каталог по роли и рынку | `SupportCategory` | `PrismaSupportNotificationRepository` | `SupportNotificationApplicationService` | `SupportCategoryView` | Миграция завершена; UI получает только доступные категории |
| `lib/support-data.ts` → `supportStatuses` | Только русские presentation-labels | `SupportConversationStatus`, `SupportStatusHistory` | `PrismaSupportNotificationRepository` | `SupportNotificationApplicationService` | `SupportConversationView` | Статус и история приходят с сервера; локально остаются только подписи |
| удалённый `demoSupportTickets` | Фиктивные обращения и сообщения удалены | `SupportConversation`, `SupportMessage`, `Appeal` | `PrismaSupportNotificationRepository` | `SupportNotificationApplicationService` | list/detail DTO | Миграция завершена; demo-сообщения не переносились в БД |
| `components/support/support-new-ticket.tsx` | Реальная защищённая отправка | `SupportConversation`, `SupportMessage` | `PrismaSupportNotificationRepository` | `SupportNotificationApplicationService` | Create conversation command | Подключено с rate limit, same-origin и идемпотентностью; вложения не реализованы |
| `components/support/support-ticket-detail.tsx` | Реальная переписка и append-only история | messages, appeals, status history | `PrismaSupportNotificationRepository` | `SupportNotificationApplicationService` | Conversation detail DTO | Внутренние заметки не входят в пользовательский DTO |

## 8. Прогнозы, контент и промокоды

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| `components/partner/pages/partner-forecasts-page.tsx` | **Мигрировано:** опубликованные версии Forecast | `Forecast`, `ForecastVersion`, `ForecastAccessRule` | `PrismaPlatformOperationsRepository` | `PlatformOperationsService` | `ForecastView` | Сервер проверяет период, статус, роль, рынок, ранг и персональный доступ |
| `components/partner/pages/partner-materials-page.tsx` | **Мигрировано:** каталог и активация Promocode | `Promocode`, `PromocodeActivation`, история | `PrismaPlatformOperationsRepository` | `PlatformOperationsService` | `PromocodeView` | Защищённый код не возвращается до owned activation |
| `components/partner/pages/partner-history-page.tsx` | **Мигрировано:** объединённая серверная история | immutable события заданий, экономики, Rewards, поддержки, уведомлений и промокодов | domain repositories | `PlatformOperationsService.activity` | `ActivityEventView[]` | UI не формирует события самостоятельно |

## 9. Dashboard игрока и партнёра

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| `components/dashboard/pages/dashboard-home.tsx` | **Мигрировано:** server economy, workspace summary, Forecasts и Promocodes; статичны только навигационные описания | Opportunity, UserTask, economy, Forecast, Promocode, Notification | domain repositories | профильные services + `PlatformOperationsService` | реальные read models | Каждое число и доступность рассчитываются сервером |
| `components/partner/pages/partner-home.tsx` | **Мигрировано:** реальная статистика, рекомендуемая возможность и статус партнёра; статичны только ссылки разделов | tasks, opportunities, rewards, support, notifications, forecasts, promocodes | domain repositories | `PlatformOperationsService` | `WorkspaceSummary` | Роль и рынок берутся из подтверждённого профиля |
| `components/dashboard/pages/dashboard-profile-page.tsx` | **Мигрировано:** базовые identity/profile данные; остальные карточки остаются demo/empty | `User`, `UserProfile` | identity/profile repositories | onboarding query | `SafeProfileDTO` | Product role, market, язык и статусы read-only и приходят из server layout guard |
| `components/partner/pages/partner-profile-page.tsx` | **Мигрировано:** базовый партнёрский профиль и approval status | `UserProfile`, `PartnerProfile` | identity/profile repositories | onboarding query | `SafeProfileDTO` | `PENDING` показывается честно; прочие партнёрские данные остаются пустыми до следующих модулей |
| `components/dashboard/pages/dashboard-activity-page.tsx` | **Мигрировано:** объединённая activity projection | immutable domain events | `PrismaPlatformOperationsRepository` | `PlatformOperationsService.activity` | `ActivityEventView[]` | История содержит только серверные события с причиной и временем |
| `components/dashboard/workspace-shell.tsx` | Реальные unread/read уведомления, имя/роль и server guard | `UserProfile`, `Notification`, `NotificationStatusHistory` | profile + support/notification repositories | onboarding + notification services | `SafeProfileDTO`, `NotificationView[]` | Уведомления подключены; клиент может только отметить owned IN_APP notification прочитанным |

## 10. Admin/Manager

| Frontend source | Текущие данные | Domain entity | Repository | Service | Будущий контракт | План замены |
|---|---|---|---|---|---|---|
| `lib/admin-data.ts` → `adminSections` | Только статическая навигация и русские описания разделов | Все domain aggregates | `PrismaAdminRepository` | `AdminApplicationService` | `AdminSectionView`, `AdminRecordView` | **Мигрировано:** списки, детали, поиск и фильтры используют серверные записи |
| `components/admin/admin-overview.tsx` | Реальная агрегированная статистика | users, tasks, support, economy, rewards | `PrismaAdminRepository.dashboard` | `AdminApplicationService.dashboard` | `AdminDashboardView` | **Мигрировано:** показатели рассчитываются сервером на момент запроса |
| `components/admin/admin-command-form.tsx` | Защищённые операционные формы | versioned content, reviews, support, economy, notifications | domain + admin repositories | единый admin command service | `AdminCommand` | **Мигрировано:** frontend передаёт намерение и основание; RBAC, state machine и аудит остаются серверными |
| `/admin/team`, `/admin/audit` | Реальные роли, permissions и неизменяемые события | `Role`, `Permission`, `AuditEvent` | `PrismaAdminRepository` | `AdminApplicationService` | admin list/detail DTO | **Мигрировано:** демонстрационные матрица и audit preview удалены |

## 11. Временные frontend-типы, которые будут заменены

| Текущий тип | Канонический аналог |
|---|---|
| `AccessScenario` | `ProductRole` |
| `AccessCountry` | `MarketCode` |
| `AccessLanguage` | `LanguageCode` |
| `OpportunityRole`, `EconomyRole` | server-derived `ProductRole` |
| `OpportunityMarket` | `MarketCode` и `Market` |
| Удалённые `Opportunity`, `TaskDefinition` из `lib/opportunity-data.ts` | **Заменены:** `OpportunityView`, `TaskVersionView` |
| Удалённый `TaskLifecycleStatus` | **Заменён:** `UserTaskView["status"]` из серверного DTO |
| `RankName` | `RankCode` + локализованное название `RankDefinition` |
| `EconomySnapshot` | `EconomySnapshotDTO` |
| `RewardStatus`, `RewardTypeId` | серверные Reward enum/type records |
| `SupportTicket`, `SupportMessage`, `SupportStatus` | conversation/message DTO без внутренних заметок |
| `AdminEntity`, `AdminSection` | server-driven admin projections с permission filtering |

Presentation-типы не удаляются до подключения соответствующей серверной проекции.

## 12. Порядок безопасной замены

1. Подключить session guard и получить `ProfileDTO` без изменения визуального shell.
2. Перевести onboarding на versioned consent и серверное подтверждение профиля.
3. Подключить read-only возможности и инструкции с server-derived ролью и рынком.
4. Подключить принятие задания и зафиксированную `TaskVersion`.
5. Подключить версии отправки и append-only решения проверки.
6. Подключить Points ledger, Rank events и Trust events как отдельные read models.
7. Подключить VX Rewards и статусную историю.
8. Подключить поддержку, исключив internal notes из пользовательского DTO.
9. Подключить прогнозы и промокоды с object-level authorization.
10. Подключить Admin/Manager по permission matrix и audit.
11. После parity, rollback-плана и проверки старых ключей удалить соответствующие demo/localStorage-источники.

## 13. Запрещённые миграционные сокращения

- нельзя копировать роль или рынок из localStorage в server session без проверки;
- нельзя превращать demo id в production id;
- нельзя seed-ить фиктивные сообщения, достижения, начисления, суммы или проверки;
- нельзя суммировать Points, деньги, Trust и Rewards в общий баланс;
- нельзя перезаписывать принятую версию задания новой редакцией;
- нельзя возвращать internal support notes в пользовательском контракте;
- нельзя использовать route `/partner` или `/dashboard` как доказательство роли;
- нельзя удалять старый источник до проверки rollback и согласованности read model.

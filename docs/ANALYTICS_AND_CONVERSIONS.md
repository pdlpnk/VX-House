# Аналитика и конверсии VX House

## Назначение

Этот документ описывает первую версию first-party аналитики VX House и серверную интеграцию с Keitaro. Система измеряет путь от первого визита до первого подтверждённого открытия кабинета, не использует fingerprinting и не подключает сторонние клиентские пиксели.

Текущая воронка:

`landing_viewed → access_clicked → registration_started → email_confirmed → dashboard_opened`

Keitaro не является источником истины. Полная история сначала фиксируется в базе VX House, а выбранные конверсии доставляются наружу через transactional outbox.

## Архитектура

Система разделена на четыре слоя:

1. Клиентский сбор фиксирует только разрешённые публичные события и минимальные metadata.
2. Серверный analytics API валидирует origin, размер, частоту, событие и metadata, назначает серверное время и создаёт анонимную сессию.
3. Серверные процессы регистрации, подтверждения почты и доступа к кабинету связывают события с реальным пользователем и создают критические события внутри транзакций.
4. Outbox независимо доставляет только разрешённые конверсии в Keitaro с timeout, retry и идемпотентным `tid`.

Основные сущности:

- `AnalyticsSession` — first-touch attribution, анонимный идентификатор и поздняя связь с `User`;
- `AnalyticsEvent` — неизменяемое внутреннее событие с серверным временем и уникальным ключом идемпотентности;
- `ConversionDelivery` — состояние внешней доставки, число попыток, безопасная причина ошибки и стабильный transaction ID.

`AnalyticsEvent` защищён существующим database trigger для append-only истории. Внешний HTTP-запрос никогда не выполняется внутри транзакции приложения.

## События первой версии

| Событие | Точный момент создания | Источник | Keitaro |
|---|---|---|---|
| `landing_viewed` | Первый подтверждённый просмотр публичной страницы в аналитической сессии | Клиент через allowlist API | Нет |
| `access_clicked` | Нажатие основной кнопки получения доступа | Клиент через allowlist API | Нет |
| `registration_started` | Первый выбор роли; если клиентское событие потерялось — гарантированно при серверном создании аккаунта | Клиент + серверный fallback | `lead` |
| `email_confirmed` | Только после успешной проверки одноразового кода в серверной транзакции | Сервер | `sale` |
| `dashboard_opened` | После гидратации успешно отданного кабинета; отдельный endpoint повторно проверяет активную auth session | Сервер, вызванный загруженным интерфейсом | Только при настроенном пользовательском статусе |

Для `access_clicked` разрешены placement:

- `header`;
- `hero`;
- `process`;
- `final_cta`;
- `mobile_navigation`.

Клиент не может отправить `email_confirmed` или `dashboard_opened`, передать `userId`, произвольное имя события или произвольные metadata.

## Attribution и first-touch

Поддерживаемые входные параметры:

- `subid`;
- `clickid` как безопасный alias;
- `utm_source`;
- `utm_medium`;
- `utm_campaign`;
- `utm_content`;
- `utm_term`;
- `referrer`;
- `landing_path`.

Кампания должна вести на адрес вида:

`https://vxhouse.online/?subid={subid}`

При первом валидном событии сервер создаёт `AnalyticsSession`. Значение `subid` допускает только латинские буквы, цифры и символы `._~-`, длина — до 255 символов. `landing_path` хранится без query string, у referrer удаляется query string. First-touch после создания не перезаписывается.

После регистрации анонимная сессия связывается с `User` в той же транзакции, что и аккаунт. После подтверждения почты связь остаётся постоянной. Пароли, коды подтверждения, приватные cookie и секреты провайдеров в аналитические metadata не попадают.

## Cookie

| Среда | Имя | Назначение | TTL | Атрибуты |
|---|---|---|---|---|
| Production | `__Host-vx_attribution` | First-party связь визита, регистрации и аккаунта | 90 дней | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` |
| Development/Test | `vx_attribution` | То же назначение без требования HTTPS | 90 дней | `HttpOnly`, `SameSite=Lax`, `Path=/` |

Cookie относится к строго необходимой first-party attribution текущего пути получения доступа. Поведенческие third-party pixels отсутствуют. Полноценное юридическое основание, срок хранения и consent-механизм должны быть утверждены в Legal-модуле до расширения поведенческой аналитики.

## Дедупликация

- `landing_viewed`: один раз на `AnalyticsSession`;
- `registration_started`: один раз на `AnalyticsSession`, либо один серверный fallback на `User`, если cookie отсутствовала;
- `email_confirmed`: один раз на `User`;
- `dashboard_opened`: один раз на auth session;
- `access_clicked`: отдельное осмысленное нажатие, идентифицированное клиентским UUID;
- Keitaro: уникальная пара `eventId + provider` и стабильный уникальный `tid`.

Refresh не создаёт новую анонимную сессию при наличии cookie. Повторный submit регистрации, повторная серверная команда, повторный worker-run и повторное открытие разделов одной auth session не создают дубликат конверсии.

Prefetch не гидратирует tracker и не создаёт `dashboard_opened`; endpoint дополнительно отклоняет prefetch, preview-ботов, crawler/spider и health-check.

## Transactional outbox и повторная доставка

Для разрешённой Keitaro-конверсии запись `ConversionDelivery` создаётся в той же database transaction, что и внутреннее событие. После commit доставка выполняется отдельно.

Состояния доставки:

- `PENDING` — ожидает первой попытки;
- `PROCESSING` — временно захвачена worker-процессом;
- `RETRY` — предыдущая попытка не удалась;
- `DELIVERED` — провайдер ответил успешным HTTP-статусом;
- `SKIPPED` — обязательная attribution отсутствует;
- `EXHAUSTED` — исчерпано число попыток.

Retry использует экспоненциальную задержку от 30 секунд с верхней границей один час. Зависшая `PROCESSING` запись автоматически возвращается в обработку после lease-периода. Одновременные worker-процессы используют conditional claim и не доставляют одну запись параллельно.

Встроенный best-effort запуск после пользовательского действия уменьшает задержку, но не заменяет production scheduler. Для гарантированной фоновой доставки следует регулярно запускать:

`pnpm analytics:deliver`

Рекомендуемый production-интервал — одна минута. Недоступность Keitaro не блокирует регистрацию, подтверждение email или вход в кабинет и не показывается пользователю.

## Настройка Keitaro

Обязательные настройки:

1. Передавать visitor click ID в VX House как `subid`, например `?subid={subid}`.
2. Настроить приём postback-параметров `subid`, `status` и `tid`.
3. Сопоставить `lead` с началом регистрации.
4. Сопоставить `sale` с подтверждённым email.
5. Не задавать payout, cost или currency: текущие события не имеют денежной ценности.
6. Для `dashboard_opened` сначала создать и проверить пользовательский статус, например `activated`, затем передать его имя через environment. Без этого параметра событие остаётся только внутренним.

Безопасный пример postback, не содержащий реального ключа:

`https://tracker.example/postback-key/postback?subid=example-click&status=sale&tid=vx-email-confirmed-event-id`

Секретный базовый URL хранится только на сервере. Клиент не может выбрать или изменить endpoint.

## Environment variables

| Переменная | Назначение | Default |
|---|---|---|
| `KEITARO_ENABLED` | Полностью включает или отключает создание и доставку Keitaro-конверсий | `false` |
| `KEITARO_POSTBACK_URL` | Секретный server-side endpoint Keitaro | отсутствует |
| `KEITARO_REQUEST_TIMEOUT_MS` | Timeout одного HTTP-запроса | `5000` |
| `KEITARO_MAX_RETRIES` | Максимум попыток доставки | `5` |
| `KEITARO_DASHBOARD_STATUS` | Предварительно настроенный статус для `dashboard_opened` | отсутствует |

В production endpoint обязан быть публичным HTTPS URL без credentials в URL. Localhost и приватные IPv4-диапазоны отклоняются конфигурацией. Значение URL нельзя писать в Git, логи, HTML, API responses или snapshots.

## Воронка администратора

Администратору доступен небольшой блок за последние 30 дней и защищённый endpoint:

`GET /api/admin/analytics?from={ISO_DATE}&to={ISO_DATE}`

Максимальный период — 366 дней. Endpoint требует инфраструктурную роль администратора.

Показатели:

- уникальные посетители — уникальные аналитические сессии с `landing_viewed`;
- нажатия получения доступа;
- начатые регистрации;
- подтверждённые email;
- пользователи, впервые открывшие Dashboard в auth session.

Формулы:

- access click rate = `access_clicked / landing_viewed`;
- registration start rate = `registration_started / access_clicked`;
- email confirmation rate = `email_confirmed / registration_started`;
- dashboard activation rate = `dashboard_opened / email_confirmed`.

При нулевом знаменателе значение равно 0. Аккаунты с доменами тестовой среды и маркированные smoke-адреса исключаются из отчёта; все события связанной с ними аналитической сессии также исключаются.

## Безопасность и приватность

- analytics API защищён проверкой same-origin, лимитом payload 8 КБ и durable rate limit;
- сервер принимает только allowlist событий и полей metadata;
- server timestamp является источником истины;
- `userId` никогда не принимается из клиентской аналитики;
- postback URL берётся только из server environment;
- timeout и retry ограничены конфигурацией;
- ошибки сохраняются только как безопасные категории без body, query string и subid;
- полный IP не сохраняется аналитикой;
- fingerprinting и скрытые hardware identifiers не используются;
- сторонние client-side trackers не установлены.

Будущая политика удаления аккаунта должна либо удалить `AnalyticsSession.userId` и `AnalyticsEvent.userId`, либо необратимо анонимизировать связь согласно утверждённому сроку хранения. Append-only бизнес-историю нельзя нарушать прямым редактированием; операция должна быть отдельной контролируемой процедурой с аудитом.

## Future events: первое задание

В текущем этапе события задания не создаются и в Keitaro не отправляются. Зарезервирован следующий ряд:

- `first_task_started`;
- `first_task_submitted`;
- `first_task_verified`;
- `first_task_rejected`.

Правила будущего `first_task_verified`:

- создаётся только после серверного решения администратора;
- клиент не может подтвердить выполнение;
- содержит ссылки на `taskId`, `userId` и `verificationId`;
- повторное одобрение того же verification не создаёт новый postback;
- отказ не считается успешной конверсией;
- повторная проверка сохраняет append-only историю;
- payout пока не используется;
- Keitaro mapping добавляется отдельно после настройки статуса;
- доставка использует существующий `ConversionDelivery`, а не новый механизм.

Пример расширения: доменный сервис проверки создаёт `AnalyticsEvent` с ключом `analytics:first_task_verified:{verificationId}` в своей transaction, добавляет outbox-запись со стабильным `tid`, а worker доставляет её после commit. Реальный endpoint и ключ в код не добавляются.

## Эксплуатационные ограничения

- В первой версии first-touch хранится, last-touch отдельно не ведётся.
- `dashboard_opened` может быть отправлен в Keitaro только после явной настройки пользовательского статуса.
- Scheduler/cron для `pnpm analytics:deliver` должен быть добавлен в production deployment отдельно; ручной worker уже доступен.
- Блок администратора является агрегированным обзором, а не полноценной BI-системой.
- Cookie Banner и формальная Privacy Policy не входят в этот этап.
- До production deployment необходимо применить миграцию, добавить environment variables и согласовать статусы Keitaro.

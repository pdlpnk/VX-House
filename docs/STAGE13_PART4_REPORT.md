# Отчёт по Этапу 13, часть 4 — production security и operations foundation

## Результат

Подготовлен изолированный production-фундамент безопасности и эксплуатации: persistent rate limiting, brute-force protection, fail-closed secrets configuration, health checks, operational metrics, backup/recovery contracts и контролируемое шифрование чувствительных данных.

Инфраструктура не подключена к существующим маршрутам. Landing, onboarding, Dashboard, Admin и остальные frontend-файлы не изменялись.

## Что реализовано

### Rate limiting foundation

Создан универсальный `RateLimitService` с настраиваемыми namespace, лимитом и окном. Он пригоден для будущих API, server actions, authentication и административных операций.

Ключи ограничения:

- никогда не сохраняются в исходном виде;
- разделяются namespace;
- преобразуются в HMAC-SHA-256 отдельным серверным секретом;
- хранятся только как необратимые отпечатки.

Состояние хранится в PostgreSQL, а не в памяти процесса. `PrismaRateLimitRepository` использует единый атомарный `INSERT ... ON CONFLICT ... DO UPDATE`, поэтому несколько экземпляров приложения не принимают решение по независимым локальным счётчикам.

Подготовлены операции:

- consume;
- inspect;
- reset;
- ограниченная очистка истёкших buckets.

Очистка не запускается автоматически: реальный maintenance job в этой части не создавался.

### Brute-force protection foundation

Подготовлен отдельный `BruteForceProtectionService` для authentication flow. Он использует два независимых ограничения:

- по нормализованному identifier;
- по сетевому ключу.

Исходные email, телефон, IP или device identifier не сохраняются в rate-limit таблице. Механизм поддерживает:

- предварительную оценку блокировки;
- регистрацию неуспешной попытки;
- сброс identifier bucket после подтверждённого успешного входа;
- единый `retryAfterSeconds`.

Стартовые значения в `.env.example` являются только начальной infrastructure-конфигурацией и должны быть проверены владельцем безопасности перед production. Существующий login к механизму не подключался.

### Production secrets management

Добавлены:

- `SecretValue`, который не раскрывает значение через `toString` или JSON serialization;
- общий `SecretProvider` для последующей замены environment provider на managed secret store;
- отдельные секреты для session HMAC, rate-limit HMAC и data encryption;
- обязательный key id для защищённых данных;
- проверка длины, формата и разделения ключей по назначению.

Production-конфигурация работает fail-closed и отклоняет:

- placeholders;
- одинаковые секреты разных назначений;
- локальные key ids;
- локальный PostgreSQL;
- PostgreSQL URL без обязательного TLS `sslmode`;
- некорректный AES-256 key;
- опасные диапазоны security-параметров.

Секреты не добавлены в репозиторий. `.env.example` содержит только намеренно непроизводственные placeholders.

### Security configuration layer

Все параметры безопасности объединены в `SecurityConfig`:

- authentication sessions;
- rate limiting;
- brute-force protection;
- data protection;
- monitoring timeouts.

Существующая authentication composition переведена на этот слой. Разрозненного чтения секретов в auth-сервисах нет.

### Monitoring foundation

Добавлен расширяемый `HealthCheckRegistry` с:

- отдельными видами `liveness`, `readiness`, `diagnostic`;
- критическими и некритическими проверками;
- индивидуальным измерением времени;
- общим timeout;
- состояниями `healthy`, `degraded`, `unhealthy`;
- результатами без stack trace, секретов и внутренних ошибок.

Подготовлены базовые проверки:

- liveness проверяет только жизнеспособность процесса и не зависит от БД;
- readiness проверяет доступность обязательного PostgreSQL через минимальный запрос.

HTTP endpoints для health checks не создавались.

### Server diagnostics

`ServerDiagnostics` выдаёт только безопасный минимальный snapshot:

- имя приложения;
- тип окружения;
- server timestamp;
- uptime.

ENV, connection strings, ключи, токены, файловые пути и данные пользователей не выдаются.

### Structured operational metrics

Подготовлена единая модель:

- counter;
- gauge;
- histogram;
- типизированные labels;
- pluggable `MetricSink`;
- безопасный `NoopMetricSink` по умолчанию.

Имена, значения и labels валидируются. Запрещены типичные labels с PII, identifiers, session и token data. Реальный OpenTelemetry, Prometheus или внешний monitoring provider не подключался.

### Backup и recovery foundation

Созданы только контракты, необходимые для будущего production-процесса:

- backup manifest;
- encrypted backup artifact;
- checksum SHA-256;
- schema version;
- backup provider;
- verifier;
- recovery provider;
- обязательное восстановление в изолированную среду;
- результат проверки восстановления;
- валидируемая policy с RPO, RTO и retention.

Конкретные значения RPO, RTO и retention не выдумывались. Их должен утвердить владелец инфраструктуры. Backup job, storage adapter и реальное восстановление не реализовывались и не запускались.

### Data protection foundation

Добавлена защита чувствительных данных через стандартный Web Crypto API:

- AES-256-GCM;
- уникальный 96-bit IV для каждого шифрования;
- 128-bit authentication tag;
- versioned payload;
- key id;
- обязательный additional authenticated data context;
- классификация `internal`, `confidential`, `restricted`.

Контекст связывает ciphertext с purpose, resource type, resource id и classification. Подмена контекста приводит к ошибке аутентификации ciphertext.

`ProtectedDataService` требует успешное решение серверной authorization policy перед расшифровкой. Бизнес-поля и реальные данные к шифрованию не подключались.

### Prisma

Добавлена только инфраструктурная модель `RateLimitBucket` и индекс истечения. Создана отдельная миграция. Миграция не применялась к реальной базе.

## Архитектурные решения

1. **Persistent counters вместо process memory.** Решения остаются согласованными между экземплярами приложения.
2. **HMAC pseudonymization.** Rate limiting не требует хранения исходных идентификаторов.
3. **Atomic database decision.** Проверка и увеличение счётчика не разделены между запросами.
4. **Fail-closed production config.** Production не запускается с placeholders, повторно используемыми ключами или небезопасной БД.
5. **Разделение секретов по назначению.** Компрометация одного ключа не должна автоматически раскрывать все контуры.
6. **Liveness отдельно от readiness.** Временная недоступность БД не должна автоматически объявлять процесс мёртвым.
7. **Provider interfaces.** Metrics, secrets и backup можно подключить к выбранной production-платформе без переписывания сервисов.
8. **Authenticated encryption.** AES-GCM защищает конфиденциальность и целостность, а AAD связывает данные с серверным контекстом.
9. **Authorization before decrypt.** Возможность расшифровать данные не заменяет проверку прав.
10. **No-op by default for external operations.** Метрики и backup не имитируют подключённые production-сервисы.

## Проверки

- Prisma schema format — успешно;
- Prisma schema validate — успешно;
- Prisma Client generation — успешно;
- unsafe production config rejection — успешно;
- AES-GCM encrypt/decrypt и AAD mismatch — успешно;
- health foundation smoke test — успешно;
- lint — успешно;
- typecheck — успешно;
- production build — успешно.

Frontend-файлы и существующие страницы не изменялись.

## Что остаётся до полного завершения Этапа 13

- интеграция rate limiting и brute-force protection в реальные endpoints;
- trusted proxy policy для получения сетевого идентификатора;
- progressive delays, уведомления и security-event integration для попыток входа;
- managed secrets provider и проверенная процедура rotation/revocation;
- keyring для плавной ротации data encryption keys;
- подключение внешнего metrics/monitoring provider;
- реальные, защищённые health endpoints и infrastructure probe configuration;
- alert rules, SLO, availability targets и incident routing;
- production backup provider, отдельное защищённое хранилище и расписание;
- утверждённые RPO, RTO, retention и ownership;
- регулярный автоматизированный restore test;
- шифрование конкретных согласованных полей после data classification;
- политика хранения и удаления чувствительных данных;
- audit и monitoring доступа к секретам и расшифровке;
- threat modeling, dependency review и penetration testing;
- регламенты инцидентов, утечек и disaster recovery.

## Что сознательно не реализовано

- реальные API;
- подключение к существующим маршрутам;
- реальные backup jobs или restore;
- внешний monitoring service;
- frontend и новые страницы;
- бизнес-модели и бизнес-логика VX House;
- задания;
- VX Rewards;
- экономика;
- поддержка;
- применение миграций к реальной базе.

Работа остановлена после четвёртой части Этапа 13. Следующая часть не начиналась.

# Identity, authentication и onboarding VX House

## Назначение

Этот документ фиксирует рабочий сквозной сценарий получения доступа. Сервер является единственным источником истины для пользователя, сессии, роли, рынка, подтверждения контакта, согласий и этапа onboarding. URL и состояние интерфейса не дают прав доступа.

## Регистрация

Пользователь проходит существующую композицию `/access`: знакомство → продуктовая роль → объяснение пространства → рынок и язык → имя, email и пароль. До отправки формы роль, рынок и язык могут временно сохраняться в локальном черновике. Имя, email и пароль в localStorage не записываются.

`POST /api/auth/register` нормализует email, проверяет входные данные, активный рынок, язык и продуктовую роль, хеширует пароль PBKDF2-SHA-256 и в одной serializable-транзакции создаёт `User`, `UserProfile`, единственный ролевой подтип, `OnboardingProgress`, email challenge, серверную `Session`, audit и security events. `PLAYER` получает только `PlayerProfile`; `PARTNER` — только `PartnerProfile` со статусом `PENDING`. Повтор команды защищён durable idempotency key. Ответ на конфликт email не раскрывает, существует ли адрес.

## Вход и сессия

- `POST /api/auth/login` — вход по email и паролю с brute-force protection и security events.
- `POST /api/auth/logout` — отзыв текущей сессии и очистка HttpOnly cookie.
- `POST /api/auth/refresh` — ротация session token с сохранением абсолютного срока.
- `GET /api/auth/me` — безопасный профиль и серверный этап onboarding.
- `GET /api/profile` — `ProfileDTO` без password hash, токена и внутренних данных.

Сессионный токен хранится только в `HttpOnly`, `SameSite=Lax` cookie; в production используется `Secure` и `__Host-` cookie. В БД хранится только HMAC digest токена. Logout делает старый токен недействительным.

## Подтверждение email

Сервер создаёт шестизначный криптографически случайный код. В `EmailVerificationChallenge` хранится только HMAC-SHA-256 hash, связанный с id challenge. Есть срок действия, максимум попыток, cooldown повторной отправки, rate limits, отзыв предыдущего активного challenge и одноразовое потребление. Код, пароль, cookie и session token не попадают в logger, audit или security metadata.

Команды: `POST /api/auth/email/request` и `POST /api/auth/email/verify`. В development `GET /api/auth/email/development-code` показывает код только авторизованному владельцу текущего профиля. Этот механизм возвращает 404 вне development. `DevelopmentEmailProvider` запрещён production-конфигурацией; без доступного transport отправка закрывается ошибкой и контакт не считается подтверждённым.

## Состояние onboarding

Канонические состояния: `ACCOUNT_CREATED`, `CONTACT_PENDING`, `CONTACT_VERIFIED`, `CONSENTS_PENDING`, `PROFILE_READY`, `PARTNER_APPROVAL_PENDING`, `COMPLETED`.

После регистрации сервер становится источником истины. При обновлении страницы `/access` запрашивает `/api/auth/me` и восстанавливает правильный этап: неподтверждённый контакт → код; подтверждённый контакт → согласия; завершённый профиль → итог и ролевое пространство. Клиент не может пропустить серверную проверку.

## Согласия

`GET /api/onboarding` возвращает последние опубликованные обязательные `ConsentVersion` для рынка и языка профиля. UI показывает название и номер каждой версии. `POST /api/onboarding/complete` принимает подтверждение 18+ и конкретные version id. Сервер повторно вычисляет обязательный набор, атомарно создаёт append-only `UserConsent` с actor/version/timestamp, меняет профиль и пишет audit. Boolean на клиенте не является доказательством согласия. Новая опубликованная обязательная версия делает прежнее принятие недостаточным.

## Ролевая маршрутизация и partner approval

После завершения игрок получает `ACTIVE` и `/dashboard`. Партнёр остаётся `PENDING`/`PARTNER_APPROVAL_PENDING` и попадает в честное ограниченное пространство `/partner`; это не означает ручного одобрения. Решение принимает серверный профиль.

Серверные layout guards защищают `/dashboard`, `/partner` и `/admin`: анонимный пользователь направляется на вход, незавершённый — на `/access`, пользователь другой продуктовой роли — в собственное пространство. Обычные product roles не получают `/admin`; для него требуется инфраструктурная роль `admin`. Отказ фиксируется security event.

## Безопасность доставки

Все изменяющие route handlers требуют same-origin `Origin`, ограничивают JSON body и возвращают только безопасные ошибки. Rate limits подключены к регистрации, входу, запросу/проверке кода и refresh; вход дополнительно защищён раздельными identifier/network buckets. По умолчанию proxy-заголовки не доверяются. `CF-Connecting-IP` учитывается только при явном `TRUST_PROXY_HEADERS=true` в доверенной инфраструктуре; произвольный `X-Forwarded-For` не используется.

## Production requirements

До production обязательны удалённый PostgreSQL с TLS, уникальные secrets разных назначений, production email provider вместо development transport, Secure cookies, миграции через `prisma migrate deploy`, trusted-proxy policy для конкретной платформы, мониторинг ошибок доставки и политики ротации/отзыва секретов. Development fixtures и endpoint кода в production недоступны.

Приложение генерирует Prisma client для `workerd`, соответствующий целевому runtime. Изолированные интеграционные тесты используют отдельный Node-only generated client из той же `schema.prisma`; это не вторая модель данных и не отдельный источник истины.

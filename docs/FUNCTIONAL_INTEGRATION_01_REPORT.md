# Functional Integration 01 — отчёт

## Рабочие сценарии

- Новый игрок проходит `/access`, создаёт профиль, подтверждает email, принимает текущие обязательные согласия и открывает защищённый `/dashboard`.
- Новый партнёр проходит тот же поток, получает `PARTNER_APPROVAL_PENDING` и честное ограниченное `/partner`.
- Повторный пользователь входит по email/паролю; сервер направляет его на незавершённый этап либо в пространство роли.
- Обновление страницы восстанавливает server-confirmed onboarding state. Logout отзывает текущую сессию.

## Delivery layer

Созданы route handlers: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/me`, `GET /api/profile`, `POST /api/auth/email/request`, `POST /api/auth/email/verify`, development-only `GET /api/auth/email/development-code`, `GET /api/onboarding` и `POST /api/onboarding/complete`. Команды не дублируются Server Actions.

## Данные и миграция

Добавлены `OnboardingProgress`, `EmailVerificationChallenge` и enum состояний отдельной Prisma migration. Реальными стали identity/profile, продуктовая роль, рынок, язык, contact verification, обязательные consent versions, account/partner status и маршрутизация. LocalStorage оставлен только для роли/рынка/языка до регистрации и device-level dashboard preferences; он не влияет на доступ.

## Security decisions

Использованы существующие password hashing, HttpOnly cookies, session rotation, RBAC/policies, durable rate limiting, brute-force protection, serializable transactions, idempotency, append-only audit и security events. Код хранится только как HMAC hash, ограничен по времени/попыткам/cooldown и не попадает в metadata. Из proxy-заголовков допускается только явно доверенный `CF-Connecting-IP`; `X-Forwarded-For` игнорируется. Development email transport запрещён в production.

## Проверки

- Fresh migration deploy: успешно, 6/6 migrations.
- Prisma validate/generate: успешно.
- DB, identity, consent, auth, onboarding, route decision и rate-limit integration tests: успешно, 28/28.
- Lint: успешно, без замечаний.
- Typecheck: успешно.
- Production build: успешно.
- Desktop/mobile browser smoke: успешно для регистрации игрока, восстановления этапа, завершения и защищённого кабинета; проверены клавиатурные элементы и мобильная композиция.

## Найденные и устранённые проблемы

- Дорегистрационный UI передавал только локальный mock и не создавал identity.
- Dashboard/Partner маршруты были доступны без серверной сессии и роли.
- Profile UI брал имя из localStorage и показывал фиктивное отсутствие профиля.
- Согласия были простыми boolean без версии.
- При интеграционных тестах выявлено ограничение временного окна challenge; фикстуры приведены к тем же DB constraints, которые действуют в продукте.
- В browser runtime выявлены несовместимость Node-target Prisma WASM и повторное использование соединения между isolated workerd requests. Приложение переведено на workerd client с request-local connection lifecycle, а Node integration tests получили отдельный generated client из той же схемы.
- Главные блоки кабинетов сообщали, что профиль не создан, хотя server profile уже был подтверждён. Только identity-статусы и рекомендуемое действие синхронизированы с реальным `ProfileDTO`; продуктовые demo/empty состояния не изменялись.

## Сознательно не реализовано

Не подключены Opportunities, Tasks, VX Points, Rank, Trust Score, Rewards, Support, Forecasts и admin business operations. Не добавлены социальный вход, MFA, production email vendor и решение ручного approval. Демо/empty данные этих модулей сохранены.

## Следующий функциональный модуль

Следующим отдельным модулем должна стать серверная интеграция каталога возможностей и заданий после утверждения контрактов и permissions. В рамках текущей работы она не начата.

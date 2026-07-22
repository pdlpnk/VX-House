# Локальная база данных VX House

Этот документ описывает только изолированные базы для разработки и тестов. Он не содержит и не требует production-реквизитов.

## Обязательные правила безопасности

- Никогда не используйте production URL в командах миграции, тестовых fixtures или integration tests.
- Development и test работают в разных базах и на разных loopback-портах.
- Тестовая база временная и может быть полностью очищена.
- Fixtures разрешены только для локального непродуктивного окружения и содержат исключительно синтетические данные.
- `.env` не коммитится. В репозитории хранится только безопасный пример конфигурации.
- Схема изменяется через Prisma migrations. `prisma db push` для командной разработки не используется.

## Предпочтительный вариант: Docker Compose

Требуется Docker с поддержкой Compose.

Development PostgreSQL:

```bash
pnpm db:dev:up
```

Подключение:

```text
postgresql://vx_house_dev:vx_house_dev_only@127.0.0.1:55432/vx_house_dev
```

Test PostgreSQL:

```bash
pnpm db:test:up
```

Подключение:

```text
postgresql://vx_house_test:vx_house_test_only@127.0.0.1:55433/vx_house_test
```

Пароли выше намеренно являются локальными и непригодны для production. Оба сервиса доступны только через `127.0.0.1`.

Остановка:

```bash
pnpm db:test:down
pnpm db:dev:down
```

Development хранит данные в именованном Docker volume. Test использует `tmpfs` и не предназначен для постоянного хранения.

## Применение миграций

После запуска development-базы:

```bash
DATABASE_URL='postgresql://vx_house_dev:vx_house_dev_only@127.0.0.1:55432/vx_house_dev' \
DIRECT_URL='postgresql://vx_house_dev:vx_house_dev_only@127.0.0.1:55432/vx_house_dev' \
pnpm prisma migrate deploy
```

Для проверки всегда применяйте полный каталог `prisma/migrations` к чистой test-базе. Не отмечайте миграцию выполненной вручную и не используйте `migrate resolve`, пока причина ошибки не исследована.

## Автоматический изолированный прогон

```bash
pnpm test:database
```

Команда:

1. запускает временный локальный Prisma PostgreSQL в stateless-режиме;
2. применяет все миграции через `prisma migrate deploy`;
3. выполняет `prisma validate` и `prisma generate`;
4. запускает SQL integration tests ограничений и service integration tests;
5. гарантированно останавливает временную базу.

Этот режим удобен для CI и машин без Docker. Для финальной проверки перед выпуском предпочтителен PostgreSQL 17 из `compose.database.yaml`.

## Development fixtures

После применения миграций можно явно запустить:

```bash
NODE_ENV=development \
DATABASE_URL='postgresql://vx_house_dev:vx_house_dev_only@127.0.0.1:55432/vx_house_dev' \
pnpm db:fixtures:identity
```

Fixtures создают только:

- активные рынки Турции и Азербайджана;
- языковые версии RU, TR и AZ;
- синтетического пользователя с доменом `.invalid`;
- синтетические версии обязательных документов согласия.

Скрипт имеет явную защиту от production и удалённых хостов. Он не запускается автоматически.

## Восстановление тестового окружения

Если миграция или тест завершились ошибкой:

1. остановите test-контейнер;
2. снова запустите `postgres-test` — его данные временные;
3. примените миграции с нуля;
4. повторите `pnpm test:database`.

Development volume не удаляется автоматически. Его удаление допустимо только осознанно, когда локальные данные больше не нужны.

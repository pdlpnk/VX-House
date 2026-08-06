# VX House: production на Ubuntu 24.04

Основной production-сценарий рассчитан на репозиторий `/opt/VX-House`, локальный PostgreSQL, standalone-сборку Vinext/Next.js под PM2 на `127.0.0.1:3000` и Nginx с TLS для `https://vxhouse.online`. Docker Compose остаётся альтернативным способом запуска.

## Схема

```text
Internet → HTTPS Nginx → HTTP 127.0.0.1:3000 → PM2 / standalone Node.js
                                                ↓
                              PostgreSQL 127.0.0.1:5432
```

Порты `3000` и `5432` не должны быть доступны из интернета. В firewall открываются только `22`, `80` и `443`.

## 1. Переменные окружения

```bash
cd /opt/VX-House
cp .env.example .env
chmod 600 .env
```

Создайте все секреты независимо и замените placeholders. Для нативного PostgreSQL на том же Droplet используйте:

```dotenv
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://vxhouse.online
TRUST_PROXY_HEADERS=true
DATABASE_URL=postgresql://vx_house:<url-encoded-password>@127.0.0.1:5432/vx_house?sslmode=disable
DIRECT_URL=postgresql://vx_house:<url-encoded-password>@127.0.0.1:5432/vx_house?sslmode=disable

EMAIL_PROVIDER=resend
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@vxhouse.online
EMAIL_REQUEST_TIMEOUT_MS=8000
```

`EMAIL_FROM` должен принадлежать подтверждённому в Resend домену. Никогда не сохраняйте `.env`, API-ключи, коды подтверждения или пароли в Git и не печатайте их в логи. `NEXT_PUBLIC_SITE_URL` — единственный публичный origin без завершающего `/`; wildcard-origin запрещён.

`TRUST_PROXY_HEADERS=true` безопасен только потому, что приложение слушает loopback и трафик приходит через контролируемый Nginx. При прямом публичном доступе к Node этот параметр необходимо выключить.

Локальный PostgreSQL на loopback допускает `sslmode=disable`, поскольку соединение не покидает хост. Для удалённой БД production-валидатор требует `sslmode=require`, `verify-ca` или `verify-full`.

## 2. Установка, миграции и сборка

Требуется Node.js не ниже версии из `package.json` и pnpm указанной там же.

```bash
cd /opt/VX-House
pnpm install --frozen-lockfile
set -a
source .env
set +a
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate deploy
CONFIRM_PRODUCTION_BOOTSTRAP=VX_HOUSE_REFERENCE_DATA pnpm db:bootstrap:production
pnpm build
test -f dist/standalone/dist/server/assets/query_compiler_fast_bg.js
test -f dist/standalone/dist/server/assets/query_compiler_fast_bg.wasm
```

Миграции выполняются до перезапуска приложения. При ошибке миграции остановите deploy: не запускайте новую сборку поверх несовместимой схемы.

## 3. PM2

Запускайте скомпилированный standalone-сервер, а не dev server:

```bash
cd /opt/VX-House
set -a
source .env
set +a
HOSTNAME=127.0.0.1 PORT=3000 pm2 start dist/standalone/server.js --name vx-house --cwd /opt/VX-House --update-env
pm2 save
pm2 startup systemd
```

Выполните команду с `sudo`, которую напечатает `pm2 startup`, затем снова `pm2 save`.

Проверка процесса и логов:

```bash
pm2 status vx-house
pm2 logs vx-house --lines 200
curl --fail --silent http://127.0.0.1:3000/api/health
```

Health endpoint возвращает HTTP `200` и `status: healthy`, когда приложение и БД готовы; при проблеме readiness возвращается `503`.

## 4. Nginx

Файл `/etc/nginx/sites-available/vx-house`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name vxhouse.online www.vxhouse.online;

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://vxhouse.online$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.vxhouse.online;

    ssl_certificate /etc/letsencrypt/live/vxhouse.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vxhouse.online/privkey.pem;

    return 301 https://vxhouse.online$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vxhouse.online;

    ssl_certificate /etc/letsencrypt/live/vxhouse.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vxhouse.online/privkey.pem;
    client_max_body_size 12m;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "DENY" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Сертификат `/etc/letsencrypt/live/vxhouse.online/` должен покрывать оба имени: `vxhouse.online` и `www.vxhouse.online`.

```bash
sudo ln -s /etc/nginx/sites-available/vx-house /etc/nginx/sites-enabled/vx-house
sudo nginx -t
sudo systemctl reload nginx
```

Проверка Origin обязательно зависит от `Host`, `X-Forwarded-Proto` и `X-Forwarded-Host`. Nginx должен перезаписывать эти заголовки, а не принимать их как доверенные от внешнего клиента.

## 5. Проверка регистрации

Проверяйте именно публичный HTTPS-домен:

1. Откройте `https://vxhouse.online/access` в приватном окне.
2. Создайте новый аккаунт с уникальным email.
3. Убедитесь, что `POST /api/auth/register` возвращает `201`, а не `403`/`503`.
4. Получите письмо от `EMAIL_FROM`, введите код и завершите onboarding.
5. Проверьте вход, обновление страницы, выход и повторный вход.
6. Повторите сценарий для игрока и партнёра.

Безопасная диагностика (не копируйте в тикеты строки окружения или заголовок Authorization):

```bash
pm2 logs vx-house --lines 300
sudo tail -n 300 /var/log/nginx/error.log
sudo tail -n 300 /var/log/nginx/access.log
curl --fail --silent https://vxhouse.online/api/health
```

Сбой Resend не активирует профиль и не создаёт частично заполненную регистрацию: аккаунт остаётся в `CONTACT_PENDING`, после cooldown пользователь может запросить новый код. Повтор регистрации защищён ключом идемпотентности.

## 6. Обновление

```bash
cd /opt/VX-House
git pull --ff-only
pnpm install --frozen-lockfile
set -a
source .env
set +a
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate deploy
CONFIRM_PRODUCTION_BOOTSTRAP=VX_HOUSE_REFERENCE_DATA pnpm db:bootstrap:production
pnpm build
test -f dist/standalone/dist/server/assets/query_compiler_fast_bg.js
test -f dist/standalone/dist/server/assets/query_compiler_fast_bg.wasm
pm2 restart vx-house --update-env
curl --fail --silent http://127.0.0.1:3000/api/health
curl --fail --silent https://vxhouse.online/api/health
```

Перед изменяющими схему миграциями создайте проверенный внешний backup PostgreSQL.

## 7. Rollback

1. Зафиксируйте hash текущего и предыдущего релиза.
2. Верните рабочее дерево к заранее проверенному release commit.
3. Выполните `pnpm install --frozen-lockfile`, `pnpm build` и `pm2 restart vx-house --update-env`.
4. Проверьте оба health URL и публичную регистрацию.

Prisma migrations автоматически назад не откатываются. При несовместимой миграции используйте заранее проверенный backup либо отдельно проверенную forward-repair migration; не редактируйте production migration history вручную.

## 8. Доставка аналитических конверсий

`ConversionDelivery` обрабатывается one-shot worker-процессом. Не запускайте его как бесконечный PM2-процесс. Версионируемые systemd units находятся в `deploy/systemd/`.

Перед установкой проверьте путь `command -v pnpm`. Если он отличается от `/usr/bin/pnpm`, замените только `ExecStart` в установленной копии service-файла на фактический абсолютный путь.

```bash
sudo install -m 0644 deploy/systemd/vx-house-analytics-delivery.service /etc/systemd/system/
sudo install -m 0644 deploy/systemd/vx-house-analytics-delivery.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vx-house-analytics-delivery.timer
```

Проверка, перезапуск и журналы:

```bash
systemctl status vx-house-analytics-delivery.timer
systemctl list-timers vx-house-analytics-delivery.timer
sudo systemctl restart vx-house-analytics-delivery.service
journalctl -u vx-house-analytics-delivery.service --since "1 hour ago" --no-pager
```

Ручной безопасный запуск использует production environment из защищённого файла:

```bash
cd /opt/VX-House
set -a
source .env
set +a
pnpm analytics:deliver
```

Отключение расписания без удаления данных outbox:

```bash
sudo systemctl disable --now vx-house-analytics-delivery.timer
```

Systemd не запускает второй экземпляр уже активного unit, а `flock` дополнительно предотвращает параллельную обработку. Worker не выводит postback URL, ключ, `subid` или query string в журнал.

## 9. Docker Compose как альтернатива

`docker-compose.yml` запускает TLS-enabled PostgreSQL, one-shot `prisma migrate deploy` и standalone-приложение с healthcheck/restart policy. Compose сам переопределяет database URL на внутренний сервис `postgres`:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs --tail=200 app migrate postgres
```

Не запускайте одновременно PM2 и Compose на одном `127.0.0.1:3000`. Не выполняйте `docker compose down --volumes`, если данные должны сохраниться.

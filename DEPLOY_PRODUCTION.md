# VX House: production deployment on Ubuntu 24.04

This guide deploys VX House from `/opt/VX-House` on a single DigitalOcean Droplet. Nginx terminates HTTPS on the host and proxies requests to the application bound only to `127.0.0.1:3000`. PostgreSQL is reachable only inside the private Docker network.

## Production topology

```text
Internet
  |
  |  HTTPS :443
  v
Nginx on Ubuntu
  |
  |  HTTP 127.0.0.1:3000
  v
VX House container
  |
  |  TLS PostgreSQL :5432 (private Docker network)
  v
PostgreSQL container
```

The deployment provides:

- a multi-stage Node.js production image;
- automatic `prisma migrate deploy` in a one-shot migration container before the application starts;
- TLS between the application and the bundled PostgreSQL service;
- container and application healthchecks;
- restart policies and bounded Docker logs;
- persistent PostgreSQL, PostgreSQL TLS, and uploads volumes;
- an internal backend network that is not published to the host;
- a loopback-only application port for Nginx.

## 1. Prepare the environment

```bash
cd /opt/VX-House
cp .env.example .env
chmod 600 .env
```

Generate independent values for all secrets. Do not reuse any output:

```bash
openssl rand -hex 32
openssl rand -hex 48
openssl rand -hex 48
openssl rand -hex 48
openssl rand -base64 32 | tr '/+' '_-' | tr -d '='
```

Use the first value as `POSTGRES_PASSWORD`, the next three as `SESSION_SECRET`, `RATE_LIMIT_SECRET`, and `EMAIL_VERIFICATION_SECRET`, and the last value as `DATA_PROTECTION_KEY`.

Update both database URLs with the same PostgreSQL password:

```dotenv
POSTGRES_PASSWORD=<generated-url-safe-password>
DATABASE_URL=postgresql://vx_house:<generated-url-safe-password>@postgres:5432/vx_house?sslmode=require
DIRECT_URL=postgresql://vx_house:<generated-url-safe-password>@postgres:5432/vx_house?sslmode=require
```

Also replace `NEXT_PUBLIC_SITE_URL` with the final HTTPS origin. Do not add a trailing slash. It is passed both at build time and runtime, so a domain change requires rebuilding the application image.

Important security rules:

- Keep `.env` outside Git and readable only by the deployment user.
- Keep `DATA_PROTECTION_KEY` and `DATA_PROTECTION_KEY_ID` stable. Existing encrypted messages and attachments depend on them.
- A future key rotation must be implemented as a controlled migration; replacing the key directly makes protected data unreadable.
- `EMAIL_PROVIDER=disabled` is required by the current production environment contract. A real email provider must be implemented separately before enabling email delivery.

## 2. Validate and start

Validate Compose interpolation before building:

```bash
docker compose config --quiet
```

Build and start the stack:

```bash
docker compose up -d --build
```

Startup order is enforced:

1. PostgreSQL starts and becomes healthy.
2. The one-shot `migrate` service runs `prisma migrate deploy`.
3. The standalone production server starts only after successful migrations.
4. Docker marks the application healthy only when `/api/health` confirms database readiness.

Check status and logs:

```bash
docker compose ps
docker compose logs --tail=100 migrate
docker compose logs --tail=200 app
docker compose logs --tail=100 postgres
curl --fail --silent http://127.0.0.1:3000/api/health
```

Expected health response has `"status":"healthy"` and HTTP status `200`. A database readiness failure returns HTTP `503`.

## 3. Configure Nginx

The Compose stack publishes no PostgreSQL port. The application is exposed only as `127.0.0.1:${APP_PORT:-3000}`. Nginx must run on the Droplet host, not inside this Compose project.

Create `/etc/nginx/sites-available/vx-house`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://example.com$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

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

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Replace `example.com`, then enable and validate the site:

```bash
sudo ln -s /etc/nginx/sites-available/vx-house /etc/nginx/sites-enabled/vx-house
sudo nginx -t
sudo systemctl reload nginx
```

Issue the TLS certificate with the existing certificate-management policy, for example Certbot, before enabling the HTTPS server block. Open only TCP ports `22`, `80`, and `443` in the DigitalOcean firewall. Do not expose ports `3000` or `5432` publicly.

`TRUST_PROXY_HEADERS=true` is intentional because Nginx is the trusted ingress. Keep the application bound to loopback; otherwise forwarded client headers could be spoofed by direct callers.

## Application prerequisite: transactional email

The current server configuration supports only `development` and `disabled` email transports, and correctly rejects the development transport when `NODE_ENV=production`. This deployment therefore uses `EMAIL_PROVIDER=disabled` so the application can start securely without exposing development verification codes.

Before opening self-service registration to public users, a real transactional email provider must be implemented in the application and added to its validated provider list. That work is intentionally outside this infrastructure-only deployment change.

## 4. Persistent data

Named volumes:

- `postgres_data` — all PostgreSQL data;
- `postgres_tls` — the self-signed certificate used only on the private Docker network;
- `uploads_data` — reserved filesystem storage at `/app/uploads`.

Current messenger attachments are encrypted and stored in PostgreSQL, so they are protected by `postgres_data`. The uploads volume is provisioned for filesystem-backed uploads without requiring a future infrastructure change.

Never run `docker compose down --volumes` in production unless permanent data deletion is intended.

## 5. Database backup and recovery

Create an encrypted off-Droplet backup policy before accepting production users. A basic logical backup can be created with:

```bash
mkdir -p /opt/backups/vx-house
docker compose exec -T postgres pg_dump \
  --username vx_house \
  --dbname vx_house \
  --format=custom > "/opt/backups/vx-house/vx-house-$(date +%F-%H%M%S).dump"
```

Replace the database identifiers if `POSTGRES_USER` or `POSTGRES_DB` differs from the example. Do not store unencrypted backups on the same Droplet as the only copy.

Test restoration on a separate database and deployment before relying on a backup. Restoring production data must use the same data-protection key that encrypted the stored protected fields.

## 6. Deploy updates

```bash
cd /opt/VX-House
git pull --ff-only
docker compose build --pull app migrate postgres
docker compose up -d
docker compose ps
curl --fail --silent http://127.0.0.1:3000/api/health
```

Prisma migrations are forward-only and run automatically. Take a database backup before deploying a release that contains migrations.

Inspect recent logs after every deployment:

```bash
docker compose logs --since=10m app postgres
```

## 7. Rollback expectations

Application rollback:

1. Check out the previously deployed Git revision.
2. Rebuild the application image.
3. Run `docker compose up -d`.

Database migrations are not automatically rolled back. If a release contains an incompatible migration, restore a verified pre-deployment backup or apply a separately reviewed forward repair migration. Never manually edit Prisma migration history in production.

## 8. Operational checklist

- DNS points to the Droplet.
- Nginx configuration passes `nginx -t`.
- A valid HTTPS certificate is installed and renews automatically.
- `.env` contains no placeholders and has mode `0600`.
- PostgreSQL is not published on a host port.
- The application listens only on `127.0.0.1:3000`.
- `docker compose ps` reports both services healthy.
- `/api/health` returns HTTP `200` locally and through HTTPS.
- Registration, login, logout, and protected routes are smoke-tested through the public domain.
- Backups are encrypted, copied off the Droplet, and restoration has been tested.
- DigitalOcean monitoring and disk-space alerts are enabled.

# Hostinger Deployment

This project can run on Hostinger PHP/MySQL hosting without a Node server. Build React locally, upload static assets, and run PHP through Apache.

## Preferred Layout

Use this layout when your Hostinger plan lets you upload files outside `public_html`:

```text
domains/example.com/
  backend/                  # private API source, outside document root
    .env
    config/
    controllers/
    core/
    database/
    helpers/
    middleware/
    models/
    public/
    routes/
    services/
    storage/
  public_html/
    .htaccess
    index.html
    assets/
    api/index.php           # thin bridge to ../backend/public/index.php
```

Copy `deployment/hostinger/public_html/api/index.php` to `public_html/api/index.php`.

## Shared-Hosting Fallback Layout

If Hostinger only allows deployment inside `public_html`, upload the repo layout directly and keep the root `.htaccess`. It blocks backend internals and exposes only `/api/*`.

```text
public_html/
  .htaccess
  backend/
  frontend/dist/
```

## Build Frontend

```bash
cd frontend
npm ci
VITE_API_BASE_URL=/api npm run build
```

Upload the contents of `frontend/dist/` to `public_html/` for the preferred layout, or upload `frontend/dist/` itself for the fallback layout.

## Database

1. Create a MySQL database and user in hPanel.
2. Import `database/officegate_production.sql` through phpMyAdmin.
3. Put the final database credentials in `backend/.env`.

## Environment

Create `backend/.env` from `backend/.env.production.example`.

Required production values:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com
CORS_ALLOWED_ORIGINS=https://example.com
TRUSTED_PROXIES=

DB_DRIVER=mysql
DB_HOST=<hostinger mysql host>
DB_PORT=3306
DB_DATABASE=<database>
DB_USERNAME=<user>
DB_PASSWORD=<password>

JWT_ACCESS_SECRET=<64+ random chars>
JWT_REFRESH_SECRET=<different 64+ random chars>

OTP_DRIVER=webhook
OTP_WEBHOOK_URL=<sms provider webhook url>
OTP_WEBHOOK_TOKEN=<provider token>
```

## Seed

If SSH is available:

```bash
cd domains/example.com/backend
php scripts/seed.php
```

Production seed requires strong `SEED_*_PASSWORD` values and all four `SEED_GATE_*_TOKEN` values in `backend/.env`. It confirms gate tokens are configured but does not print production secrets.

To create gate QR links, open the admin QR page, paste the matching gate token into the token field, then copy/print the generated QR. The token is stored in the URL fragment as `#gateToken=...`, so it is not sent to the web server as part of the page request and is moved into browser session storage by the scan page.

## Backup And Restore

```bash
cd backend
php scripts/backup_mysql.php
php scripts/restore_mysql.php storage/backups/officegate-YYYYMMDD-HHMMSS.sql --confirm-production-restore
```

Keep backups outside `public_html` and download them from hPanel/SSH.

## Go-Live Checks

```text
https://example.com
https://example.com/api/health
```

Run the endpoint/security suite only on local development or an isolated staging database because it creates records and changes the seeded admin password during validation:

```bash
php backend/tests/endpoint_security_test.php http://127.0.0.1:8010
php backend/tests/endpoint_security_test.php https://staging.example.com/api --allow-live
```

Only mark production live after HTTPS, MySQL, OTP delivery, QR entry/checkout, admin login, and security dashboard flows are verified.

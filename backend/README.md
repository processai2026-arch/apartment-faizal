# OfficeGate Backend

Secure custom PHP MVC-style API for the BRILEY ONE / OfficeGate building management app.

## Local Run

```bash
cd backend
cp .env.example .env
composer install
php scripts/migrate.php
php scripts/seed.php
php -S localhost:8000 -t public
```

For production, change both JWT secrets after copying `.env.example`; the checked-in values are only for local development.

## Production Setup

Use MySQL/MariaDB for production:

```bash
mysql -u root -p -e "CREATE DATABASE officegate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p officegate < ../database/officegate_production.sql
cp .env.production.example .env
```

Then replace every `REPLACE_...` value in `.env`, set the final `APP_URL` and `CORS_ALLOWED_ORIGINS`, and serve `backend/public` as the web root.

If the whole repository is deployed as the Apache web root, use the root `.htaccess`; it exposes the API under `/api/*`, blocks source/storage folders, and serves the built React app from `frontend/dist`.

Health check:

```bash
curl http://localhost:8000/health
```

Local seed users use the passwords from `.env`. In production, `scripts/seed.php` refuses default passwords and requires explicit `SEED_GATE_*_TOKEN` values.

## Architecture

- `public/index.php`: front controller
- `routes/api.php`: API route table
- `config/`: environment and database config
- `core/`: request, response, router, database, bootstrap
- `middleware/`: auth, roles, rate limiting, security headers
- `controllers/`: auth, profile, dashboard, scan flows, admin APIs
- `models/`: database models and query helpers
- `services/`: auth tokens, audit log, OTP, uploads, reporting
- `database/migrations/`: schema
- `database/seeds/`: development seed data
- `tests/`: endpoint suite plus PHPUnit scaffolding

Composer is optional for Hostinger runtime, but `composer.json` is present for PSR-4/classmap metadata, local dev tooling, and CI.

## Tests

```bash
find . -name '*.php' -not -path './vendor/*' -exec php -l {} +
php tests/endpoint_security_test.php http://127.0.0.1:8000
composer test
```

The endpoint suite is the primary integration/security regression check. PHPUnit covers focused helper/unit behavior when dev dependencies are installed.

## Backup And Restore

Production MySQL backups:

```bash
php scripts/backup_mysql.php
php scripts/restore_mysql.php storage/backups/officegate-YYYYMMDD-HHMMSS.sql
```

Production restore additionally requires `--confirm-production-restore`. Keep generated backups outside the public web root whenever the hosting plan allows it.

## Security Defaults

- JSON API responses only
- CORS allow-list
- strict security headers
- body size limits
- parameterized PDO queries
- `password_hash` / `password_verify`
- short-lived access JWT and rotating refresh tokens
- refresh token hashes stored server-side
- logout revokes refresh sessions
- role middleware for `admin`, `security`, and `tenant`
- file-backed rate limiting for auth and scan endpoints
- audit log table for sensitive mutations
- public scan endpoints require a gate token seeded in `gate_tokens`; frontend scan pages receive it through a URL fragment and send it only as the `X-Gate-Token` header

Before production, replace every secret in `.env`, set `APP_ENV=production`, disable `APP_DEBUG`, use MySQL, and put `storage/` outside the public web root.

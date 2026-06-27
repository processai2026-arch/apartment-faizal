# OfficeGate Backend

Secure custom PHP MVC-style API for the BRILEY ONE / OfficeGate building management app.

## Local Run

```bash
cd backend
cp .env.example .env
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

Default seed users use the passwords from `.env`.

## Architecture

- `public/index.php`: front controller
- `config/`: environment and database config
- `core/`: request, response, router, database, bootstrap
- `middleware/`: auth, roles, rate limiting, security headers
- `controllers/`: auth, profile, dashboard, scan flows, admin APIs
- `models/`: database models and query helpers
- `services/`: auth tokens, audit log, OTP, uploads, reporting
- `database/migrations/`: schema
- `database/seeds/`: development seed data

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
- public scan endpoints require a gate token seeded in `gate_tokens`

Before production, replace every secret in `.env`, set `APP_ENV=production`, disable `APP_DEBUG`, use MySQL, and put `storage/` outside the public web root.

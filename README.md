# OfficeGate — Apartment Management System

## Overview

Full-stack office/apartment management platform built with PHP 8.2 (backend) and React + TypeScript + Vite (frontend). Designed for commercial office buildings, it provides role-based portals for administrators, security personnel, and tenants.

## Features (Prompts 1–28)

| # | Feature | Module |
|---|---------|--------|
| 1 | Visitor Entry & Management | Admin + Security |
| 2 | Vehicle Registry & Checkout | Admin + Security |
| 3 | Office/Unit Management | Admin |
| 4 | Vendor & Service Provider Management | Admin |
| 5 | Staff Attendance Tracking | Admin + Security |
| 6 | Inventory & Audit | Admin |
| 7 | Utility Task Management | Admin |
| 8 | Financial Tracking & Invoicing | Admin |
| 9 | Rental Marketplace (Tenant listings) | Admin + Tenant |
| 10 | Rental Favorites & Admin Dashboard | Admin + Tenant |
| 11 | Local Business Ads | Admin + Tenant |
| 12 | Announcements | Admin + Tenant |
| 13 | Emergency Contacts | Admin + Tenant + Security |
| 14 | Daily Workers & Attendance | Admin + Security |
| 15 | Secretary Portal (Permission management) | Admin |
| 16 | WhatsApp Share Hub | Admin |
| 17 | Smart QR Visitor Passes | Admin + Security |
| 18 | Community Analytics Dashboard | Admin |
| 19 | Community Events (Register/RSVP) | Admin + Tenant |
| 20 | Resident Service Hub | Tenant |
| 21 | CCTV Foundation (Camera management) | Admin + Security |
| 22 | Premium Membership & Subscriptions | Admin + Tenant |
| 23 | Ad Billing & Analytics | Admin |
| 24 | Razorpay Payment Integration | Admin |
| 25 | Complaints Management | Admin + Tenant |
| 26 | Maintenance Request Tickets | Admin + Tenant |
| 27 | Documentation & Testing | Dev |
| 28 | Notifications (Admin/Security/Tenant) | All roles |

## Tech Stack

- **Backend:** PHP 8.2, SQLite (dev) / MySQL 8.0+ (prod), JWT Auth, PDO
- **Frontend:** React 18, TypeScript 5, Vite 8, TailwindCSS 3, shadcn/ui (Radix UI), Zustand
- **Payments:** Razorpay
- **Charts:** Chart.js, Recharts
- **Other:** react-hook-form, Zod, react-router-dom v6, @tanstack/react-query, lucide-react

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — update DB settings, JWT secrets, seed passwords
composer install        # optional for dev; required for phpunit
php scripts/migrate.php
php scripts/seed.php
php -S 0.0.0.0:8010 public/index.php
```

Health check:
```bash
curl http://localhost:8010/health
```

### Frontend

```bash
cd frontend
npm install
# Create .env.local:
echo "VITE_API_BASE_URL=http://127.0.0.1:8010" > .env.local
npm run dev
```

Open http://localhost:5173 in your browser.

## Default Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@officegate.com | ChangeMe@12345 |
| Security | security@officegate.com | ChangeMe@12345 |
| Tenant | tenant@officegate.com | ChangeMe@12345 |

Change all passwords before production deployment.

## Environment Variables

Full list from `backend/.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | OfficeGate API | Application name |
| `APP_ENV` | local | `local` or `production` |
| `APP_DEBUG` | true | Enable debug error output |
| `APP_URL` | http://localhost:8000 | Canonical API URL |
| `APP_TIMEZONE` | Asia/Kolkata | PHP timezone |
| `CORS_ALLOWED_ORIGINS` | http://localhost:8080,http://localhost:5173 | Comma-separated frontend origins |
| `TRUSTED_PROXIES` | (empty) | Comma-separated proxy IPs |
| `JWT_ACCESS_SECRET` | (must change) | Access token signing secret (min 32 bytes) |
| `JWT_REFRESH_SECRET` | (must change) | Refresh token signing secret (min 32 bytes) |
| `JWT_ACCESS_TTL_SECONDS` | 900 | Access token lifetime (15 min) |
| `JWT_REFRESH_TTL_SECONDS` | 1209600 | Refresh token lifetime (14 days) |
| `DB_DRIVER` | sqlite | `sqlite` or `mysql` |
| `DB_DATABASE` | storage/database.sqlite | SQLite path or MySQL DB name |
| `DB_HOST` | 127.0.0.1 | MySQL host |
| `DB_PORT` | 3306 | MySQL port |
| `DB_USERNAME` | — | MySQL username |
| `DB_PASSWORD` | — | MySQL password |
| `SEED_ADMIN_EMAIL` | admin@officegate.com | Seeded admin email |
| `SEED_ADMIN_PASSWORD` | ChangeMe@12345 | Seeded admin password |
| `SEED_SECURITY_EMAIL` | security@officegate.com | Seeded security email |
| `SEED_SECURITY_PASSWORD` | ChangeMe@12345 | Seeded security password |
| `SEED_TENANT_EMAIL` | tenant@officegate.com | Seeded tenant email |
| `SEED_TENANT_PASSWORD` | ChangeMe@12345 | Seeded tenant password |
| `OTP_DRIVER` | log | `log` (file) or `webhook` |
| `OTP_TTL_SECONDS` | 300 | OTP validity (5 min) |
| `OTP_WEBHOOK_URL` | (empty) | Webhook URL for OTP delivery |
| `OTP_WEBHOOK_TOKEN` | (empty) | Bearer token for OTP webhook |
| `RAZORPAY_KEY_ID` | rzp_test_xxx | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | — | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | — | Razorpay Webhook Secret |
| `RAZORPAY_MODE` | test | `test` or `live` |

## Roles

| Role | Access |
|------|--------|
| **admin** | Full access to all admin routes, dashboard, reports, analytics, and all management features |
| **security** | Visitor entry/checkout, vehicle entry/checkout, staff attendance, daily workers, CCTV cameras, emergency contacts, security dashboard |
| **tenant** | Community features — complaints, maintenance requests, vendor marketplace, rental marketplace, business ads, announcements, events, subscription, service hub |

## Architecture

```
apartment-faizal/
├── backend/                 PHP 8.2 MVC-style API
│   ├── public/              Web root (index.php front controller)
│   ├── routes/api.php       All API route definitions
│   ├── config/              app.php, database.php
│   ├── core/                Router, Request, Response, Database, bootstrap
│   ├── middleware/          AuthMiddleware, RoleMiddleware, RateLimitMiddleware, GateTokenMiddleware
│   ├── controllers/         One controller per module/role
│   ├── models/              CrudModel base + one model per entity
│   ├── helpers/             Validator, JWT, AppException
│   ├── services/            Auth tokens, OTP, Upload, Audit, Reporting
│   ├── database/
│   │   ├── migrations/      001-021 SQL migration files
│   │   └── seeds/           Development seed data
│   ├── scripts/             migrate.php, seed.php, backup_mysql.php
│   ├── tests/               PHPUnit unit tests + endpoint security suite
│   └── storage/             SQLite DB, logs, backups, uploads
│
├── frontend/                React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── pages/           One TSX file per page/feature
│   │   ├── components/      Shared UI components (layout, auth, features)
│   │   ├── stores/          Zustand state stores
│   │   ├── lib/             api.ts, whatsapp.ts, imageUtils.ts, utils.ts
│   │   └── types/           TypeScript interfaces (index.ts, auth.ts)
│   └── public/
│
├── database/                Production MySQL export
├── deployment/              Server config templates
└── docs/                    Additional documentation
```

## Running Tests

```bash
# PHP syntax check (all files):
cd backend && find . -name '*.php' -not -path './vendor/*' -exec php -l {} +

# PHPUnit unit tests:
cd backend && composer test

# Endpoint security/integration suite (requires a running server):
cd backend && php tests/endpoint_security_test.php http://127.0.0.1:8010
```

## Further Documentation

- [API Reference](backend/docs/API.md)
- [Database Schema](backend/docs/DATABASE.md)
- [Deployment Guide](backend/docs/DEPLOYMENT.md)
- [Developer Guide](backend/docs/DEVELOPER_GUIDE.md)
- [Developer Notes](DEVELOPER_NOTES.md)

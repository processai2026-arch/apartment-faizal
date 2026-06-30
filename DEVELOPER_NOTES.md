# OfficeGate — Developer Notes

## What was built (Prompts 15–28)

### P15 — Secretary Portal
Admin can register secretary users, assign granular module-level permissions (view/create/update/delete per module), and view their own permission set. Routes: `/admin/secretaries/*`, `/secretary/dashboard`, `/secretary/permissions`. Migration: `014_secretary_permissions.sql`.

### P16 — WhatsApp Share Hub
Frontend-only feature. `frontend/src/lib/whatsapp.ts` provides typed payload factories (`visitorInvitePayload`, `announcementPayload`, `invoiceReminderPayload`, etc.) that build `wa.me` share URLs without any external API calls. The `WhatsAppHub` page provides a UI for composing and sharing messages. No backend changes.

### P17 — Smart QR Visitor Passes
Pre-authorized visitor passes with QR codes. Tenants/security can create passes with a validity window; the pass generates a unique `pass_code`; scanning at the gate validates and logs entry. Routes: `/admin/visitor-passes/*`. Migration: `015_visitor_passes.sql`.

### P18 — Community Analytics Dashboard
Nine analytics endpoints grouped under `/admin/analytics/*` covering occupancy, complaints, maintenance, vendors, rentals, visitors, revenue, daily workers, and a combined summary. All endpoints aggregate from existing tables — no new schema. Frontend: `CommunityAnalytics.tsx` with Chart.js charts.

### P19 — Community Events
Full event lifecycle: Draft → Published → Completed/Cancelled. Tenant registration/cancellation. Registration count tracking with optional capacity limit. Routes: `/admin/events/*`, `/tenant/events/*`. Migration: `016_community_events.sql`.

### P20 — Resident Service Hub
Frontend-only hub page (`ResidentServiceHub.tsx`) that serves as a landing dashboard for tenants, aggregating links to complaints, maintenance, marketplace, rentals, and announcements. No new API endpoints.

### P21 — CCTV Foundation
Camera registry with heartbeat/status tracking, event logging (motion/intrusion/tamper), snapshot metadata storage, and a timeline view. Architecture-only: no real RTSP stream processing. Routes: `/admin/cameras/*`. Migration: `017_cctv.sql`.

### P22 — Premium Membership / Subscriptions
Subscription plan management (Basic/Standard/Premium tiers), per-office subscriptions with billing cycles, and a premium feature flag registry. Tenant upgrade/cancel flow is a placeholder — payment integration is not wired for subscriptions yet. Routes: `/admin/subscription-plans/*`, `/admin/subscriptions/*`, `/tenant/subscription/*`. Migration: `018_premium_membership.sql`.

### P23 — Ad Billing & Analytics
Ad package management, billing record creation/payment tracking, impression/click analytics, renewal reminder flow, and CSV/JSON export. Extends the business ads module. Routes: `/admin/ad-packages/*`, `/admin/business-ads/billing/*`, `/admin/business-ads/analytics`. Migration: `019_ad_billing.sql`.

### P24 — Razorpay Payment Integration
Razorpay order creation, payment verification (HMAC signature), webhook handler (event-driven status updates), retry and refund flows for invoices. Routes: `/admin/invoices/{id}/payment-order`, `/admin/invoices/{id}/verify-payment`, `/payments/webhook`, etc. Migration: `020_razorpay_payments.sql`.

### P25 — Complaints Management
Full complaint lifecycle from tenant submission through admin assignment, status updates, and history audit trail. Roles: tenant submits, admin manages. Routes: `/tenant/complaints/*`, `/admin/complaints/*`. Migration: `005_complaints.sql`.

### P26 — Maintenance Request Tickets
Similar lifecycle to complaints, with the addition of staff assignment alongside vendor assignment. Routes: `/tenant/maintenance-requests/*`, `/admin/maintenance-requests/*`. Migration: `007_maintenance_requests.sql`.

### P27 — Documentation & Testing (this prompt)
- Created `/README.md` (project root)
- Created `backend/docs/API.md`, `DATABASE.md`, `DEPLOYMENT.md`, `DEVELOPER_GUIDE.md`
- Created `backend/tests/Unit/ValidatorTest.php`, `CrudModelTest.php`
- Created `backend/tests/Feature/AuthTest.php`, `VisitorTest.php`, `RoleTest.php`
- Fixed duplicate `EmergencyContact` and `DailyWorker` interface definitions in `frontend/src/types/index.ts`
- Updated `backend/phpunit.xml` to include the Feature test suite

### P28 — Notifications
Per-role notification system (admin, security, tenant). Admin can create broadcast notifications targeting roles or individual users. Each role has list/mark-read/mark-all-read endpoints. Routes: `/admin/notifications/*`, `/security/notifications/*`, `/tenant/notifications/*`. Migration: `006_notifications.sql`.

---

## File Count Summary

| Category | Count |
|----------|-------|
| SQL migration files | 21 (001–021) |
| PHP controller files | ~40 |
| PHP model files | ~35 |
| PHP helper/core/service files | ~15 |
| React page files (.tsx) | ~55 |
| React component files (.tsx) | ~30 |
| TypeScript stores (.ts) | ~5 |
| TypeScript lib files (.ts) | ~5 |
| PHPUnit test files | 5 (2 Unit + 3 Feature) |
| Documentation files (.md) | 6 |

---

## Known Limitations

### Razorpay
- Razorpay keys default to test mode placeholder values in `.env.example`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` must be set in `.env` before payments work
- The Razorpay JS SDK (`window.Razorpay`) is loaded dynamically — requires internet access in the browser
- Refund flow calls the Razorpay API but the actual refund amount is hardcoded to the full invoice amount

### CCTV
- The CCTV module is architecture-only: cameras are registered and status is tracked via heartbeat
- No real RTSP/RTMP stream processing or HLS transcoding is implemented
- `rtsp_url` is stored but never actually connected to
- Snapshot creation stores metadata only — no actual image capture

### Premium Subscriptions
- The tenant upgrade flow (`POST /tenant/subscription/upgrade`) creates a subscription record but does not collect payment
- Subscription enforcement (e.g., blocking features for unpaid tenants) is not implemented in middleware
- No automated expiry/renewal processing

### WhatsApp
- Uses `wa.me` share links only — no WhatsApp Business API, no actual message sending
- Opening the link requires the user to have WhatsApp installed
- Phone numbers must be in international format (e.g., `+91...`) for links to work correctly

### OTP
- In development (`OTP_DRIVER=log`), OTP codes are written to `storage/logs/otp.log` — not sent to the user's phone
- Production SMS delivery requires setting `OTP_DRIVER=webhook` and configuring a compatible SMS gateway
- There is no built-in integration with Twilio/MSG91/etc. — any webhook-compatible SMS provider works

### SQLite vs MySQL
- The SQLite schema uses `INTEGER PRIMARY KEY AUTOINCREMENT`; MySQL uses `INT AUTO_INCREMENT`
- The production dump at `database/officegate_production.sql` uses MySQL syntax
- Some TEXT column constraints (e.g., `CHECK(role IN (...))`) are enforced by SQLite but may behave differently on older MySQL versions

### Frontend
- No test framework (vitest/jest) is installed; there are no frontend unit tests
- The app uses `localStorage` for JWT storage; this is intentional for a desktop/kiosk scenario but is not suitable for high-security deployments

---

## Breaking Change Checklist (Prompts 15–28)

All 14 prompts (P15–P28) are purely additive:

- No existing tables were modified (only new tables added via migrations 014–021)
- No existing API endpoints were removed or renamed
- No existing TypeScript interfaces were changed structurally (two legacy duplicates were removed in P27)
- No existing middleware or routing logic was altered
- The `phpunit.xml` change (adding Feature test suite) is backward-compatible — existing unit tests still run

---

## Running Everything Locally

```bash
# Terminal 1 — Backend
cd backend
composer install
php scripts/migrate.php
php scripts/seed.php
php -S 127.0.0.1:8010 public/index.php

# Terminal 2 — Frontend
cd frontend
npm install
echo "VITE_API_BASE_URL=http://127.0.0.1:8010" > .env.local
npm run dev

# Terminal 3 — Tests
cd backend
composer test                                           # PHPUnit unit tests
php tests/endpoint_security_test.php http://127.0.0.1:8010   # integration tests
```

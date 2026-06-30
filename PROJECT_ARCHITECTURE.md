# PROJECT ARCHITECTURE — OfficeGate

> Secure office-building / apartment gate-management system.
> Product name in code: **OfficeGate**. Domain branding: "BRILEY ONE" building, "M2K" tenant.
> Generated: 2026-06-30. Source of truth: this repository (not the older `docs/REQUIREMENTS.md`, which is partly stale).

---

## 1. Folder Structure

```
apartment-faizal/
├── backend/                      PHP 8.2 REST API (no framework, custom micro-router)
│   ├── config/                   app.php, database.php
│   ├── controllers/
│   │   ├── admin/                Admin* controllers (Dashboard, Finance, Inventory,
│   │   │                         Office, Report, Staff, User, Utility, Vehicle,
│   │   │                         Vendor, Visitor) + ResourceController base
│   │   ├── AuthController.php     login / otp / refresh / logout / me / change-password
│   │   ├── HealthController.php
│   │   ├── PublicScanController.php   gate-token scan endpoints
│   │   ├── SecurityController.php     security dashboard
│   │   ├── TenantController.php       tenant dashboard
│   │   ├── UiSettingsController.php   per-user UI prefs
│   │   └── UploadController.php       file uploads
│   ├── core/                     bootstrap, Database (PDO), Request, Response,
│   │                             Router, AppException
│   ├── database/migrations/      001_core, 002_operations, 003_business,
│   │                             004_public_checkout_tokens  (SQL files)
│   ├── helpers/                  JWT.php (HS256 hand-rolled), Validator.php
│   ├── middleware/               AuthMiddleware, RoleMiddleware, RateLimitMiddleware,
│   │                             GateTokenMiddleware
│   ├── models/                   CrudModel base + per-entity models
│   ├── routes/api.php            single route table (all endpoints)
│   ├── services/                 AuthService, AuditService, OtpService, FileStore,
│   │                             RateLimiter
│   ├── scripts/                  migrate.php, seed.php, backup/restore_mysql.php
│   ├── storage/                  database.sqlite (dev), logs, uploads, rate-limit,
│   │                             backups
│   ├── public/index.php          front controller
│   └── tests/                    PHPUnit + endpoint_security_test.php
│
├── frontend/                     Vite + React 18 + TypeScript + Tailwind + shadcn/ui
│   └── src/
│       ├── components/
│       │   ├── auth/             ProtectedRoute (+ PublicRoute)
│       │   ├── features/         DataTable, KpiCard, StatCard, StatusBadge,
│       │   │                     SearchInput, TableToolbar, EmptyState,
│       │   │                     DraggableCard, UICustomizer
│       │   ├── layout/           Header, Sidebar, Layout
│       │   └── ui/               ~50 shadcn/ui primitives
│       ├── pages/                ~30 route pages (admin, auth, scan, tenant, security)
│       ├── stores/               Zustand: useAppStore, useAuthStore, useUISettingsStore
│       ├── lib/                  api.ts (typed client), gateToken.ts, utils.ts,
│       │                         visitorFaceDetection.ts
│       ├── hooks/                use-mobile, use-toast, useScanSync
│       ├── data/mockData.ts      ⚠ still imported by several live pages/stores
│       └── types/                index.ts, auth.ts, uiSettings.ts
│
├── database/                     officegate_production.sql (MySQL prod schema dump)
├── deployment/hostinger/         prod public_html + api front controller
├── docs/                         openapi.yaml, deployment, security reviews, REQUIREMENTS
├── apartments-demo.kynetropo.com/  built deploy target (frontend dist + backend copy)
└── .deploy.sh                    Hostinger deploy script
```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend language | PHP 8.2 (`>=8.2`), no framework — custom Router/Request/Response |
| Backend deps | PDO, ext-json, ext-fileinfo; PHPUnit 10.5 (dev) |
| DB (dev) | SQLite (`backend/storage/database.sqlite`) |
| DB (prod) | MySQL (`database/officegate_production.sql`) |
| Auth | Hand-rolled JWT (HS256) access + refresh tokens, OTP challenges |
| Frontend | React 18.3, TypeScript 5.5, Vite 8 (SWC plugin) |
| Styling | Tailwind 3.4 + shadcn/ui (Radix primitives) + tailwindcss-animate |
| State | Zustand 5 (app + auth + UI settings); TanStack Query present but barely used |
| Routing | react-router-dom 6 |
| Forms/validation | react-hook-form + zod + @hookform/resolvers |
| Charts | recharts + chart.js |
| QR | qrcode, qrcode.react |
| Face detection | @vladmandic/face-api (+ tiny_face_detector model in public/) |
| Misc heavy deps (⚠ likely unused) | three / @react-three/*, leaflet, @supabase/supabase-js, @reduxjs/toolkit + react-redux, @stripe/*, @google/generative-ai, hls.js |

---

## 3. Frontend Architecture

- **Entry:** `main.tsx` → `App.tsx`. `App` wires QueryClientProvider, Tooltip/Toaster providers, BrowserRouter, and an `AppDataBootstrap` component.
- **Bootstrap flow:** `AppDataBootstrap` calls `hydrateSession()` on mount; when authenticated and not yet loaded, calls `loadInitialData()` which fetches offices/visitors/vehicles/vendors/staff/inventory/utilities in parallel via `api.*.list()`.
- **Code-splitting:** every page except `Login` is `React.lazy` + `Suspense` (`RouteFallback` spinner).
- **Route guarding:** `ProtectedRoute` (role-gated) and `PublicRoute`. Role-based redirect via `DashboardRedirect`.
- **Layouts:** admin & tenant use `<Layout>` (sidebar + header). Security dashboard and `/scan/*` pages are standalone (no sidebar).

## 4. Backend Architecture

- **Front controller:** `public/index.php` → `core/bootstrap.php` loads config/env, sets up `Database`, instantiates `Router`, includes `routes/api.php`, dispatches.
- **Routing:** `Router` maps `METHOD path` → `[Controller::class, 'method']` with an ordered middleware list (string form e.g. `RoleMiddleware:admin,security`, `RateLimitMiddleware:10,300`, `GateTokenMiddleware:visitor-entry`).
- **Controllers → Models:** controllers validate via `Validator`, call models (mostly `CrudModel` subclasses) and return through `Response` (standard envelope). Cross-cutting logic lives in `services/` (Auth, Audit, Otp, FileStore, RateLimiter).
- **Response envelope:** `{ success, message, data, meta?, errors? }`. Frontend `request()` unwraps `.data`.

## 5. Authentication Flow

1. **Password login:** `POST /auth/login` → `AuthService::login` verifies `password_hash`, checks `status='active'`, issues access+refresh JWT. Refresh token hash stored in `refresh_tokens` with IP/UA.
2. **OTP login:** `POST /auth/otp/send` then `/auth/otp/verify` (purpose `login`) → issues tokens. ⚠ Frontend `EntryVisitors.tsx` still uses a hardcoded `MOCK_OTP = '123456'` for the *visitor* entry OTP gate (separate from auth OTP).
3. **Refresh:** `POST /auth/refresh` rotates token inside a DB transaction (revoke old, verify not expired, re-issue). Frontend `request()` auto-retries once on 401.
4. **Token storage (frontend):** `localStorage` keys `officegate.accessToken` / `officegate.refreshToken` via `tokenStorage`. Auth user is also persisted by Zustand `persist` under `auth-storage`.
5. **Logout:** revokes refresh token(s) server-side; clears local storage.
6. **Gate tokens (public scan):** `GateTokenMiddleware` validates `X-Gate-Token` against `gate_tokens` per scope. Public visitors/vehicles get a one-time `public_checkout_token` (migration 004).

## 6. Database Schema (all tables)

See **DATABASE_ANALYSIS.md** for full column/relationship detail. Tables:
`users`, `refresh_tokens`, `otp_challenges`, `audit_logs` (001_core);
`offices`, `visitors`, `visitor_movements`, `vehicles`, `vehicle_movements`, `staff`, `staff_attendance`, `vendors` (002_operations);
`inventory_items`, `inventory_movements`, `utility_tasks`, `invoices`, `payments`, `gate_tokens`, `ui_settings`, `attachments`, `idempotency_keys` (003_business);
+ public checkout token columns on `visitors`/`vehicles` (004).

## 7. API Endpoints

Full table in **API behavior** below and routes in `backend/routes/api.php`. Grouped: auth, ui-settings, uploads, admin/* (dashboard, offices, users, visitors, vehicles, vendors, staff, inventory, utilities, invoices, financials, reports), security/dashboard, tenant/dashboard, public/scan/*.

## 8. Existing Modules

Dashboard, Manage Offices (a.k.a. apartments), User Management, Visitor Entry/Checkout/Management, Vehicle Registry/Checkout, Vendor Management, Staff Attendance, Inventory & Audit, Utility Management, Financial Tracking, Reports, QR Codes & Gates, Profile, Change Password, UI Settings, Security Dashboard, Tenant Dashboard, public scan pages (visitor/vehicle entry & checkout).

## 9. User Roles & Permissions

Roles: **`admin`**, **`security`**, **`tenant`** (DB CHECK constraint enforces this set).

| Capability | admin | security | tenant |
|---|---|---|---|
| Offices/Users/Vendors/Inventory/Utilities/Invoices CRUD | ✅ | ❌ | ❌ |
| Visitor & Vehicle entry/checkout/list | ✅ | ✅ | ❌ |
| Staff attendance mark | ✅ | ✅ | ❌ |
| Admin dashboard / financial summary / reports | ✅ | ❌ | ❌ |
| Security dashboard | ✅ | ✅ | ❌ |
| Tenant dashboard | ❌ | ❌ | ✅ |
| Uploads | ✅ | ✅ | ❌ |

Enforced server-side by `RoleMiddleware`, client-side by `ProtectedRoute allowedRoles`.

## 10. Navigation / Sidebar

`components/layout/Sidebar.tsx`. Two nav sets keyed on role; security renders **no** sidebar (standalone dashboard).

- **Admin groups:** Main (Dashboard, Manage Offices, User Management) · Visitor & Security (Entry Visitors, Check-Out Visitors[badge=inside count], Vehicle Registry, Check-Out Vehicle[badge=vehicle count], Visitor Management) · Operations (Vendor, Staff Attendance, Inventory & Audit, Utility, Financial Tracking) · Analytics (Reports) · QR & Access (QR Codes & Gates) · Settings (UI Settings).
- **Tenant groups:** Main (Dashboard) · Account (My Profile, Change Password).

## 11. State Management

Zustand stores:
- `useAuthStore` — user/session, login/OTP/hydrate/logout, persisted (`auth-storage`).
- `useAppStore` — all domain collections + mutations; loads from API; ⚠ still seeds `complaints`, `dailyWorkers`, `emergencyContacts`, `apartments` from `mockData`.
- `useUISettingsStore` — per-page UI customization, synced to `/ui-settings`.

TanStack Query is installed and provided but the app primarily reads through Zustand + the imperative `api` client.

## 12. Services (backend)

`AuthService` (tokens/login/refresh/logout), `AuditService` (audit_logs writes), `OtpService` (challenge issue/verify), `FileStore` (upload storage), `RateLimiter` (file-based buckets in `storage/rate-limit/`).

## 13. Components (frontend)

Feature components in `components/features/`: `DataTable`, `KpiCard`, `StatCard`, `StatusBadge`, `SearchInput`, `TableToolbar`, `EmptyState`, `DraggableCard`, `UICustomizer`. Layout: `Header`, `Sidebar`, `Layout`. See **UI_COMPONENTS** section in FEATURE_STATUS for the full reusable list.

## 14. UI Library

shadcn/ui (Radix primitives) configured via `components.json`; ~50 primitives under `components/ui/`. Tailwind theme in `tailwind.config.ts`, tokens in `index.css`. Toaster (shadcn) + Sonner both mounted.

## 15. Where New Modules Should Be Added

- **Backend:** add migration `backend/database/migrations/00X_*.sql`; model in `models/` (extend `CrudModel`); controller in `controllers/admin/`; register routes in `routes/api.php` with appropriate `RoleMiddleware`. Add audit logging via `AuditService`.
- **Frontend:** add page in `pages/`, lazy-import + `<Route>` in `App.tsx`, nav entry in `Sidebar.tsx`, typed methods in `lib/api.ts` (+ `to*/from*` mappers), state in `useAppStore` if shared.

## 16. Coding Conventions

- **Backend:** `declare(strict_types=1)`, PSR-4 namespace `OfficeGate\\` + classmap. snake_case DB columns. Named PDO placeholders (no repeated names — enforced by security scan). Standard response envelope. Audit-log state changes.
- **Frontend:** camelCase in TS domain types; API DTOs are snake_case and mapped via `to*/from*` functions in `api.ts`. Path alias `@/`. Tailwind utility classes; `cn()` for class merging. Pages lazy-loaded.

## 17. Reusable Components

`DataTable`, `KpiCard`, `StatCard`, `StatusBadge`, `SearchInput`, `TableToolbar`, `EmptyState`, `DraggableCard`, `UICustomizer`, plus all `ui/` primitives. Prefer these over bespoke markup.

## 18. File Upload Flow

`POST /uploads` (`RoleMiddleware:admin,security`) → `UploadController::store` → `FileStore` → row in `attachments` (module, original_name, stored_path, mime, size, uploaded_by). Stored under `backend/storage/uploads/` (protected by `.htaccess`).

## 19. Notification System

⚠ **None implemented** as a backend service. Frontend uses toast notifications (shadcn Toaster + Sonner) for UX only. OTP "delivery" is via `OtpService` (SMS provider is a placeholder per deployment docs). No push/email/in-app notification persistence.

## 20. Payment Integration

⚠ **Not integrated.** `invoices` + `payments` tables and `AdminFinanceController` (manual payment recording) exist. `@stripe/*` packages are installed but **unused** — no Stripe code in `src/`. Tenant `markPaymentPaid` only mutates local mock apartment state.

## 21. Visitor Management Flow

Admin/security: `POST /admin/visitors/entry` → visitor row (`status=Inside`) + `visitor_movements` entry; `POST /admin/visitors/{id}/checkout` → `status=Exited`. Public/self-service: `/scan/visitor-entry` & `/scan/visitor-checkout` use gate token + one-time public checkout token. Optional face capture via `visitorFaceDetection.ts`. ⚠ Visitor-entry OTP in `EntryVisitors.tsx` is hardcoded `123456`.

## 22. Complaint Flow

⚠ **Frontend-only / mocked.** `Complaint` type + `mockComplaints` + `addComplaint` (local Zustand only). **No `complaints` table, controller, or API endpoint.** Not persisted.

## 23. Security Dashboard

Standalone page `pages/SecurityDashboard.tsx` (no sidebar) backed by `GET /security/dashboard` (`SecurityController`). For active-gate operations by security role.

## 24. Tenant Dashboard

`pages/TenantDashboard.tsx` under `/tenant/*` Layout, backed by `GET /tenant/dashboard` (`TenantController`) returning office, visitors, vehicles, invoices, and summary (pending approvals/payments). Sub-routes: profile, change-password.

## 25. Admin Dashboard

`pages/Dashboard.tsx` backed by `GET /admin/dashboard/summary` (`AdminDashboardController`). ⚠ Still imports `visitorTrendData`/`occupancyData` from `mockData` for some charts.

---

## TODOs / Incomplete / Dead Code / Improvements

### Incomplete or mocked (highest priority)
1. **Hardcoded visitor OTP** — `pages/EntryVisitors.tsx` `MOCK_OTP = '123456'`. Replace with real `/auth/otp/*` flow.
2. **Complaints module** — entirely mocked, no persistence. Needs table + controller + API + tenant submission UI.
3. **Payments / Stripe** — `@stripe/*` installed but unused; tenant payment is local-only. Either wire Stripe or remove the dependency.
4. **Mock-seeded state** — `useAppStore` seeds `complaints`, `dailyWorkers`, `emergencyContacts`, `apartments` from `mockData`; `Dashboard`/`FinancialTracking` import chart mock data. Replace with API.
5. **Notifications** — no backend; SMS provider is a placeholder.

### Dead / likely-unused dependencies (remove to shrink bundle)
- `three`, `@react-three/fiber|drei|rapier`, `leaflet` + `react-leaflet`, `@supabase/supabase-js`, `@reduxjs/toolkit` + `react-redux` (Zustand is the real store), `@google/generative-ai`, `hls.js`, `@stripe/*` — verify with a usage grep before deleting.

### Duplicate / overlapping
- **Offices vs apartments**: `/offices` and `/apartments` both render `ManageApartment`; offices are mapped to a synthetic `Apartment` shape (`officeToApartment`). One domain concept modeled twice (residential leftover). Consolidate naming.
- **Dual toast systems**: shadcn `Toaster` + `Sonner` both mounted.
- **Stale doc**: `docs/REQUIREMENTS.md` says auth/state are mocked — no longer true for core data; treat this file as historical.

### Improvement suggestions
- Adopt TanStack Query for server cache instead of imperative `api` + Zustand mirror (already a dependency).
- Add DB indexes flagged in DATABASE_ANALYSIS (FK columns, soft-delete filters).
- Move `MOCK_OTP` and any remaining mock imports out of production pages.
- Add OpenAPI generation/verification against `routes/api.php` to keep `docs/api/openapi.yaml` honest.

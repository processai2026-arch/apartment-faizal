# OfficeGate Multi-Tenant Architecture

Status: **Phase 1 implemented** (migration `030_organizations_super_admin.sql`).
This document records where the system was before the change, what Phase 1
actually shipped, the full target design, and the phased rollout plan.

---

## 1. Current single-tenant reality (before this change)

OfficeGate was built for exactly one building ("BRILEY ONE"):

- One `users` table with roles `admin | security | tenant` (+ `is_secretary`
  flag on admin). No notion of which *building/客户 organization* a user
  belongs to.
- Every domain table (offices, visitors, vehicles, staff, inventory,
  invoices, complaints, subscriptions, business ads, vendors, …) is global —
  a second client building would see the first client's data.
- Authorization is purely role-based (`RoleMiddleware:admin` etc.); there is
  no data-isolation layer.
- Uploads, notifications, gate tokens and analytics are likewise global.

That is fine for one building, but OfficeGate is sold to multiple client
buildings, and the operator (the software vendor) needs to manage
**subscriptions, business advertisements, ad billing and vendors** per client
— without giving building admins access to platform-level revenue tooling.

## 2. What Phase 1 adds (implemented)

### 2.1 `organizations` table

`backend/database/migrations/030_organizations_super_admin.sql` creates:

| column | notes |
|---|---|
| `id` | PK; org **1 = 'BRILEY ONE'** seeded by the migration |
| `name`, `slug` (UNIQUE) | slug reserved for future subdomain routing |
| `contact_person/email/phone` | client contact |
| `plan` | `Free \| Standard \| Premium` (CHECK) |
| `status` | `Active \| Suspended \| Trial` (CHECK) |
| `ads_enabled` | INTEGER flag — future per-org ads gating (org 1 seeded `1`) |
| `notes`, timestamps, `deleted_at` | soft delete (org 1 cannot be deleted) |

### 2.2 `org_id` columns + backfill

Nullable `org_id INTEGER` added to **7 tables** and existing rows backfilled
to org 1 so current data stays coherent:

- `users` *(rebuilt — see 2.3)*
- `subscriptions`
- `subscription_plans` — column added but rows left **NULL = global catalog**
  shared by all orgs (plans are a product catalog, not client data)
- `business_ads`
- `business_categories`
- `ad_packages`
- `ad_billing`
- `vendors`

Indexes: `idx_users_org`, `idx_subscriptions_org`, `idx_business_ads_org`,
`idx_ad_billing_org`, `idx_vendors_org`.

### 2.3 `super_admin` superset role

- SQLite cannot alter a CHECK constraint, so 030 **rebuilds `users`** with an
  identical schema except: role CHECK widened to
  `('super_admin','admin','security','tenant')` and `org_id` appended. The
  `status` CHECK (`active|inactive`) is preserved verbatim; indexes from 021
  are recreated.
- `RoleMiddleware::passes()` implements the superset **centrally**: a route
  that allows `admin` implicitly allows `super_admin`; routes may require
  `super_admin` explicitly, which a plain admin does **not** satisfy.
- `User::public()` now exposes `orgId`; JWT/login/me flows needed no role
  whitelist changes.
- Seed (`backend/scripts/seed.php`): `superadmin@officegate.local` /
  `SEED_SUPERADMIN_PASSWORD` (dev default `ChangeMe@12345`), role
  `super_admin`, org 1. Existing demo users now also seed with `org_id = 1`.
- Frontend mirrors the superset in `ProtectedRoute.roleSatisfies()`, so all
  existing `allowedRoles={['admin']}` route declarations keep working.

### 2.4 Ads visible ONLY to the super admin

- **Backend** (`backend/routes/api.php`): every `/admin/business-ads*`,
  `/admin/ad-packages*`, `/admin/business-categories*` **and** the
  tenant-facing `/tenant/business-ads*`, `/tenant/business-categories`
  routes changed from `RoleMiddleware:admin` / `:tenant` to
  `RoleMiddleware:super_admin`. Chosen over the "empty list when
  `ads_enabled=0`" option because it is simpler and airtight; `ads_enabled`
  remains as the flag for a future per-org re-enable.
- **Frontend**: 'Business Ads' (`/business-ads`) and 'Ad Billing'
  (`/ad-billing`) moved out of the admin *Community* sidebar group into the
  super-admin-only *Super Admin* group; both routes carry a nested
  `ProtectedRoute allowedRoles={['super_admin']}`. The tenant
  `/tenant/business-ads` route registration, the 'Local Businesses' sidebar
  entry and the Resident Service Hub tile were removed (the
  `BusinessMarketplace` page still compiles; it is simply unrouted).

### 2.5 Super Admin portal + API

- `SuperAdminController` (all routes `RoleMiddleware:super_admin`):
  - `GET/POST /super/organizations`, `GET/PUT/DELETE /super/organizations/{id}`
  - `POST /super/organizations/{id}/status` (Active/Suspended/Trial)
  - `POST /super/organizations/{id}/assign-user` `{userId}` → sets `users.org_id`
  - `GET /super/overview` → per-org rollup `{org, users, active_subscriptions,
    subscription_revenue, business_ads, ad_billing_total, vendors}` + totals
- Frontend: `/super` route (super_admin only) → `SuperAdminPortal.tsx` with
  stat cards (organizations, subscription revenue, ad billing, vendors) and
  tabs *Organizations* (DataTable + add/edit dialog + status & ads toggles)
  and *Overview* (rollup DataTable). State in `useSuperAdminStore.ts`; API in
  the `superAdmin` section of `src/lib/api.ts`.

### 2.6 Pragmatic org scoping (what is scoped vs deferred)

`backend/helpers/OrgScope.php`:

- `orgIdFor(request)` — list scoping: super_admin sees **all orgs** and may
  narrow with `?orgId=`; every other role is pinned to its own
  `users.org_id` (fallback org 1 for pre-migration accounts).
- `stampFor(request)` — org id written onto newly created rows.

**Scoped now** (list filters): `Subscription::list`, `BusinessAd::list`,
`Vendor::list` (admin *and* tenant list endpoints share these models), plus
the raw-SQL ad-billing list. **Stamped now** (creates): admin + tenant
subscription creation, business-ad creation, ad-billing creation (inherits
the ad's org), vendor creation.

**Deferred deliberately** (single-org data today, low risk):

- `show/update/delete` cross-org checks on individual records (list scoping
  hides them; direct-ID access is still possible for admins within the API).
- Catalog endpoints: subscription plans, ad packages, business categories,
  premium features (treated as global catalogs).
- Dashboards/analytics raw SQL (`AdminDashboardController`,
  `AdminAnalyticsController`, subscription/ads dashboards) remain global.
- Org inheritance on `AdminUserController::store` — new users get an org via
  `POST /super/organizations/{id}/assign-user`.
- All other domain tables (offices, visitors, vehicles, staff, invoices, …)
  — see target design below.

## 3. Target design (full multi-tenancy)

1. **`org_id` on every domain table.** Offices, visitors, vehicles, staff,
   inventory, invoices/payments, complaints, maintenance, rentals,
   announcements, events, documents, payroll, medical, IoT devices, assets,
   AMC contracts, audit logs. Same nullable-column + backfill recipe as 030.
2. **Data-isolation middleware.** An `OrgScopeMiddleware` resolves the
   request's organization once (JWT claim `org` + `users.org_id`) and stores
   it on the `Request`; models read it via a shared `CrudModel` hook so every
   `list/find/create/update/delete` is automatically org-constrained.
   Super admin bypasses with explicit `?orgId=`; cross-org access is denied
   with 404 (not 403) to avoid existence leaks.
3. **Slug/subdomain routing.** `organizations.slug` (already UNIQUE) maps
   `briley-one.officegate.app` → org id at the edge; the SPA reads the org
   from the session. Login becomes org-aware (email unique *per org* long
   term — requires dropping the global UNIQUE on `users.email` in favour of
   `UNIQUE(org_id, email)` via another table rebuild).
4. **Org-scoped uploads.** `attachments` gains `org_id`; files move to
   `storage/uploads/{org_slug}/…`; the upload controller stamps and the
   download path verifies org membership.
5. **Billing per organization.** The `organizations.plan` field becomes a
   real platform subscription (per-org invoices, Razorpay customer per org,
   `status='Suspended'` enforced by middleware that blocks non-super-admin
   logins of suspended orgs).
6. **Ads gating by `ads_enabled`.** Re-open tenant ad routes but return only
   ads of orgs with `ads_enabled=1`, keeping super-admin-only management.
7. **Migration/backfill plan.** One migration per table group; every
   backfill defaults to org 1; MySQL production gets the equivalent DDL in
   `database/officegate_production.sql` (the PHP runner is SQLite-only).
8. **Risks.**
   - Raw SQL scattered through controllers can silently skip the org filter →
     mitigate with a query-review checklist + integration tests per module.
   - SQLite table rebuilds (CHECK changes) must replicate concurrent schema
     drift; keep rebuilds rare and coordinate migrations serially.
   - Global unique keys (`users.email`, `users.phone`, `gate_tokens`) clash
     with per-org duplication; needs the `UNIQUE(org_id, …)` rework.
   - JWTs issued before an org move keep working (role/org read from DB per
     request via AuthMiddleware — org changes take effect immediately; role
     claim in the token is informational only).

## 4. Phased rollout

| Phase | Scope | Status |
|---|---|---|
| 1 | `organizations`, `super_admin` superset role, org_id on subscriptions/ads/billing/vendors (+users), ads super-admin-only, `/super` portal, per-org overview | ✅ shipped (this change) |
| 2 | Org stamping+scoping for remaining revenue modules (rentals, invoices), cross-org checks on show/update/delete, org-aware user creation | next |
| 3 | `OrgScopeMiddleware` + `CrudModel` hook → blanket isolation of all domain tables; suspended-org login block | |
| 4 | Slug/subdomain routing, per-org login + `UNIQUE(org_id,email)`, org-scoped uploads | |
| 5 | Platform billing per org (Razorpay), `ads_enabled` tenant re-enable, per-org analytics | |

## 5. Files touched by Phase 1

Backend: `database/migrations/030_organizations_super_admin.sql`,
`middleware/RoleMiddleware.php`, `helpers/OrgScope.php`,
`models/{Organization,User,Subscription,BusinessAd,Vendor,AdBilling}.php`,
`controllers/admin/{SuperAdminController,AdminVendorController,AdminBusinessAdController,AdminSubscriptionController}.php`,
`controllers/TenantSubscriptionController.php`, `routes/api.php`,
`scripts/seed.php`.

Frontend: `src/types/auth.ts`, `src/types/index.ts`, `src/lib/api.ts`,
`src/stores/{useAuthStore,useAppStore,useSuperAdminStore}.ts`,
`src/components/auth/ProtectedRoute.tsx`,
`src/components/features/NotificationBell.tsx`,
`src/components/layout/Sidebar.tsx`, `src/pages/SuperAdminPortal.tsx`,
`src/pages/ResidentServiceHub.tsx`, `src/App.tsx`.

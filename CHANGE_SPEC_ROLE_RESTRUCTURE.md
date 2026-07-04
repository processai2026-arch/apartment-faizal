# Change Specification — Role Restructure & Module Interconnection

> Status: **Requested — not yet implemented.** This document captures the change
> requests for review/clarification before any code is written. Items marked
> **❓NEEDS CLARIFICATION** or **⚠️CONFLICT** must be resolved first.
> Date captured: 2026-07-04.

## Legend
- **Nav** = sidebar item in `frontend/src/components/layout/Sidebar.tsx`
- Target files noted per item. Backend routes in `backend/routes/api.php`.
- Feature entitlement keys refer to `backend/helpers/FeatureRegistry.php`.

---

## 1. Super Admin login

The super admin is the SaaS provider. Its sidebar must be **stripped down** to only
provisioning/billing concerns — none of the day-to-day apartment operations.

### 1.1 Sidebar — remove these groups/items (from `adminNavItems` when rendered for super_admin)
| # | Remove | Notes |
|---|--------|-------|
| 1 | **Main** group entirely | Dashboard, Manage Offices, Name Transfer, User Management |
| 2 | **Visitor & Security** group fully | Entry/Checkout visitors, vehicles, Visitor Mgmt, Visitor Passes, CCTV |
| 3 | **Operations** group **except AMC** | keep only the AMC/DG entry (see §1.3 re: AMC vs DG) |
| 4 | **Community** group entirely | Rental, Announcements, Emergency Contacts, Daily Workers, Events |
| 5 | **Reports** group **except Subscriptions** | keep only **Subscriptions**; remove Reports, Compliance, Analytics, Payment Dashboard |
| 6 | **QR & Access** group entirely | QR Codes, IoT, Home Automation, Notifications |
| 7 | **Settings** → remove **Secretary Management** and **WhatsApp Hub** | keep UI Settings only (see ⚠️ conflict in §5) |

### 1.2 Sidebar — what super admin KEEPS
- **Super Admin** group: Super Admin portal (`/super`), **Business Ads**, **Ad Billing**
- **Subscriptions** (`/subscriptions`)
- **AMC** (or DG — see §1.3)

> Implementation approach: build a dedicated `superAdminNavItems` list instead of
> `[...superAdminNavItems, ...adminNavItems]`. Super admin should NOT inherit the
> full admin nav anymore.

### 1.3 Organization provisioning (super admin portal `/super`)
When creating an organization (apartment), the flow must also:
- **Create the secretary (admin) login credentials** for that apartment (name/email/phone/password → a `users` row with role `admin`, `is_secretary=1`, `org_id`=new org).
- **Enable specific features** for the apartment (the existing Manage-Features checklist — fold it into the create form).
- **Set a billing plan** for the apartment (plan selector already on the org form — tie to subscription).

Target: `frontend/src/pages/SuperAdminPortal.tsx`, `backend/controllers/admin/SuperAdminController.php` (`storeOrganization` → also create secretary user + seed features + set plan).

### 1.4 ⚠️ AMC vs DG conflict
Super admin **keeps AMC** (§1.1 #3), but Admin (§2.8) says **remove AMC, keep DG**. The
`AMC & DG` module (`/amc`) is currently one page. Decide: split into two, or one module
labeled per role. **❓NEEDS CLARIFICATION.**

---

## 2. Admin (Secretary) login

### 2.1 Rename nav: "Manage Offices" → "Manage User / Tenant"
- `Manage Offices` (`/offices`) label → **Manage User/Tenant** (manage the apartment's tenants).
- Confirm whether the underlying page stays the offices/units registry or becomes tenant management. **❓NEEDS CLARIFICATION** (offices vs tenants are different entities today).

### 2.2 Rename nav: "User Management" → "Security Management"
- `User Management` (`/users`) label → **Security Management**.
- This page must **create tenant and security credentials** (users with role `tenant` or `security`, scoped to the admin's `org_id`).
- Target: `frontend/src/pages/UserManagement.tsx`, backend `/admin/users` create (allow roles security + tenant; already role-restricted).

### 2.3 Name Transfer linked with Manage Offices
- **Name Transfer** (`/name-transfers`) should be nested/linked under **Manage Offices** (now "Manage User/Tenant") rather than a standalone Main item.
- Target: Sidebar grouping + optionally route nesting.

### 2.4 Operations module — "by karthi"
- ❓NEEDS CLARIFICATION. Interpreted as: the **Operations** group is owned/handled by **Karthi** (separate owner/agent). No concrete UI change stated. Flagged for follow-up.

### 2.5 🐞 Authentication error
- An authentication error exists somewhere in the admin flow (flagged 😍). **Needs a
  reproduction**: which page/action throws it? **❓NEEDS CLARIFICATION** (route + steps).

### 2.6 Vendor Management — collapse tabs
- Remove all tabs in **Vendor Management** (`/vendors`); keep **only "Vendor Maintenance"**.
- Target: `frontend/src/pages/VendorManagement.tsx`.

### 2.7 Vendor Marketplace — tenant reviews connect
- **Vendor Marketplace reviews written by tenants** must connect with the marketplace/vendor page.
- Sentence was truncated ("connect with …"). **❓NEEDS CLARIFICATION** of the exact target
  (connect tenant review submission → admin marketplace vendor detail? show reviews on the tenant marketplace page?).
- Target: `frontend/src/pages/VendorMarketplace.tsx`, `VendorDetails.tsx`, tenant `/tenant/marketplace`.

### 2.8 Documents — fix everywhere
- **Documents** feature has issues across all places it is used; audit + fix.
- **❓NEEDS CLARIFICATION**: what is broken (upload? list? download? office linkage?).
- Target: `frontend/src/pages/DocumentManagement.tsx`, backend documents controller.

### 2.9 AMC & DG — remove AMC, keep DG (admin)
- In the admin **AMC & DG** module, remove the AMC portion, keep **DG maintenance**.
- Target: `frontend/src/pages/AmcMaintenance.tsx`, backend AMC/DG controllers. (See §1.4 conflict with super admin keeping AMC.)

### 2.10 Community module → shown to tenant, edited by admin
- The **Community** content is **displayed in the tenant login** and **updated/managed by admin**.
- Applies to: Announcements, Events, Emergency Contacts, etc. (admin authors, tenant views).
- Mostly already the model — verify each community sub-module has admin-write / tenant-read wired.

### 2.11 Payments — single option
- Remove **Payment Dashboard** (`/payments`) and **Subscriptions** (`/subscriptions`) from admin.
- Keep a single **Payment** option in admin login.
- **❓NEEDS CLARIFICATION**: what does the single "Payment" page show (invoices? razorpay? both)?
- Target: Sidebar Reports group, `App.tsx` routes.

### 2.12 IoT Monitoring — hardware owner
- **IoT Monitoring** integration is handled by **Karthi (hardware agent)**. No UI change
  specified here; flagged as externally owned. (IoT ingest pipeline already built.)

### 2.13 CCTV Management — remove marketing line
- Remove this text from CCTV Management:
  > "AI Detection Ready — Motion analysis, unknown person detection, and vehicle recognition will be enabled in a future release via the RTSP stream integration."
- Appears **twice** in `frontend/src/pages/CameraManagement.tsx` (detail dialog + list view). Remove both.

### 2.14 Secretary Management — admin removes it
- Remove **Secretary Management** from the **admin** sidebar; it should exist **only in the
  super admin** provisioning flow (§1.3).
- ⚠️ See §5 conflict: §1.1 #7 also removes Secretary Management from the super admin Settings
  group. Reconciliation: there is **no standalone Secretary Management page**; secretary
  creation happens inside super admin org provisioning. Confirm.

---

## 3. Tenant login

### 3.1 Sidebar fix
- Tenant sidebar needs correction (layout/items). **❓NEEDS CLARIFICATION** on exactly what's
  wrong (order? missing/extra items? grouping?).
- Target: `tenantNavItems` in `Sidebar.tsx`.

### 3.2 "service up bottom app guide"
- **❓NEEDS CLARIFICATION.** Interpreted as: the **Service Hub** should have a bottom
  navigation / app-guide layout for tenants (mobile-style bottom bar?). Confirm intent.

### 3.3 Remove "My Plan"
- Remove **My Plan** (`/tenant/subscription`) from the tenant sidebar (Account group).
- Target: `tenantNavItems` Account group; optionally drop the route.

---

## 4. Security login

### 4.1 Security login not connected to any module
- The security dashboard is currently isolated (Sidebar returns `null` for `security`).
- Needs proper module wiring (a real sidebar/nav for security).
- Target: `Sidebar.tsx` (add a `securityNavItems`), `App.tsx` security routes.

### 4.2 Visitor pass: admin creates → security scans
- **Admin creates** visitor passes; **security scans** them at the gate.
- Wire: admin `/visitor-passes` (create) → security scan flow (`ScanVisitorEntry`/QR scan) uses those passes.
- Target: visitor-pass controller, security scan pages, gate-token endpoints.

### 4.3 Determine security's module set
- Decide which modules security must access and connect them all. Candidate set (for review):
  - Visitor entry/checkout + **visitor pass scanning**
  - Vehicle entry/checkout + QR gate scanning
  - Daily Workers
  - Emergency Contacts
  - Security notifications
  - CCTV (view-only?) — **❓ confirm**
- **❓NEEDS CLARIFICATION**: final list of security-accessible modules.

---

## 5. Cross-cutting & conflicts

### 5.1 Business Ads visible in ALL logins
- Business Ads must be shown in **admin, security, and tenant** logins (not just super admin).
- ⚠️ **CONFLICT with prior requirement**: earlier the ads were deliberately made
  **super-admin-only** (routes gated `RoleMiddleware:super_admin`; tenant ad pages removed).
  This reverses that. Confirm scope:
  - Ads **management** stays super-admin-only, but ad **display/content** shows to all roles? OR
  - Full ad module visible to all logins again?
- Target (if reverting): un-gate the relevant `/tenant/business-ads` + display components,
  re-add nav entries, adjust `RoleMiddleware:super_admin` on read/display routes.

### 5.2 Secretary Management conflict (§1.1 #7 vs §2.14)
- Both super admin Settings and admin remove "Secretary Management".
- **Resolution (proposed):** eliminate the standalone Secretary Management module entirely;
  secretary credential creation lives only in super admin org provisioning (§1.3). **Confirm.**

### 5.3 AMC vs DG conflict (§1.4)
- Super admin keeps AMC; admin keeps DG. Need a decision on splitting the `AMC & DG` module.

### 5.4 Final: all modules interconnected
- End goal: **all modules interconnected** — data flows across roles (admin authors →
  tenant/security consume; security actions → admin visibility; etc.).
- Requires a per-module data-flow audit. To be planned after the above are locked.

---

## 6. Impacted files (quick map)
| Area | Files |
|------|-------|
| Sidebars / nav | `frontend/src/components/layout/Sidebar.tsx` |
| Routing / guards | `frontend/src/App.tsx` |
| Super admin portal | `frontend/src/pages/SuperAdminPortal.tsx`, `backend/controllers/admin/SuperAdminController.php` |
| User/security/tenant creation | `frontend/src/pages/UserManagement.tsx`, `backend` user routes |
| Vendor management | `frontend/src/pages/VendorManagement.tsx` |
| Vendor marketplace/reviews | `VendorMarketplace.tsx`, `VendorDetails.tsx`, tenant marketplace |
| Documents | `DocumentManagement.tsx`, backend documents controller |
| AMC/DG | `AmcMaintenance.tsx`, backend AMC/DG controllers |
| CCTV | `frontend/src/pages/CameraManagement.tsx` (remove marketing line ×2) |
| Payments | Sidebar Reports group, payment pages |
| Tenant nav | `Sidebar.tsx` (`tenantNavItems`) |
| Security nav/modules | `Sidebar.tsx` (new `securityNavItems`), security pages, scan pages |
| Business ads visibility | ad routes + `RoleMiddleware`, ad components/nav |
| Feature entitlements | `backend/helpers/FeatureRegistry.php`, `FeatureMiddleware`, `useEntitlementsStore` |

---

## 7. Open questions to resolve before implementation
1. §2.1 — "Manage User/Tenant": keep offices registry or replace with tenant management?
2. §2.5 — Authentication error: exact page + reproduction steps.
3. §2.7 — Vendor marketplace tenant reviews: connect to what exactly?
4. §2.8 — Documents: what specifically is broken?
5. §2.11 — Single "Payment" page: what does it contain?
6. §3.1 / §3.2 — Tenant sidebar fix + "service up bottom app guide": exact intent.
7. §4.3 — Final list of security-accessible modules.
8. §5.1 — Business Ads: management vs display; how far to revert super-admin-only gating.
9. §1.4 / §5.3 — AMC vs DG split decision.
10. §2.4 / §2.12 — "by karthi" items: what is expected from us vs the hardware owner?

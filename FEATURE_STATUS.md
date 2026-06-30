# FEATURE STATUS — OfficeGate

> Status legend: ✅ Complete · 🟡 Partial · 🔴 Not started · 🐞 Buggy / risky · 🔧 Needs improvement.
> Generated 2026-06-30 from repository state (backend routes + frontend pages + stores).
> Percentages are completion estimates of the *intended* feature, not code coverage.

---

## Summary

| Module | Status | % | One-line note |
|---|---|---|---|
| Authentication (password) | ✅ | 95% | JWT access+refresh, rotation, audit. Solid. |
| Authentication (OTP login) | 🟡 | 70% | Endpoints exist; SMS provider is a placeholder. |
| User Management | ✅ | 90% | CRUD for security/tenant users via admin. |
| Office Management | ✅ | 90% | Full CRUD + status; dual `/offices` & `/apartments` routes. |
| Visitor Entry / Checkout | 🟡🐞 | 80% | Works, but visitor OTP is hardcoded `123456`. |
| Visitor Management (list) | ✅ | 90% | List/active/show/checkout. |
| Vehicle Registry / Checkout | ✅ | 88% | Entry/checkout + movements + dedupe. |
| Public Self-Service Scan | ✅ | 85% | Gate-token + one-time checkout tokens. |
| Vendor Management | 🟡 | 70% | API list/create/show/update; no delete; UI present. |
| Staff Attendance | ✅ | 85% | Mark P/A/H, attendance summary. |
| Inventory & Audit | 🟡 | 75% | Items + movements; no delete; some UI gaps. |
| Utility Management | ✅ | 85% | CRUD + complete; status lifecycle. |
| Financial Tracking | 🟡 | 65% | Invoices/payments API exists; charts use mock data. |
| Reports | 🟡 | 60% | Generic `/admin/reports/{type}`; breadth unclear. |
| QR Codes & Gates | ✅ | 85% | Gate token generation + QR rendering. |
| Admin Dashboard | 🟡 | 80% | Summary API live; some charts still mock. |
| Security Dashboard | ✅ | 85% | Dedicated endpoint + standalone page. |
| Tenant Dashboard | 🟡 | 75% | Real summary; payment action is local-only. |
| UI Settings / Customizer | ✅ | 90% | Per-user/page persisted prefs. |
| File Uploads | ✅ | 85% | Upload → attachments table. |
| Profile / Change Password | ✅ | 90% | Standard flows. |
| **Complaints** | 🔴 | 20% | Frontend mock only — no table/API/persistence. |
| **Notifications** | 🔴 | 5% | Toasts only; no backend system. |
| **Payments / Stripe** | 🔴 | 15% | Stripe installed but unused; manual record only. |
| Daily Workers / Emergency Contacts | 🔴 | 10% | Mock data in store; no backend. |

**Overall estimated completion: ~78%** of the intended product (core gate/visitor/vehicle/ops complete; complaints, notifications, real payments, and a few residential leftovers outstanding).

---

## Detailed Status

### Completed ✅
- **Auth core** — `AuthService` login/refresh/logout, JWT HS256, refresh-token rotation in a DB transaction, audit logging, rate limiting on auth routes, frontend auto-refresh on 401.
- **Office / User / Vehicle / Staff / Utility CRUD** — controllers, models, routes, role gating, frontend pages and store actions all wired to the API.
- **Public scan** — gate-token middleware + one-time public checkout tokens (migration 004).
- **UI settings, uploads, profile, change-password, QR generation** — functional end to end.

### Partially completed 🟡
- **OTP login** — full endpoint set, but SMS sending is a placeholder per `docs/HOSTINGER_DEPLOYMENT.md`; cannot deliver real codes without provider config.
- **Financial Tracking / Admin Dashboard** — invoice/payment/summary endpoints exist, but `Dashboard.tsx` and `FinancialTracking.tsx` still import `visitorTrendData`/`occupancyData`/`financialTrendData` from `mockData` for charts.
- **Tenant Dashboard** — reads real `/tenant/dashboard`, but the "pay" action (`markPaymentPaid`) only mutates local mock apartment state — no real payment.
- **Vendor / Inventory** — create/update but **no delete endpoint**; some UI affordances exceed the API.
- **Reports** — single generic `GET /admin/reports/{type}`; coverage of report types not verified.

### Not started / mock-only 🔴
- **Complaints** — `Complaint` type, `mockComplaints`, and local `addComplaint` exist; **no `complaints` table, controller, or route**. Tenant cannot actually file a complaint that persists.
- **Notifications** — no backend service or table; only client toasts.
- **Payments integration** — `@stripe/react-stripe-js` / `@stripe/stripe-js` installed, **zero usage** in `src/`.
- **Daily workers / emergency contacts** — `mockDailyWorkers`, `mockEmergencyContacts` seeded into the store; no persistence.

### Buggy / risky 🐞
- **Hardcoded visitor OTP** — `pages/EntryVisitors.tsx`: `const MOCK_OTP = '123456'` used to gate visitor entry. Security hole / placeholder; must use real `/auth/otp/*`.
- **Stale documentation** — `docs/REQUIREMENTS.md` claims auth and data are mocked; this is outdated and will mislead. Mark historical or update.

### Needs improvement 🔧
- **Mock imports in production pages/stores** — remove `mockData` reliance from `useAppStore` (complaints/dailyWorkers/emergencyContacts/apartments) and dashboard charts.
- **Dead dependencies** — `three`/`@react-three/*`, `leaflet`/`react-leaflet`, `@supabase/supabase-js`, `@reduxjs/toolkit`+`react-redux`, `@google/generative-ai`, `hls.js`, `@stripe/*` appear unused; removing them shrinks the bundle. Verify with a grep first.
- **State strategy** — TanStack Query is installed but the app uses an imperative `api` client mirrored into Zustand; consolidating would reduce duplicate caching logic.
- **Missing FK indexes** — see DATABASE_ANALYSIS; index FK + `deleted_at` columns before production scale.
- **Duplicate office/apartment modeling** — collapse the residential `Apartment` leftover into the `Office` domain.
- **Dual toast systems** — shadcn Toaster + Sonner both mounted; pick one.

---

## UI Components Inventory (reusable)

**Feature components** (`components/features/`): `DataTable`, `KpiCard`, `StatCard`, `StatusBadge`, `SearchInput`, `TableToolbar`, `EmptyState`, `DraggableCard`, `UICustomizer`.
**Layout** (`components/layout/`): `Header`, `Sidebar`, `Layout`.
**Auth**: `ProtectedRoute`, `PublicRoute`.
**Primitives** (`components/ui/`, ~50 shadcn/Radix): accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast/toaster, toggle/toggle-group, tooltip.
**Theme**: Tailwind 3.4 tokens (`tailwind.config.ts` + `index.css`), lucide-react icons, dark sidebar (`#0F172A`) with indigo accent.

---

## Recommended Next Steps (priority order)

1. **Remove the hardcoded visitor OTP** and wire real OTP (security-critical). 🐞
2. **Build the Complaints module** end to end (table → controller → API → tenant UI). 🔴
3. **Decide Stripe**: integrate or remove the unused dependency; make tenant payments real. 🔴
4. **Replace remaining mock data** in dashboards/stores with API calls. 🔧
5. **Add FK / soft-delete indexes** before scaling. 🔧
6. **Prune unused heavy dependencies** to shrink the frontend bundle. 🔧
7. **Refresh `docs/REQUIREMENTS.md`** or mark it historical. 🔧

# Apartment / Office Building Management Requirements

Generated from the current repository on 2026-06-26.

## Current Product Direction

The codebase is a Vite, React, TypeScript, Tailwind, shadcn-style frontend for a building management system. The frontend app now lives in `frontend/`. The active branding and data point to an office building product named `OfficeGate` for `BRILEY ONE`, but parts of the code still use apartment/resident naming from an older `ApartmentOS` concept.

The product should be treated as an office/commercial-building gate and operations system unless the business decides to return to a residential apartment model.

## Current Implementation Snapshot

- Frontend only. There is no backend API, database schema, server folder, Supabase client setup, or deployed persistence layer in the repo.
- Runtime state is stored in Zustand from `frontend/src/data/mockData.ts`.
- Auth is mocked in `frontend/src/stores/useAuthStore.ts` with hardcoded demo users and OTPs.
- UI preferences are persisted in browser local storage via `useUISettingsStore`.
- QR scan pages are public routes and use browser `BroadcastChannel` to sync with open tabs on the same browser/device context.
- Admin, security, and tenant roles exist in routing and mocked auth.
- Frontend commands should be run from `frontend/`.

## Existing Roles

### Admin

Admin can access the full sidebar application:

- Dashboard
- Manage Offices
- Entry Visitors
- Check-Out Visitors
- Vehicle Registry
- Check-Out Vehicles
- Visitor Management
- Vendor Management
- Staff Attendance
- Inventory & Audit
- Utility Management
- Financial Tracking
- Reports
- QR Codes & Gates
- UI Settings
- Profile and password screens

### Security

Security has a standalone dashboard without the admin sidebar:

- View active visitors, active vehicles, and staff/workers.
- Manually add a visitor with OTP verification.
- Show a visitor gate QR code.
- Check out visitors and vehicles.
- Mark staff attendance.

### Tenant

Tenant dashboard exists but is mostly mocked and still partly residential:

- Overview cards.
- Visitor approvals.
- Parcel tracking.
- Payments.
- Profile.

## Extracted Functional Requirements

### Authentication and Authorization

- Support login by email/password.
- Support login by phone OTP.
- Enforce role-based route access for admin, security, and tenant users.
- Replace mocked users and mocked OTP with a server-side auth flow.
- Store sessions securely and support logout.
- Provide password reset and change password flows backed by real API behavior.

### Building / Office Management

- Maintain building/offices master data.
- Track block, floor, company name, contact person, phone, email, allocated parking/vehicle slots, used slots, and status.
- Support add, edit, status toggle, search, and filters.
- Decide final terminology: office/company/building versus apartment/resident/unit.

### Visitor Entry

- Register visitor details: name, phone, gender, address, city, pincode.
- Capture visit details: block, floor, company, person to meet, reason.
- Optionally capture vehicle type and vehicle number.
- Verify visitor phone by OTP before entry.
- Optionally capture visitor photo with device camera.
- Create an active visitor entry with guard name, entry time, OTP reference, and photo.
- Allow form-field visibility and order customization.

### Visitor Checkout

- List visitors currently inside.
- Search by name, phone, block, floor, company, or person to meet.
- Check out one visitor and record exit time and duration.
- Preserve checkout history for reporting.

### Visitor Management

- List all visitor records.
- Search and paginate visitor records.
- View visitor details.
- Export visitors to CSV.
- Keep entry and exit history for audit.

### Vehicle Entry

- Register vehicle number, vehicle type, model, owner/driver, associated company/floor/block, and parking user type.
- Log vehicle entry time and status.
- Replace current apartment-based fields (`apartmentNo`, legacy `type`) with office-building fields.
- Validate duplicate active vehicle entries.
- Track allocated versus used parking slots per company.

### Vehicle Checkout

- List vehicles currently inside.
- Search by vehicle number, company, type, model, or owner.
- Check out vehicle and record exit time.
- Keep vehicle entry/exit history for reporting.

### QR Gate Flows

- Provide public QR pages for visitor check-in and vehicle check-in.
- Add missing QR cards for visitor checkout and vehicle checkout if those public pages should be used.
- Replace third-party QR image generation with local QR rendering everywhere for reliability and privacy.
- Persist scan submissions through a backend API, not only `BroadcastChannel`.

### Security Dashboard

- Provide a fast guard-facing dashboard for active visitor and vehicle lists.
- Support manual visitor entry for visitors without smartphones.
- Support active checkout actions.
- Support worker/staff attendance marking.
- Show live gate QR.
- Avoid unsafe optional field assumptions in active workers and vehicles.

### Staff Attendance

- Maintain staff list with role, department, contact, and join date.
- Support add, edit, remove staff.
- Mark attendance by date with Present, Absent, and Half-Day.
- Show daily attendance summary.
- Store attendance history for reports.

### Vendor Management

- Maintain vendors by category: Regular Maintenance, Utility Providers, Ad-Hoc Vendors.
- Track vendor name, company, service type, contact, last visit, next visit, and status.
- Add new vendors.
- Search, filter, and export vendor data in later phases.

### Inventory and Audit

- Track procurement items: item name, category, quantity, unit cost, total cost, vendor, and purchase date.
- Track monthly budget and spending.
- Track usage: used quantity, location, and used by.
- Support month/year filtering.
- Add new inventory items.
- Add real stock deduction and audit history.

### Utility Management

- Track maintenance tasks such as sump cleaning, drainage, lift, electrical, pest control, fire safety, HVAC, and general tasks.
- Track scheduled date, last completed date, status, assigned staff, and notes.
- Add tasks and mark tasks done.
- Calculate overdue status from schedule instead of relying only on static status.

### Financial Tracking

- Track charges, paid, pending, and overdue status.
- Mark payments paid.
- Add financial records.
- Show collection trend.
- Align financial model with office tenants and commercial billing instead of residential apartment payment fields.

### Reports

- Generate report views for visitors, vendors, staff attendance, inventory, and financials.
- Support date range filters.
- Export real CSV/PDF files rather than only showing success toast.
- Print report view.
- Ensure reports use persisted backend data.

### UI Customization

- Persist visible cards, columns, buttons, sections, and order per page.
- Support reset to defaults.
- Reconcile default UI settings with actual page semantics. Several defaults still use apartment/utility-meter concepts that do not match current pages.

## Data Requirements

Minimum persistent entities needed:

- users
- roles and permissions
- offices or tenants
- visitors
- visitor photos
- vehicles
- vehicle movements
- vendors
- staff
- staff attendance
- inventory items
- inventory usage/audit events
- utility tasks
- payments or invoices
- reports/export jobs, if exports are async
- UI settings per user/page

## Major Gaps Before Production

1. No backend or database.
2. No real authentication or OTP delivery.
3. No persistence for operational data.
4. No real multi-device sync. Current QR flow only syncs browser tabs via `BroadcastChannel`.
5. Mixed domain language: OfficeGate/BRILEY ONE versus ApartmentOS/resident/apartment.
6. Vehicle entry and public scan pages still use residential fields.
7. QR admin page omits checkout QR routes that exist in routing.
8. Reports and exports are mostly UI-only.
9. Package dependencies are not installed locally, so build/lint cannot currently run.
10. Some optional fields are accessed as if always present and need hardening during TypeScript/build cleanup.

## Recommended Build Phases

### Phase 1: Stabilize Frontend Baseline

- Run frontend commands from `frontend/` and keep `npm run build` and `npm run lint` passing.
- Decide final product domain language.
- Rename visible apartment/resident text to office/company/tenant where appropriate.
- Fix TypeScript type mismatches in vehicle and scan flows.
- Remove unused heavy dependencies if not needed.

### Phase 2: Core Data and API

- Add backend/database or connect Supabase if that is the chosen stack.
- Implement auth, users, roles, and sessions.
- Implement CRUD APIs for offices, visitors, vehicles, staff, vendors, inventory, utilities, and financials.
- Replace mock Zustand initialization with API-backed loading and mutations.

### Phase 3: Gate Operations

- Make visitor entry, visitor checkout, vehicle entry, and vehicle checkout production-grade.
- Add real OTP provider integration.
- Add photo upload storage.
- Add parking slot validation.
- Add server-backed QR submissions and live dashboard refresh.

### Phase 4: Operations Modules

- Complete staff attendance history.
- Complete vendor service log.
- Complete inventory usage and stock movement audit.
- Complete utility task scheduling and overdue calculation.
- Complete commercial billing/payments model.

### Phase 5: Reporting and Admin Polish

- Implement CSV/PDF exports.
- Add filters, date ranges, and saved report views.
- Add audit trails.
- Add tenant portal real data.
- Harden mobile responsiveness and role-specific UX.

## Validation Notes

Validation on 2026-06-26:

- `npm run build` passes from `frontend/`.
- `npm run lint` passes from `frontend/` with warnings only.
- Vite dev server runs from `frontend/` on `http://localhost:8080/`.

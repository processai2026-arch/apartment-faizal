# OfficeGate API Documentation

## Base URL

```
http://localhost:8010
```

In production this is the URL set in `APP_URL` (e.g. `https://api.yourdomain.com`).

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

Access tokens expire after 15 minutes (configurable via `JWT_ACCESS_TTL_SECONDS`). Use the refresh endpoint to obtain a new pair.

## Response Format

All responses follow a standard envelope:

```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": {},
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 25,
      "total": 100,
      "totalPages": 4
    }
  },
  "errors": {}
}
```

Error responses always include `"success": false`, an HTTP status code, and a `message`. Validation errors additionally populate the `errors` object with field-keyed messages.

## Pagination

List endpoints accept `?page=N&perPage=N` query parameters. Defaults: page=1, perPage=25, max perPage=100.

## Rate Limiting

Auth and OTP endpoints are rate-limited by IP. Limits are noted per endpoint. Exceeding the limit returns HTTP 429.

---

## Endpoints

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Returns `{ status: "ok" }`. Use for uptime checks. |

---

### Auth

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| POST | `/auth/login` | RateLimit(10/5min) | Login with email+password |
| POST | `/auth/otp/send` | RateLimit(5/5min) | Send OTP to phone for visitor-entry or other purposes |
| POST | `/auth/otp/verify` | RateLimit(10/5min) | Verify OTP code |
| POST | `/auth/refresh` | RateLimit(30/5min) | Refresh access + refresh tokens |
| POST | `/auth/logout` | Auth | Revoke refresh token |
| GET | `/auth/me` | Auth | Get current user profile |
| PUT | `/auth/change-password` | Auth, RateLimit(5/5min) | Change own password |

**POST /auth/login**
```json
Body:    { "email": "admin@officegate.com", "password": "ChangeMe@12345" }
Success: { "accessToken": "...", "refreshToken": "...", "expiresIn": 900, "user": { "id", "name", "email", "role" } }
Error:   401 — invalid credentials
```

**POST /auth/otp/send**
```json
Body:    { "phone": "+919876543210", "purpose": "visitor-entry" }
Success: { "message": "OTP sent" }
```

**POST /auth/otp/verify**
```json
Body:    { "phone": "+919876543210", "purpose": "visitor-entry", "otp": "123456" }
Success: { "message": "OTP verified" }
```

**POST /auth/refresh**
```json
Body:    { "refreshToken": "..." }
Success: { "accessToken": "...", "refreshToken": "..." }
Error:   401 — expired/revoked token
```

**PUT /auth/change-password**
```json
Body:    { "currentPassword": "old", "newPassword": "New@12345" }
Success: 200 — all refresh sessions revoked
Error:   422 — wrong current password
```

---

### UI Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ui-settings?page=dashboard` | Auth | Get stored UI settings for a page |
| PUT | `/ui-settings` | Auth | Save UI settings for a page |

**PUT /ui-settings**
```json
Body: { "page": "dashboard", "settings": { "cards": ["summary"] } }
```

---

### Uploads

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/uploads` | Role: admin,security,tenant, RateLimit(10/1min) | Upload a file (multipart/form-data) |

```
Form fields: file (binary), module (string, e.g. "visitor_photo")
Response:    { "id": "...", "url": "/uploads/..." }
```

---

### Admin — Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/dashboard/summary` | admin | Counts: visitors, vehicles, offices, staff, complaints, invoices |

---

### Admin — Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/notifications` | admin | List notifications (paginated) |
| GET | `/admin/notifications/{id}` | admin | Get single notification |
| PUT | `/admin/notifications/{id}/read` | admin | Mark one notification as read |
| PUT | `/admin/notifications/read-all` | admin | Mark all notifications as read |
| DELETE | `/admin/notifications/{id}` | admin | Delete a notification |
| POST | `/admin/notifications` | admin | Create a notification |

---

### Admin — Offices

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/offices` | admin | List offices (paginated, searchable) |
| POST | `/admin/offices` | admin | Create office |
| GET | `/admin/offices/{id}` | admin | Get office detail |
| PUT | `/admin/offices/{id}` | admin | Update office |
| PATCH | `/admin/offices/{id}/status` | admin | Change office status (Active/Inactive/Vacant) |
| DELETE | `/admin/offices/{id}` | admin | Soft-delete office |

**POST /admin/offices body:**
```json
{
  "block": "BRILEY ONE",
  "floor_number": "3A",
  "company_name": "Acme Corp",
  "contact_person": "John",
  "contact_phone": "+919876543210",
  "allocated_vehicle_count": 3,
  "status": "Active"
}
```

---

### Admin — Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/users` | admin | List managed users |
| POST | `/admin/users` | admin | Create user (admin/security/tenant) |
| PUT | `/admin/users/{id}` | admin | Update user |
| DELETE | `/admin/users/{id}` | admin | Soft-delete user |

---

### Admin — Visitors

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/visitors` | admin,security | List all visitors (paginated) |
| POST | `/admin/visitors/entry` | admin,security | Log visitor entry |
| GET | `/admin/visitors/active` | admin,security | List visitors currently inside |
| GET | `/admin/visitors/{id}` | admin,security | Get visitor detail |
| POST | `/admin/visitors/{id}/checkout` | admin,security | Mark visitor as exited |

**POST /admin/visitors/entry body:**
```json
{
  "name": "Jane Doe",
  "phone": "+919876543210",
  "block": "BRILEY ONE",
  "floor_number": "3A",
  "company_name": "Acme Corp",
  "whom_to_meet": "John Manager",
  "reason": "Meeting"
}
```

Checkout of an already-exited visitor returns HTTP 409.

---

### Admin — Vehicles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/vehicles` | admin,security | List all vehicles (paginated) |
| POST | `/admin/vehicles/entry` | admin,security | Log vehicle entry |
| GET | `/admin/vehicles/active` | admin,security | List vehicles currently inside |
| GET | `/admin/vehicles/{id}` | admin,security | Get vehicle detail |
| POST | `/admin/vehicles/{id}/checkout` | admin,security | Mark vehicle as exited |

Duplicate active vehicle entry (same vehicle_no while Inside) returns HTTP 409.

---

### Admin — Vendors

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/vendors` | admin | List vendors |
| POST | `/admin/vendors` | admin | Create vendor |
| GET | `/admin/vendors/{id}` | admin | Get vendor detail |
| PUT | `/admin/vendors/{id}` | admin | Update vendor |

---

### Admin — Vendor Marketplace

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/vendor-marketplace/dashboard` | admin | Marketplace KPIs |
| GET | `/admin/vendor-marketplace/statistics` | admin | Stats breakdown |
| GET | `/admin/vendor-marketplace/vendors/{id}` | admin | Marketplace vendor detail |
| POST | `/admin/vendor-marketplace/vendors/{id}/verify` | admin | Toggle vendor verified status |
| POST | `/admin/vendor-marketplace/vendors/{id}/feature` | admin | Toggle vendor featured status |
| GET | `/admin/vendor-reviews` | admin | List all reviews |
| POST | `/admin/vendor-reviews/{id}/moderate` | admin | Approve/hide a review |
| GET | `/admin/vendor-bookings` | admin | List all bookings |
| POST | `/admin/vendor-bookings/{id}/status` | admin | Update booking status |
| GET | `/admin/vendor-categories` | admin | List vendor categories |
| POST | `/admin/vendor-categories` | admin | Create vendor category |
| PUT | `/admin/vendor-categories/{id}` | admin | Update category |
| DELETE | `/admin/vendor-categories/{id}` | admin | Delete category |
| POST | `/admin/vendor-services` | admin | Add service to a vendor |
| PUT | `/admin/vendor-services/{id}` | admin | Update service |
| DELETE | `/admin/vendor-services/{id}` | admin | Delete service |
| POST | `/admin/vendor-gallery` | admin | Add gallery image |
| DELETE | `/admin/vendor-gallery/{id}` | admin | Delete gallery image |

---

### Tenant — Vendor Marketplace

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/vendors` | tenant | Browse approved vendors |
| GET | `/tenant/vendor-categories` | tenant | List categories |
| GET | `/tenant/vendors/{id}` | tenant | Vendor profile with reviews |
| GET | `/tenant/vendor-bookings` | tenant | My bookings |
| POST | `/tenant/vendor-bookings` | tenant | Book a vendor |
| POST | `/tenant/vendor-bookings/{id}/cancel` | tenant | Cancel booking |
| POST | `/tenant/vendor-reviews` | tenant | Submit review |

---

### Admin — Staff

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/staff` | admin,security | List staff members |
| POST | `/admin/staff` | admin | Create staff member |
| PUT | `/admin/staff/{id}` | admin | Update staff member |
| POST | `/admin/staff/{id}/attendance` | admin,security | Mark attendance for a date |
| GET | `/admin/staff/attendance/summary` | admin,security | Attendance summary (by date) |

**POST /admin/staff/{id}/attendance body:**
```json
{ "date": "2026-06-30", "status": "P" }
```
Status values: `P` (Present), `A` (Absent), `H` (Holiday)

---

### Admin — Inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/inventory` | admin | List inventory items |
| POST | `/admin/inventory` | admin | Create inventory item |
| PUT | `/admin/inventory/{id}` | admin | Update inventory item |
| POST | `/admin/inventory/{id}/movements` | admin | Record stock movement (in/out) |

---

### Admin — Utilities

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/utilities` | admin | List utility tasks |
| POST | `/admin/utilities` | admin | Create utility task |
| PUT | `/admin/utilities/{id}` | admin | Update utility task |
| POST | `/admin/utilities/{id}/complete` | admin | Mark task as done |

---

### Admin — Finance

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/invoices` | admin | List invoices |
| POST | `/admin/invoices` | admin | Create invoice |
| PUT | `/admin/invoices/{id}` | admin | Update invoice |
| POST | `/admin/invoices/{id}/payments` | admin | Record manual payment |
| GET | `/admin/financials/summary` | admin | Revenue summary |
| GET | `/admin/payments/dashboard` | admin | Razorpay payment dashboard |
| POST | `/admin/invoices/{id}/payment-order` | admin | Create Razorpay order |
| POST | `/admin/invoices/{id}/verify-payment` | admin | Verify Razorpay payment |
| GET | `/admin/invoices/{id}/payment-history` | admin | Payment history for an invoice |
| POST | `/admin/invoices/{id}/retry-payment` | admin | Retry a failed payment |
| POST | `/admin/invoices/{id}/refund` | admin | Initiate Razorpay refund |
| POST | `/payments/webhook` | None (Razorpay signed) | Razorpay webhook receiver |

---

### Admin — Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/reports/{type}` | admin | Generate report CSV/JSON |

Valid `type` values: `visitors`, `vehicles`, `staff-attendance`, `inventory`, `financials`

---

### Admin — Complaints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/complaints` | admin | List all complaints (paginated) |
| GET | `/admin/complaints/{id}` | admin | Complaint detail with history |
| PUT | `/admin/complaints/{id}` | admin | Update complaint |
| DELETE | `/admin/complaints/{id}` | admin | Delete complaint |
| POST | `/admin/complaints/{id}/assign` | admin | Assign to vendor |
| POST | `/admin/complaints/{id}/status` | admin | Update status |

---

### Tenant — Complaints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/complaints` | tenant | List own complaints |
| POST | `/tenant/complaints` | tenant | Submit complaint |
| GET | `/tenant/complaints/{id}` | tenant | Complaint detail |

---

### Admin — Maintenance Requests

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/maintenance-requests` | admin | List all maintenance requests |
| GET | `/admin/maintenance-requests/{id}` | admin | Detail with history |
| PUT | `/admin/maintenance-requests/{id}` | admin | Update request |
| DELETE | `/admin/maintenance-requests/{id}` | admin | Delete request |
| POST | `/admin/maintenance-requests/{id}/assign` | admin | Assign to vendor |
| POST | `/admin/maintenance-requests/{id}/assign-staff` | admin | Assign to staff |
| POST | `/admin/maintenance-requests/{id}/status` | admin | Update status |

---

### Tenant — Maintenance Requests

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/maintenance-requests` | tenant | List own requests |
| POST | `/tenant/maintenance-requests` | tenant | Submit request |
| GET | `/tenant/maintenance-requests/{id}` | tenant | Request detail |
| POST | `/tenant/maintenance-requests/{id}/cancel` | tenant | Cancel request |

---

### Rental Marketplace

**Admin:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/rental/dashboard` | admin | Rental KPIs |
| GET | `/admin/rental/listings` | admin | All listings |
| GET | `/admin/rental/listings/{id}` | admin | Listing detail |
| POST | `/admin/rental/listings/{id}/approve` | admin | Approve listing |
| POST | `/admin/rental/listings/{id}/feature` | admin | Toggle featured |
| DELETE | `/admin/rental/listings/{id}` | admin | Delete listing |

**Tenant:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/rental/listings` | tenant | Browse approved listings |
| GET | `/tenant/rental/listings/{id}` | tenant | Listing detail |
| GET | `/tenant/rental/my-listings` | tenant | Own listings |
| POST | `/tenant/rental/listings` | tenant | Create listing |
| PUT | `/tenant/rental/listings/{id}` | tenant | Update own listing |
| DELETE | `/tenant/rental/listings/{id}` | tenant | Delete own listing |
| POST | `/tenant/rental/listings/{id}/favorite` | tenant | Toggle favorite |
| GET | `/tenant/rental/favorites` | tenant | My favorites |

---

### Business Ads

**Admin:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/business-ads` | admin | List all ads |
| POST | `/admin/business-ads` | admin | Create ad |
| GET | `/admin/business-ads/dashboard` | admin | Ad dashboard |
| GET | `/admin/business-ads/analytics` | admin | Impression/click analytics |
| GET | `/admin/business-ads/billing` | admin | Ad billing records |
| POST | `/admin/business-ads/billing` | admin | Create billing record |
| GET | `/admin/business-ads/billing/summary` | admin | Billing summary |
| GET | `/admin/business-ads/export` | admin | Export ad report |
| GET | `/admin/ad-packages` | admin | List ad packages |
| POST | `/admin/ad-packages` | admin | Create package |
| PUT | `/admin/ad-packages/{id}` | admin | Update package |
| DELETE | `/admin/ad-packages/{id}` | admin | Delete package |
| GET | `/admin/business-ads/{id}` | admin | Ad detail |
| PUT | `/admin/business-ads/{id}` | admin | Update ad |
| DELETE | `/admin/business-ads/{id}` | admin | Delete ad |
| POST | `/admin/business-ads/{id}/status` | admin | Change ad status |
| POST | `/admin/business-ads/{id}/impression` | admin | Record impression |
| POST | `/admin/business-ads/{id}/renewal-reminder` | admin | Send renewal reminder |
| POST | `/admin/business-ads/billing/{id}/pay` | admin | Mark billing as paid |
| GET | `/admin/business-categories` | admin | List business categories |
| POST | `/admin/business-categories` | admin | Create category |
| PUT | `/admin/business-categories/{id}` | admin | Update category |
| DELETE | `/admin/business-categories/{id}` | admin | Delete category |

**Tenant:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/business-ads` | tenant | Browse active ads |
| GET | `/tenant/business-ads/{id}` | tenant | Ad detail |
| POST | `/tenant/business-ads/{id}/click` | tenant | Record click (analytics) |
| GET | `/tenant/business-categories` | tenant | Browse categories |

---

### Announcements

**Admin:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/announcements` | admin | List announcements |
| POST | `/admin/announcements` | admin | Create announcement (draft) |
| GET | `/admin/announcements/{id}` | admin | Announcement detail |
| PUT | `/admin/announcements/{id}` | admin | Update announcement |
| POST | `/admin/announcements/{id}/publish` | admin | Publish announcement |
| DELETE | `/admin/announcements/{id}` | admin | Delete announcement |

**Tenant:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/announcements` | tenant | List published announcements |
| GET | `/tenant/announcements/unread-count` | tenant | Count unread announcements |
| GET | `/tenant/announcements/{id}` | tenant | Announcement detail |
| POST | `/tenant/announcements/{id}/read` | tenant | Mark as read |

---

### Emergency Contacts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/emergency-contacts` | admin | List contacts |
| POST | `/admin/emergency-contacts` | admin | Create contact |
| PUT | `/admin/emergency-contacts/{id}` | admin | Update contact |
| DELETE | `/admin/emergency-contacts/{id}` | admin | Delete contact |
| GET | `/tenant/emergency-contacts` | tenant | View contacts |
| GET | `/security/emergency-contacts` | security,admin | View contacts |

---

### Daily Workers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/daily-workers` | admin,security | List registered workers |
| POST | `/admin/daily-workers` | admin | Register worker |
| GET | `/admin/daily-workers/today-summary` | admin,security | Today's attendance summary |
| GET | `/admin/daily-workers/attendance` | admin,security | Attendance log |
| GET | `/admin/daily-workers/{id}` | admin,security | Worker detail |
| PUT | `/admin/daily-workers/{id}` | admin | Update worker |
| DELETE | `/admin/daily-workers/{id}` | admin | Delete worker |
| POST | `/admin/daily-workers/{id}/qr` | admin | Generate QR code for worker |
| POST | `/admin/worker-attendance` | admin,security | Mark attendance |
| POST | `/admin/worker-entry` | admin,security | Record entry via QR/manual |
| POST | `/admin/worker-exit` | admin,security | Record exit |

---

### Visitor Passes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/visitor-passes` | admin,security | List passes |
| POST | `/admin/visitor-passes` | admin,security | Create visitor pass |
| GET | `/admin/visitor-passes/dashboard` | admin,security | Pass statistics |
| GET | `/admin/visitor-passes/{id}` | admin,security | Pass detail |
| PUT | `/admin/visitor-passes/{id}` | admin,security | Update pass |
| POST | `/admin/visitor-passes/{id}/cancel` | admin,security | Cancel pass |
| POST | `/admin/visitor-passes/{id}/scan` | admin,security | Validate pass via QR scan |
| GET | `/admin/visitor-passes/{id}/download` | admin,security | Download pass as PDF/image |

---

### Community Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/analytics/summary` | admin | Overall community KPIs |
| GET | `/admin/analytics/occupancy` | admin | Office occupancy trends |
| GET | `/admin/analytics/complaints` | admin | Complaints analytics |
| GET | `/admin/analytics/maintenance` | admin | Maintenance analytics |
| GET | `/admin/analytics/vendors` | admin | Vendor marketplace analytics |
| GET | `/admin/analytics/rentals` | admin | Rental marketplace analytics |
| GET | `/admin/analytics/visitors` | admin | Visitor flow analytics |
| GET | `/admin/analytics/revenue` | admin | Revenue analytics |
| GET | `/admin/analytics/daily-workers` | admin | Daily worker analytics |

---

### Community Events

**Admin:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/events` | admin | List events |
| POST | `/admin/events` | admin | Create event |
| GET | `/admin/events/dashboard` | admin | Events KPIs |
| GET | `/admin/events/{id}` | admin | Event detail |
| PUT | `/admin/events/{id}` | admin | Update event |
| POST | `/admin/events/{id}/publish` | admin | Publish event |
| POST | `/admin/events/{id}/cancel` | admin | Cancel event |
| DELETE | `/admin/events/{id}` | admin | Delete event |
| GET | `/admin/events/{id}/registrations` | admin | Event registrations |

**Tenant:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/events` | tenant | Browse published events |
| GET | `/tenant/events/my-registrations` | tenant | My registrations |
| GET | `/tenant/events/{id}` | tenant | Event detail |
| POST | `/tenant/events/{id}/register` | tenant | Register for event |
| POST | `/tenant/events/{id}/cancel-registration` | tenant | Cancel registration |

---

### Secretary Portal

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/secretaries` | admin | List secretaries |
| POST | `/admin/secretaries` | admin | Register secretary |
| GET | `/admin/secretaries/{id}` | admin | Secretary detail |
| PUT | `/admin/secretaries/{id}` | admin | Update secretary |
| POST | `/admin/secretaries/{id}/permissions` | admin | Set secretary permissions |
| DELETE | `/admin/secretaries/{id}` | admin | Deactivate secretary |
| GET | `/secretary/dashboard` | admin | Secretary dashboard view |
| GET | `/secretary/permissions` | admin | Current user's permissions |

---

### CCTV (Camera Management)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/cameras` | admin,security | List cameras |
| POST | `/admin/cameras` | admin | Register camera |
| GET | `/admin/cameras/dashboard` | admin,security | Camera health dashboard |
| GET | `/admin/cameras/{id}` | admin,security | Camera detail |
| PUT | `/admin/cameras/{id}` | admin | Update camera |
| DELETE | `/admin/cameras/{id}` | admin | Delete camera |
| POST | `/admin/cameras/{id}/heartbeat` | admin,security | Update camera online status |
| GET | `/admin/cameras/{id}/events` | admin,security | Camera motion/alert events |
| POST | `/admin/cameras/{id}/events` | admin,security | Create camera event |
| POST | `/admin/camera-events/{id}/acknowledge` | admin,security | Acknowledge alert |
| GET | `/admin/cameras/{id}/snapshots` | admin,security | List snapshots |
| POST | `/admin/cameras/{id}/snapshots` | admin,security | Store snapshot metadata |
| GET | `/admin/cameras/{id}/timeline` | admin,security | Event timeline for camera |

---

### Premium Membership (Subscriptions)

**Admin:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/subscription-plans` | admin | List plans |
| POST | `/admin/subscription-plans` | admin | Create plan |
| PUT | `/admin/subscription-plans/{id}` | admin | Update plan |
| DELETE | `/admin/subscription-plans/{id}` | admin | Delete plan |
| GET | `/admin/subscriptions/dashboard` | admin | Subscription KPIs |
| GET | `/admin/subscriptions` | admin | All subscriptions |
| POST | `/admin/subscriptions` | admin | Create subscription for office |
| GET | `/admin/subscriptions/{id}` | admin | Subscription detail |
| POST | `/admin/subscriptions/{id}/cancel` | admin | Cancel subscription |
| GET | `/admin/premium-features` | admin | List premium features |
| PUT | `/admin/premium-features/{id}` | admin | Update feature flag |

**Tenant:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/subscription/my-plan` | tenant | Current subscription |
| GET | `/tenant/subscription/plans` | tenant | Available plans |
| POST | `/tenant/subscription/upgrade` | tenant | Request upgrade |
| POST | `/tenant/subscription/cancel` | tenant | Cancel own subscription |

---

### Security Portal

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/security/dashboard` | security,admin | Security overview (active visitors/vehicles) |
| GET | `/security/notifications` | security,admin | Security notifications |
| PUT | `/security/notifications/{id}/read` | security,admin | Mark notification read |
| PUT | `/security/notifications/read-all` | security,admin | Mark all read |

---

### Tenant Portal

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenant/dashboard` | tenant | Tenant dashboard |
| GET | `/tenant/notifications` | tenant | Tenant notifications |
| PUT | `/tenant/notifications/{id}/read` | tenant | Mark notification read |
| PUT | `/tenant/notifications/read-all` | tenant | Mark all read |

---

### Public Scan Endpoints (QR Gate Access)

These endpoints do NOT use Bearer tokens. They require an `X-Gate-Token` header with a value matching a gate token seeded in the `gate_tokens` table. The token is embedded in QR code scan-page URLs as a URL fragment (never in the query string or body).

| Method | Path | Gate Token Header | Description |
|--------|------|-------------------|-------------|
| POST | `/public/scan/visitor-entry` | `X-Gate-Token: <token>` | Kiosk visitor entry |
| POST | `/public/scan/visitor-checkout` | `X-Gate-Token: <token>` | Kiosk visitor checkout (requires `checkout_token`) |
| POST | `/public/scan/vehicle-entry` | `X-Gate-Token: <token>` | Kiosk vehicle entry |
| POST | `/public/scan/vehicle-checkout` | `X-Gate-Token: <token>` | Kiosk vehicle checkout (requires `checkout_token`) |

**POST /public/scan/visitor-entry body:**
```json
{
  "name": "Jane Doe",
  "phone": "+919876543210",
  "company_name": "Acme Corp",
  "whom_to_meet": "Reception",
  "reason": "Delivery"
}
```
Response includes a one-time `checkout_token` for the kiosk exit scan.

**POST /public/scan/visitor-checkout body:**
```json
{ "visitor_id": "123", "checkout_token": "<one-time-token>" }
```
Using an invalid or replayed token returns HTTP 401.

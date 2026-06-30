# OfficeGate Database Schema

## Overview

The database uses 21 migration files (001–021). SQLite is used for local development; MySQL 8.0+ is used in production. All text timestamps are stored as ISO-8601 strings (`YYYY-MM-DD HH:MM:SS`). Soft-deletes are used throughout: rows are never physically deleted; `deleted_at IS NULL` is always included in query filters.

---

## Tables

### 001_core.sql

#### users
User accounts for admin, security, and tenant roles.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| name | TEXT | Display name |
| email | TEXT UNIQUE | Login email (nullable if phone-only) |
| phone | TEXT UNIQUE | Phone (nullable if email-only) |
| password_hash | TEXT | bcrypt |
| role | TEXT | `admin`, `security`, `tenant` |
| office_id | INTEGER | FK → offices.id (for tenant users) |
| status | TEXT | `active`, `inactive` |
| created_at, updated_at, deleted_at | TEXT | Timestamps |

#### refresh_tokens
Rotating refresh token store — hashed server-side; cleared on logout/password change.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | FK → users.id |
| token_hash | TEXT UNIQUE | SHA-256 of the issued token |
| expires_at | TEXT | Expiry timestamp |
| revoked_at | TEXT | Set on logout or password change |
| ip_address, user_agent | TEXT | Client metadata |

#### otp_challenges
Short-lived OTP verification challenges.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| phone | TEXT | Target phone number |
| purpose | TEXT | e.g. `visitor-entry` |
| code_hash | TEXT | SHA-256 of the 6-digit code |
| attempts | INTEGER | Failed attempt count |
| expires_at | TEXT | OTP expiry |
| verified_at | TEXT | Set when successfully verified |

#### audit_logs
Immutable record of sensitive mutations (creates, updates, deletes).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | Actor (nullable for system) |
| action | TEXT | e.g. `create`, `update`, `delete` |
| entity_type | TEXT | e.g. `visitor`, `invoice` |
| entity_id | INTEGER | Target record ID |
| ip_address | TEXT | |
| metadata | TEXT | JSON blob of changed fields |

---

### 002_operations.sql

#### offices
Physical office/unit registry in the building.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| block | TEXT | Building block name |
| floor_number | TEXT | Floor/unit identifier |
| company_name | TEXT | Tenant company |
| contact_person, contact_phone, contact_email | TEXT | |
| allocated_vehicle_count | INTEGER | Parking slots assigned |
| used_vehicle_count | INTEGER | Current active vehicles |
| status | TEXT | `Active`, `Inactive`, `Vacant` |

#### visitors
Visitor entry/exit log.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name, phone | TEXT | Visitor identity |
| block, floor_number, company_name | TEXT | Destination office |
| whom_to_meet | TEXT | Host name |
| reason | TEXT | Purpose of visit |
| status | TEXT | `Inside`, `Exited` |
| entry_time, exit_time | TEXT | Timestamps |
| guard_name | TEXT | Security staff who logged entry |
| photo_url | TEXT | Upload reference |
| public_checkout_token_hash | TEXT | Hash of one-time checkout token |
| public_checkout_token_expires_at | TEXT | Token expiry |

#### vehicles
Vehicle entry/exit log.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| vehicle_no | TEXT | Normalised plate number |
| vehicle_type | TEXT | `2-Wheeler`, `4-Wheeler`, etc. |
| owner_name | TEXT | |
| block, floor_number, company_name | TEXT | Associated office |
| parking_user_type | TEXT | `Visitor`, `Employee`, `Vendor` |
| status | TEXT | `Inside`, `Exited` |
| entry_time, exit_time | TEXT | |
| public_checkout_token_hash, public_checkout_token_expires_at | TEXT | Kiosk checkout tokens |

#### vendors
Vendor/service-provider directory.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | Contact name |
| company | TEXT | Company name |
| service_type | TEXT | Service description |
| category | TEXT | `Regular Maintenance`, `Utility Providers`, `Ad-Hoc Vendors` |
| contact | TEXT | Phone number |
| status | TEXT | `Active`, `Inactive` |

#### staff
On-site staff members.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | |
| role | TEXT | `Security`, `Housekeeping`, etc. |
| department | TEXT | |
| contact | TEXT | Phone |
| join_date | TEXT | ISO date |
| status | TEXT | `Active`, `Inactive` |

#### staff_attendance
Daily attendance records (one row per staff per date).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| staff_id | INTEGER | FK → staff.id |
| date | TEXT | YYYY-MM-DD |
| status | TEXT | `P`, `A`, `H` |

#### inventory_items
Asset and consumable stock.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| item_name | TEXT | |
| category | TEXT | `Electrical`, `Plumbing`, `Cleaning`, `Safety`, `General` |
| quantity | INTEGER | Current stock |
| unit_cost | REAL | |
| vendor | TEXT | Supplier name |
| purchase_date | TEXT | |
| used_quantity | INTEGER | |
| location, used_by | TEXT | Last movement info |

#### utility_tasks
Scheduled maintenance/utility activities.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| description | TEXT | |
| type | TEXT | `Sump Cleaning`, `Drainage`, `Lift`, `Electrical`, etc. |
| scheduled_date | TEXT | |
| last_completed | TEXT | |
| status | TEXT | `Upcoming`, `Overdue`, `Done` |
| assigned_staff | TEXT | |

#### invoices
Billing records for offices.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| office_id | INTEGER | FK → offices.id |
| invoice_no | TEXT UNIQUE | |
| description | TEXT | |
| amount | REAL | |
| paid_amount | REAL | |
| due_date | TEXT | |
| status | TEXT | `Pending`, `Partial`, `Paid`, `Overdue` |

#### invoice_payments
Individual payment transactions against an invoice.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| invoice_id | INTEGER | FK → invoices.id |
| amount | REAL | |
| mode | TEXT | `cash`, `bank_transfer`, `cheque`, `online` |
| reference_no | TEXT | |
| paid_at | TEXT | |

---

### 003_business.sql

#### gate_tokens
Tokens for the public QR scan endpoints (kiosk access control).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| token | TEXT UNIQUE | Plain token (dev: `dev-visitor-entry-token`) |
| purpose | TEXT | `visitor-entry`, `visitor-checkout`, `vehicle-entry`, `vehicle-checkout` |
| label | TEXT | Human-readable name |
| status | TEXT | `active`, `inactive` |

---

### 004_public_checkout_tokens.sql

Adds `public_checkout_token_hash` and `public_checkout_token_expires_at` columns to the `visitors` and `vehicles` tables (ALTER TABLE migration).

---

### 005_complaints.sql

#### complaints
Tenant-submitted complaint tickets.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| tenant_id | INTEGER | FK → users.id |
| office_id | INTEGER | FK → offices.id |
| category | TEXT | `Plumbing`, `Electrical`, `Cleaning`, etc. |
| subject | TEXT | |
| description | TEXT | |
| priority | TEXT | `Low`, `Medium`, `High`, `Emergency` |
| status | TEXT | `Open`, `Assigned`, `In Progress`, `Resolved`, `Closed` |
| assigned_vendor_id | INTEGER | FK → vendors.id |
| attachment_id | INTEGER | FK → attachments |

#### complaint_history
Status change audit trail for complaints.

| Column | Type | Notes |
|--------|------|-------|
| complaint_id | INTEGER | FK → complaints.id |
| updated_by | INTEGER | FK → users.id |
| old_status, new_status | TEXT | |
| remarks | TEXT | |

---

### 006_notifications.sql

#### notifications
In-app notifications for all roles.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | FK → users.id (recipient) |
| type | TEXT | Notification category |
| title | TEXT | |
| message | TEXT | |
| data | TEXT | JSON payload for deep linking |
| is_read | INTEGER | Boolean (0/1) |
| read_at | TEXT | |

---

### 007_maintenance_requests.sql

#### maintenance_requests
Tenant-submitted maintenance tickets.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| tenant_id | INTEGER | FK → users.id |
| office_id | INTEGER | FK → offices.id |
| category | TEXT | Maintenance category |
| title | TEXT | |
| description | TEXT | |
| priority | TEXT | `Low`–`Emergency` |
| status | TEXT | `Open`, `Assigned`, `In Progress`, `Completed`, `Cancelled` |
| assigned_vendor_id | INTEGER | FK → vendors.id |
| assigned_staff_id | INTEGER | FK → staff.id |
| expected_completion, completed_at | TEXT | |

#### maintenance_history
Status change audit trail for maintenance requests.

---

### 008_vendor_marketplace.sql

#### vendor_marketplace_categories
Marketplace service categories (Plumbing, Electrical, etc.)

#### vendor_marketplace (extends vendors)
Adds marketplace fields: `description`, `service_area`, `availability`, `rating_avg`, `review_count`, `booking_count`, `is_verified`, `is_featured`.

#### vendor_services
Individual services offered by a vendor (name, price, unit).

#### vendor_gallery
Vendor photo gallery (FK → attachments).

#### vendor_bookings
Tenant bookings of a vendor service. FK → vendor_marketplace, users.

#### vendor_reviews
Tenant reviews for completed bookings. Includes `rating` (1–5), `title`, `comment`, `status` (Pending/Approved/Hidden).

---

### 009_rental_marketplace.sql

#### rental_listings
Rental listings created by tenant users.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| tenant_id | INTEGER | FK → users.id |
| title | TEXT | |
| listing_type | TEXT | `rental`, `sale`, `lease` |
| property_type | TEXT | `apartment`, `office`, `shop`, etc. |
| area_sqft | REAL | |
| rent_amount | REAL | |
| deposit_amount | REAL | |
| location | TEXT | |
| status | TEXT | `Draft`, `Pending`, `Active`, `Inactive` |
| is_featured | INTEGER | Admin toggle |
| views_count | INTEGER | |

#### rental_listing_favorites
Tenant favorites for rental listings (tenant_id + listing_id).

---

### 010_business_ads.sql

#### business_ads
Local business advertisement listings.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| business_name | TEXT | |
| category_id | INTEGER | FK → business_categories.id |
| description | TEXT | |
| contact_phone, contact_email | TEXT | |
| ad_type | TEXT | `banner`, `listing`, `featured` |
| status | TEXT | `Active`, `Inactive`, `Expired` |
| start_date, end_date | TEXT | |
| impression_count, click_count | INTEGER | Analytics |

#### business_categories
Categories for business ads.

---

### 011_announcements.sql

#### announcements
Building-wide announcements from admin to tenants.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| title, body | TEXT | |
| type | TEXT | `General`, `Emergency`, `Maintenance`, `Event` |
| status | TEXT | `Draft`, `Published`, `Archived` |
| published_at | TEXT | |
| created_by | INTEGER | FK → users.id |

#### announcement_reads
Read receipts per tenant user (announcement_id + user_id).

---

### 012_emergency_contacts.sql

#### emergency_contacts
Building emergency contact directory.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | Contact name |
| role | TEXT | e.g. `Fire Department`, `Building Manager` |
| phone | TEXT | |
| alternate_phone | TEXT | |
| category | TEXT | `Internal`, `External`, `Medical`, `Police`, `Fire` |
| is_active | INTEGER | |
| display_order | INTEGER | Sort order |

---

### 013_daily_workers.sql

#### daily_workers
Registered daily/contract workers (maids, delivery staff).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | |
| type | TEXT | `Maid`, `Delivery`, `Electrician`, etc. |
| phone | TEXT | |
| id_proof_type, id_proof_no | TEXT | |
| office_id | INTEGER | Associated office |
| qr_code | TEXT | Generated QR payload |

#### worker_attendance
Daily attendance entries for daily workers.

| Column | Type | Notes |
|--------|------|-------|
| worker_id | INTEGER | FK → daily_workers.id |
| date | TEXT | |
| entry_time, exit_time | TEXT | |
| status | TEXT | `Present`, `Absent` |

---

### 014_secretary_permissions.sql

#### secretary_permissions
Per-user permission assignments for the secretary portal.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | FK → users.id |
| module | TEXT | e.g. `visitors`, `complaints`, `announcements` |
| can_view, can_create, can_update, can_delete | INTEGER | Boolean flags |

---

### 015_visitor_passes.sql

#### visitor_passes
Pre-authorized visitor passes issued by tenants/admin.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| office_id | INTEGER | FK → offices.id |
| visitor_name, visitor_phone | TEXT | |
| valid_from, valid_until | TEXT | Pass window |
| pass_code | TEXT UNIQUE | QR payload |
| status | TEXT | `Active`, `Used`, `Expired`, `Cancelled` |
| scanned_at | TEXT | Scan timestamp |
| created_by | INTEGER | FK → users.id |

---

### 016_community_events.sql

#### community_events
Building events created by admin.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| title | TEXT | |
| description | TEXT | |
| event_type | TEXT | `Social`, `Sports`, `Meeting`, `Festival`, etc. |
| start_time, end_time | TEXT | |
| venue | TEXT | |
| max_capacity | INTEGER | |
| registration_required | INTEGER | |
| status | TEXT | `Draft`, `Published`, `Cancelled`, `Completed` |

#### event_registrations
Tenant registrations for community events.

| Column | Type | Notes |
|--------|------|-------|
| event_id | INTEGER | FK → community_events.id |
| user_id | INTEGER | FK → users.id |
| status | TEXT | `Registered`, `Cancelled` |
| registered_at | TEXT | |

---

### 017_cctv.sql

#### camera_devices
Registered IP cameras.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | Camera label |
| location | TEXT | Physical location |
| rtsp_url | TEXT | Stream URL (architecture only) |
| type | TEXT | `indoor`, `outdoor`, `entrance`, `parking` |
| status | TEXT | `Online`, `Offline`, `Maintenance` |
| last_heartbeat | TEXT | Last ping timestamp |

#### camera_events
Motion/alert events detected by cameras.

| Column | Type | Notes |
|--------|------|-------|
| camera_id | INTEGER | FK → camera_devices.id |
| event_type | TEXT | `motion`, `face`, `intrusion`, `tamper` |
| severity | TEXT | `low`, `medium`, `high` |
| acknowledged_at | TEXT | |
| acknowledged_by | INTEGER | FK → users.id |

#### camera_snapshots
Stored snapshot metadata (actual files stored externally/in uploads).

---

### 018_premium_membership.sql

#### subscription_plans
Membership tiers available for tenants.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | `Basic`, `Standard`, `Premium` |
| price | REAL | Monthly price |
| duration_months | INTEGER | |
| max_visitors, max_vehicles | INTEGER | Usage limits |
| features | TEXT | JSON array of feature names |

#### subscriptions
Active/past subscriptions per office.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| office_id | INTEGER | FK → offices.id |
| plan_id | INTEGER | FK → subscription_plans.id |
| status | TEXT | `Active`, `Expired`, `Cancelled` |
| start_date, end_date | TEXT | |
| auto_renew | INTEGER | |

#### premium_features
Feature-flag registry for premium capabilities.

---

### 019_ad_billing.sql

#### ad_packages
Pricing packages for business ads.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | Package name |
| duration_days | INTEGER | |
| price | REAL | |
| max_impressions | INTEGER | |
| features | TEXT | JSON |

#### ad_billing_records
Billing history for business ads.

| Column | Type | Notes |
|--------|------|-------|
| ad_id | INTEGER | FK → business_ads.id |
| package_id | INTEGER | FK → ad_packages.id |
| amount | REAL | |
| status | TEXT | `Pending`, `Paid`, `Overdue` |
| due_date, paid_at | TEXT | |

---

### 020_razorpay_payments.sql

#### payment_transactions
Razorpay payment records.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| invoice_id | INTEGER | FK → invoices.id |
| razorpay_order_id | TEXT | Order from Razorpay API |
| razorpay_payment_id | TEXT | Payment ID after capture |
| amount | REAL | |
| currency | TEXT | Default: `INR` |
| status | TEXT | `created`, `captured`, `failed`, `refunded` |
| method | TEXT | `card`, `upi`, `netbanking`, etc. |
| webhook_verified | INTEGER | Signature verified flag |

---

### 021_performance_indexes.sql

Additional composite indexes on high-traffic query paths:
- `visitors(status, entry_time)`
- `vehicles(status, entry_time)`
- `complaints(status, created_at)`
- `notifications(user_id, is_read)`
- `worker_attendance(worker_id, date)`
- `invoice_payments(invoice_id)`
- And several others for analytics aggregation queries.

---

## Relationships Summary

```
users ──< refresh_tokens
users ──< notifications
users ──< complaints (as tenant)
users ──< maintenance_requests (as tenant)
users ──< vendor_bookings
users ──< vendor_reviews
users ──< rental_listings
users ──< event_registrations
users ──< secretary_permissions
offices ──< invoices
offices ──< subscriptions
offices ── users (tenant.office_id)
vendors ──< vendor_services
vendors ──< vendor_gallery
vendors ──< vendor_bookings
community_events ──< event_registrations
camera_devices ──< camera_events
camera_devices ──< camera_snapshots
business_ads ──< ad_billing_records
invoices ──< invoice_payments
invoices ──< payment_transactions
visitor_passes ── offices
daily_workers ──< worker_attendance
```

## Soft-Delete Pattern

All primary tables include a `deleted_at TEXT` column. Records are never physically deleted. All `CrudModel::find()`, `list()`, and `count()` queries automatically append `WHERE deleted_at IS NULL`.

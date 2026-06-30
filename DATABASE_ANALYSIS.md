# DATABASE ANALYSIS — OfficeGate

> Schema source: `backend/database/migrations/001–004`. Dev engine SQLite; prod MySQL (`database/officegate_production.sql`).
> Types below are the SQLite declared types; in MySQL these map to VARCHAR/TEXT/INT/DECIMAL/DATETIME equivalently. Generated 2026-06-30.

---

## All Tables (21)

### 1. `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL | |
| email | TEXT UNIQUE | |
| phone | TEXT UNIQUE | |
| password_hash | TEXT NOT NULL | bcrypt |
| role | TEXT NOT NULL | CHECK in ('admin','security','tenant') |
| office_id | INTEGER | → offices.id (tenant link; no FK declared) |
| status | TEXT NOT NULL DEFAULT 'active' | CHECK ('active','inactive') |
| created_at / updated_at / deleted_at | TEXT | soft delete |

### 2. `refresh_tokens`
id PK · user_id NOT NULL **FK→users.id** · token_hash TEXT UNIQUE (sha256) · expires_at NOT NULL · revoked_at · ip_address · user_agent · created_at NOT NULL.

### 3. `otp_challenges`
id PK · phone NOT NULL · purpose NOT NULL · code_hash NOT NULL · attempts INT DEFAULT 0 · expires_at NOT NULL · verified_at · created_at NOT NULL. Index `idx_otp_phone_purpose(phone,purpose,expires_at)`.

### 4. `audit_logs`
id PK · user_id · action NOT NULL · entity_type NOT NULL · entity_id · ip_address · user_agent · metadata (JSON text) · created_at NOT NULL. Index `idx_audit_logs_entity(entity_type,entity_id)`.

### 5. `offices`
id PK · block NOT NULL · floor_number NOT NULL · company_name NOT NULL · contact_person · contact_phone · contact_email · allocated_vehicle_count INT DEFAULT 0 · used_vehicle_count INT DEFAULT 0 · status DEFAULT 'Active' CHECK('Active','Inactive','Vacant') · created/updated/deleted_at. **UNIQUE(block,floor_number,company_name)**.

### 6. `visitors`
id PK · name, phone NOT NULL · gender, address, city, pincode · office_id **FK→offices.id** · block, floor_number · company_name NOT NULL · whom_to_meet NOT NULL · reason NOT NULL · vehicle_type, vehicle_no · status DEFAULT 'Inside' CHECK('Inside','Exited') · entry_time NOT NULL · exit_time · guard_name · remarks · created/updated/deleted_at · **public_checkout_token_hash / _expires_at / _used_at** (migration 004). Indexes: `idx_visitors_status(status,entry_time)`, `idx_visitors_public_checkout_token(...)`.

### 7. `visitor_movements`
id PK · visitor_id NOT NULL **FK→visitors.id** · movement_type CHECK('entry','checkout') · occurred_at NOT NULL · actor_user_id · created_at.

### 8. `vehicles`
id PK · vehicle_no NOT NULL · vehicle_no_normalized NOT NULL · vehicle_type NOT NULL · vehicle_model · owner_name · office_id **FK→offices.id** · block, floor_number, company_name · parking_user_type · status DEFAULT 'Inside' CHECK('Inside','Exited') · entry_time NOT NULL · exit_time · created/updated/deleted_at · **public_checkout_token_***. Indexes: `idx_vehicles_status(status,entry_time)`, `idx_vehicles_active_no(vehicle_no_normalized,status)`, `idx_vehicles_public_checkout_token(...)`.

### 9. `vehicle_movements`
id PK · vehicle_id NOT NULL **FK→vehicles.id** · movement_type CHECK('entry','checkout') · occurred_at · actor_user_id · created_at.

### 10. `staff`
id PK · name, role, department, contact NOT NULL · join_date NOT NULL · status DEFAULT 'Active' · created/updated/deleted_at.

### 11. `staff_attendance`
id PK · staff_id NOT NULL **FK→staff.id** · attendance_date NOT NULL · status CHECK('P','A','H') · marked_by · created/updated_at · **UNIQUE(staff_id,attendance_date)**.

### 12. `vendors`
id PK · name, company, service_type, category, contact NOT NULL · last_visit · next_visit · status DEFAULT 'Active' · created/updated/deleted_at.

### 13. `inventory_items`
id PK · item_name, category NOT NULL · quantity INT DEFAULT 0 · unit_cost REAL DEFAULT 0 · vendor · purchase_date · used_quantity INT DEFAULT 0 · location · used_by · created/updated/deleted_at.

### 14. `inventory_movements`
id PK · inventory_item_id NOT NULL **FK→inventory_items.id** · movement_type CHECK('in','out','adjust') · quantity NOT NULL · location · used_by · notes · actor_user_id · created_at.

### 15. `utility_tasks`
id PK · description, type NOT NULL · scheduled_date NOT NULL · last_completed · status DEFAULT 'Upcoming' CHECK('Upcoming','Overdue','Done') · assigned_staff · notes · created/updated/deleted_at.

### 16. `invoices`
id PK · office_id **FK→offices.id** · invoice_no TEXT UNIQUE NOT NULL · description · amount REAL NOT NULL · paid_amount REAL DEFAULT 0 · due_date · status DEFAULT 'Pending' CHECK('Pending','Paid','Overdue','Cancelled') · created/updated/deleted_at.

### 17. `payments`
id PK · invoice_id NOT NULL **FK→invoices.id** · amount NOT NULL · paid_at NOT NULL · mode · reference_no · actor_user_id · created_at.

### 18. `gate_tokens`
id PK · name NOT NULL · scope NOT NULL · token_hash TEXT UNIQUE NOT NULL · status DEFAULT 'active' · expires_at NOT NULL · created_at.

### 19. `ui_settings`
id PK · user_id NOT NULL **FK→users.id** · page_key NOT NULL · settings_json NOT NULL · created/updated_at · **UNIQUE(user_id,page_key)**.

### 20. `attachments`
id PK · module NOT NULL · original_name NOT NULL · stored_path NOT NULL · mime_type NOT NULL · size_bytes NOT NULL · uploaded_by **FK→users.id** · created_at.

### 21. `idempotency_keys`
id PK · idempotency_key TEXT UNIQUE NOT NULL · user_id · route NOT NULL · request_hash NOT NULL · response_json · created_at · expires_at NOT NULL.

---

## Relationships (Foreign Keys)

| Child | Column | Parent |
|---|---|---|
| refresh_tokens | user_id | users |
| ui_settings | user_id | users |
| attachments | uploaded_by | users |
| visitors | office_id | offices |
| vehicles | office_id | offices |
| invoices | office_id | offices |
| visitor_movements | visitor_id | visitors |
| vehicle_movements | vehicle_id | vehicles |
| staff_attendance | staff_id | staff |
| inventory_movements | inventory_item_id | inventory_items |
| payments | invoice_id | invoices |

**Implicit (not declared as FK):** `users.office_id → offices.id`; `*.actor_user_id → users.id` (visitor_movements, vehicle_movements, inventory_movements, payments); `staff_attendance.marked_by → users.id`; `audit_logs.user_id → users.id`; `idempotency_keys.user_id → users.id`.

---

## ER Diagram

```mermaid
erDiagram
    users ||--o{ refresh_tokens : has
    users ||--o{ ui_settings : has
    users ||--o{ attachments : uploads
    users ||--o{ audit_logs : performs
    offices ||--o{ users : tenant_of
    offices ||--o{ visitors : hosts
    offices ||--o{ vehicles : parks
    offices ||--o{ invoices : billed
    visitors ||--o{ visitor_movements : logs
    vehicles ||--o{ vehicle_movements : logs
    staff ||--o{ staff_attendance : records
    inventory_items ||--o{ inventory_movements : tracks
    invoices ||--o{ payments : receives
    gate_tokens }o--|| visitors : "authorizes scan"
    otp_challenges }o--|| users : "verifies phone"

    users { int id PK; text name; text email UK; text phone UK; text role; int office_id FK; text status }
    offices { int id PK; text block; text floor_number; text company_name; text status }
    visitors { int id PK; text name; text phone; int office_id FK; text status; text entry_time; text exit_time }
    vehicles { int id PK; text vehicle_no; text vehicle_no_normalized; int office_id FK; text status }
    staff { int id PK; text name; text department; text status }
    staff_attendance { int id PK; int staff_id FK; text attendance_date; text status }
    vendors { int id PK; text name; text company; text status }
    inventory_items { int id PK; text item_name; int quantity; real unit_cost }
    utility_tasks { int id PK; text description; text scheduled_date; text status }
    invoices { int id PK; int office_id FK; text invoice_no UK; real amount; real paid_amount; text status }
    payments { int id PK; int invoice_id FK; real amount; text paid_at }
    gate_tokens { int id PK; text scope; text token_hash UK; text expires_at }
    refresh_tokens { int id PK; int user_id FK; text token_hash UK; text expires_at }
    ui_settings { int id PK; int user_id FK; text page_key; text settings_json }
    attachments { int id PK; text module; text stored_path; int uploaded_by FK }
    audit_logs { int id PK; int user_id; text action; text entity_type }
    otp_challenges { int id PK; text phone; text purpose; text code_hash }
    idempotency_keys { int id PK; text idempotency_key UK; text route }
```

---

## Missing Indexes (recommended)

| Table | Suggested index | Why |
|---|---|---|
| users | (office_id), (role,status), (deleted_at) | tenant lookup, role lists, soft-delete filter |
| visitors | (office_id), (phone), (deleted_at) | host filtering, repeat-visitor lookup |
| vehicles | (office_id), (vehicle_no_normalized) general | per-office & history search |
| invoices | (office_id,status), (due_date), (status) | tenant statements, overdue sweeps |
| payments | (invoice_id), (paid_at) | invoice payment history, reporting |
| visitor_movements / vehicle_movements | (visitor_id/vehicle_id), (occurred_at) | timeline queries |
| staff_attendance | (attendance_date) | daily attendance reports |
| refresh_tokens | (user_id,revoked_at), (expires_at) | active-token & cleanup queries |
| audit_logs | (user_id), (created_at) | per-user audit, retention |
| All soft-deletable tables | (deleted_at) | every list query filters `deleted_at IS NULL` |

> Note: most FK columns are unindexed. On MySQL/InnoDB, indexing every FK is strongly advised.

---

## Missing / Suggested Tables (future modules)

| Table | Purpose | Status |
|---|---|---|
| `complaints` + `complaint_updates` | Tenant complaint flow (currently mock-only in frontend) | **Missing — needed now** |
| `notifications` | Persisted in-app/push/email notifications | Missing |
| `daily_workers` / `worker_attendance` | `dailyWorkers` is mock-only | Missing |
| `emergency_contacts` | `emergencyContacts` is mock-only | Missing |
| `announcements` / `notices` | Building notices to tenants | Suggested |
| `parking_slots` / `parking_allocations` | Normalize parking vs the count columns on `offices` | Suggested |
| `payment_gateway_transactions` | If Stripe is wired (currently unused dep) | Suggested |
| `roles` / `permissions` | If RBAC grows past the 3-role CHECK enum | Suggested |
| `maintenance_requests` | Distinct from utility_tasks (tenant-raised) | Suggested |

---

## Data Integrity Observations

- Roles/status use CHECK constraints — good, but `role` enum is closed; adding roles needs a migration.
- Soft delete (`deleted_at`) is consistent across business tables — ensure every query filters it.
- `vehicle_no_normalized` enables dedupe; ensure it's populated on every insert/update.
- `idempotency_keys` exists — confirm write endpoints actually consult it (infra is present).

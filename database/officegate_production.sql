-- OfficeGate production schema for MySQL 8+ / MariaDB 10.5+.
-- Import into an empty database:
--   mysql -u <user> -p officegate < database/officegate_production.sql

SET NAMES utf8mb4;
SET time_zone = '+05:30';
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(32) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','security','tenant') NOT NULL,
  office_id BIGINT UNSIGNED NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  KEY idx_users_role_status (role, status),
  KEY idx_users_office_id (office_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  block VARCHAR(120) NOT NULL,
  floor_number VARCHAR(80) NOT NULL,
  company_name VARCHAR(190) NOT NULL,
  contact_person VARCHAR(160) NULL,
  contact_phone VARCHAR(32) NULL,
  contact_email VARCHAR(190) NULL,
  allocated_vehicle_count INT NOT NULL DEFAULT 0,
  used_vehicle_count INT NOT NULL DEFAULT 0,
  status ENUM('Active','Inactive','Vacant') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offices_location_company (block, floor_number, company_name),
  KEY idx_offices_status (status),
  KEY idx_offices_company (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD CONSTRAINT fk_users_office_id FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_hash (token_hash),
  KEY idx_refresh_tokens_user (user_id),
  KEY idx_refresh_tokens_valid (token_hash, revoked_at, expires_at),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_challenges (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone VARCHAR(32) NOT NULL,
  purpose VARCHAR(64) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_otp_phone_purpose (phone, purpose, expires_at),
  KEY idx_otp_cleanup (expires_at, verified_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_audit_logs_user (user_id),
  KEY idx_audit_logs_entity (entity_type, entity_id),
  KEY idx_audit_logs_action (action, created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  gender VARCHAR(24) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(120) NULL,
  pincode VARCHAR(16) NULL,
  office_id BIGINT UNSIGNED NULL,
  block VARCHAR(120) NULL,
  floor_number VARCHAR(80) NULL,
  company_name VARCHAR(190) NOT NULL,
  whom_to_meet VARCHAR(160) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  vehicle_type VARCHAR(40) NULL,
  vehicle_no VARCHAR(40) NULL,
  status ENUM('Inside','Exited') NOT NULL DEFAULT 'Inside',
  entry_time DATETIME NOT NULL,
  exit_time DATETIME NULL,
  guard_name VARCHAR(160) NULL,
  remarks TEXT NULL,
  public_checkout_token_hash CHAR(64) NULL,
  public_checkout_token_expires_at DATETIME NULL,
  public_checkout_used_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_visitors_status (status, entry_time),
  KEY idx_visitors_phone (phone),
  KEY idx_visitors_office (office_id),
  KEY idx_visitors_company (company_name),
  KEY idx_visitors_public_checkout_token (public_checkout_token_hash, public_checkout_used_at, public_checkout_token_expires_at),
  CONSTRAINT fk_visitors_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitor_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  visitor_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('entry','checkout') NOT NULL,
  occurred_at DATETIME NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_visitor_movements_visitor (visitor_id, occurred_at),
  KEY idx_visitor_movements_actor (actor_user_id),
  CONSTRAINT fk_visitor_movements_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
  CONSTRAINT fk_visitor_movements_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_no VARCHAR(40) NOT NULL,
  vehicle_no_normalized VARCHAR(40) NOT NULL,
  vehicle_type VARCHAR(40) NOT NULL,
  vehicle_model VARCHAR(120) NULL,
  owner_name VARCHAR(160) NULL,
  office_id BIGINT UNSIGNED NULL,
  block VARCHAR(120) NULL,
  floor_number VARCHAR(80) NULL,
  company_name VARCHAR(190) NULL,
  parking_user_type VARCHAR(40) NULL,
  status ENUM('Inside','Exited') NOT NULL DEFAULT 'Inside',
  entry_time DATETIME NOT NULL,
  exit_time DATETIME NULL,
  public_checkout_token_hash CHAR(64) NULL,
  public_checkout_token_expires_at DATETIME NULL,
  public_checkout_used_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_vehicles_status (status, entry_time),
  KEY idx_vehicles_active_no (vehicle_no_normalized, status),
  KEY idx_vehicles_office (office_id),
  KEY idx_vehicles_public_checkout_token (public_checkout_token_hash, public_checkout_used_at, public_checkout_token_expires_at),
  CONSTRAINT fk_vehicles_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('entry','checkout') NOT NULL,
  occurred_at DATETIME NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_vehicle_movements_vehicle (vehicle_id, occurred_at),
  KEY idx_vehicle_movements_actor (actor_user_id),
  CONSTRAINT fk_vehicle_movements_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle_movements_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(80) NOT NULL,
  department VARCHAR(120) NOT NULL,
  contact VARCHAR(32) NOT NULL,
  join_date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_staff_department (department),
  KEY idx_staff_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_attendance (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  staff_id BIGINT UNSIGNED NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('P','A','H') NOT NULL,
  marked_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_attendance_date (staff_id, attendance_date),
  KEY idx_staff_attendance_date (attendance_date, status),
  KEY idx_staff_attendance_marked_by (marked_by),
  CONSTRAINT fk_staff_attendance_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_attendance_marked_by FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  company VARCHAR(190) NOT NULL,
  service_type VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  contact VARCHAR(32) NOT NULL,
  last_visit DATE NULL,
  next_visit DATE NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_vendors_category (category),
  KEY idx_vendors_status (status),
  KEY idx_vendors_company (company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_name VARCHAR(190) NOT NULL,
  category VARCHAR(80) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  vendor VARCHAR(190) NULL,
  purchase_date DATE NULL,
  used_quantity INT NOT NULL DEFAULT 0,
  location VARCHAR(190) NULL,
  used_by VARCHAR(160) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_inventory_category (category),
  KEY idx_inventory_vendor (vendor),
  KEY idx_inventory_item_name (item_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inventory_item_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('in','out','adjust') NOT NULL,
  quantity INT NOT NULL,
  location VARCHAR(190) NULL,
  used_by VARCHAR(160) NULL,
  notes TEXT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_inventory_movements_item (inventory_item_id, created_at),
  KEY idx_inventory_movements_actor (actor_user_id),
  CONSTRAINT fk_inventory_movements_item FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_movements_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS utility_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  description VARCHAR(255) NOT NULL,
  type VARCHAR(80) NOT NULL,
  scheduled_date DATE NOT NULL,
  last_completed DATE NULL,
  status ENUM('Upcoming','Overdue','Done') NOT NULL DEFAULT 'Upcoming',
  assigned_staff VARCHAR(160) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_utility_tasks_status (status, scheduled_date),
  KEY idx_utility_tasks_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  office_id BIGINT UNSIGNED NULL,
  invoice_no VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  due_date DATE NULL,
  status ENUM('Pending','Paid','Overdue','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoices_invoice_no (invoice_no),
  KEY idx_invoices_office (office_id),
  KEY idx_invoices_status (status, due_date),
  CONSTRAINT fk_invoices_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_at DATETIME NOT NULL,
  mode VARCHAR(80) NULL,
  reference_no VARCHAR(120) NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_payments_invoice (invoice_id),
  KEY idx_payments_actor (actor_user_id),
  KEY idx_payments_paid_at (paid_at),
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gate_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  scope ENUM('visitor-entry','visitor-checkout','vehicle-entry','vehicle-checkout') NOT NULL,
  token_hash CHAR(64) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gate_tokens_hash (token_hash),
  KEY idx_gate_tokens_scope_status (scope, status, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ui_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  page_key VARCHAR(120) NOT NULL,
  settings_json JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ui_settings_user_page (user_id, page_key),
  CONSTRAINT fk_ui_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module VARCHAR(80) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_attachments_module (module),
  KEY idx_attachments_uploaded_by (uploaded_by),
  CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  idempotency_key VARCHAR(190) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  route VARCHAR(190) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  response_json JSON NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_idempotency_key (idempotency_key),
  KEY idx_idempotency_user (user_id),
  KEY idx_idempotency_expiry (expires_at),
  CONSTRAINT fk_idempotency_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS migrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  migration VARCHAR(190) NOT NULL,
  ran_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_migrations_name (migration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

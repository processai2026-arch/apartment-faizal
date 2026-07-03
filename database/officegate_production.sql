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
  is_secretary TINYINT(1) NOT NULL DEFAULT 0,
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
  description TEXT NULL,
  service_area VARCHAR(255) NULL,
  availability VARCHAR(255) NULL,
  rating_avg DECIMAL(4,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  booking_count INT NOT NULL DEFAULT 0,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  category_id BIGINT UNSIGNED NULL,
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
  razorpay_order_id VARCHAR(128) NULL,
  razorpay_payment_id VARCHAR(128) NULL,
  razorpay_signature VARCHAR(255) NULL,
  payment_method VARCHAR(64) NULL,
  payment_gateway_status VARCHAR(64) NULL,
  payment_initiated_at DATETIME NULL,
  payment_completed_at DATETIME NULL,
  refund_id VARCHAR(128) NULL,
  refund_status VARCHAR(32) NULL DEFAULT 'None',
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

CREATE TABLE IF NOT EXISTS complaints (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  office_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(80) NOT NULL,
  subject VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('Low','Medium','High','Emergency') NOT NULL DEFAULT 'Low',
  status ENUM('Open','Assigned','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Open',
  assigned_vendor_id BIGINT UNSIGNED NULL,
  attachment_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_complaints_status (status, created_at),
  KEY idx_complaints_tenant (tenant_id),
  KEY idx_complaints_office (office_id),
  KEY idx_complaints_vendor (assigned_vendor_id),
  CONSTRAINT fk_complaints_tenant FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaints_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaints_vendor FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
  CONSTRAINT fk_complaints_attachment FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaint_updates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  complaint_id BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  old_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NOT NULL,
  remarks TEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_complaint_updates_complaint (complaint_id),
  CONSTRAINT fk_complaint_updates_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaint_updates_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  office_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(80) NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('Low','Medium','High','Emergency') NOT NULL DEFAULT 'Low',
  status ENUM('Open','Assigned','In Progress','Completed','Cancelled') NOT NULL DEFAULT 'Open',
  assigned_vendor_id BIGINT UNSIGNED NULL,
  assigned_staff_id BIGINT UNSIGNED NULL,
  attachment_id BIGINT UNSIGNED NULL,
  expected_completion DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_maintenance_requests_status (status, created_at),
  KEY idx_maintenance_requests_tenant (tenant_id),
  KEY idx_maintenance_requests_office (office_id),
  KEY idx_maintenance_requests_vendor (assigned_vendor_id),
  KEY idx_maintenance_requests_staff (assigned_staff_id),
  CONSTRAINT fk_maintenance_requests_tenant FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_maintenance_requests_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE,
  CONSTRAINT fk_maintenance_requests_vendor FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
  CONSTRAINT fk_maintenance_requests_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  CONSTRAINT fk_maintenance_requests_attachment FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance_updates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  maintenance_request_id BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  old_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NOT NULL,
  remarks TEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_maintenance_updates_request (maintenance_request_id),
  CONSTRAINT fk_maintenance_updates_request FOREIGN KEY (maintenance_request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_maintenance_updates_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendor Marketplace: the marketplace columns (description, service_area,
-- availability, rating_avg, review_count, booking_count, is_verified,
-- is_featured, category_id) are defined directly in the vendors CREATE TABLE
-- above, so no ALTER is needed here. The marketplace indexes:
ALTER TABLE vendors
  ADD KEY idx_vendors_featured (is_featured, rating_avg),
  ADD KEY idx_vendors_category_id (category_id);

CREATE TABLE IF NOT EXISTS vendor_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  description TEXT NULL,
  icon VARCHAR(80) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendor_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendor_services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NULL,
  unit VARCHAR(40) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_vendor_services_vendor (vendor_id),
  CONSTRAINT fk_vendor_services_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendor_gallery (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  attachment_id BIGINT UNSIGNED NULL,
  caption VARCHAR(190) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_vendor_gallery_vendor (vendor_id),
  CONSTRAINT fk_vendor_gallery_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_gallery_attachment FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendor_bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  office_id BIGINT UNSIGNED NULL,
  service_id BIGINT UNSIGNED NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  scheduled_for DATETIME NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Requested',
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_vendor_bookings_vendor (vendor_id, status),
  KEY idx_vendor_bookings_user (user_id),
  CONSTRAINT fk_vendor_bookings_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_bookings_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE SET NULL,
  CONSTRAINT fk_vendor_bookings_service FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendor_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NULL,
  rating TINYINT NOT NULL,
  title VARCHAR(190) NULL,
  comment TEXT NULL,
  attachment_id BIGINT UNSIGNED NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_vendor_reviews_vendor (vendor_id, status),
  KEY idx_vendor_reviews_user (user_id),
  CONSTRAINT fk_vendor_reviews_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_reviews_booking FOREIGN KEY (booking_id) REFERENCES vendor_bookings(id) ON DELETE SET NULL,
  CONSTRAINT fk_vendor_reviews_attachment FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Rental Marketplace (P9/P10) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rental_listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  office_id BIGINT UNSIGNED NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  listing_type ENUM('Rent','Sale') NOT NULL DEFAULT 'Rent',
  property_type ENUM('Office','Apartment','Shop','Parking') NOT NULL DEFAULT 'Office',
  price DECIMAL(12,2) NULL,
  deposit DECIMAL(12,2) NULL,
  area_sqft DECIMAL(10,2) NULL,
  bedrooms TINYINT NULL,
  bathrooms TINYINT NULL,
  furnishing VARCHAR(60) NULL,
  available_from DATE NULL,
  status ENUM('Pending','Approved','Rejected','Active','Closed') NOT NULL DEFAULT 'Pending',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  contact_name VARCHAR(160) NULL,
  contact_phone VARCHAR(32) NULL,
  admin_notes TEXT NULL,
  view_count INT NOT NULL DEFAULT 0,
  favorite_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_rental_listings_status (status),
  KEY idx_rental_listings_type (listing_type, property_type),
  KEY idx_rental_listings_owner (owner_id),
  CONSTRAINT fk_rental_listings_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rental_listings_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  attachment_id BIGINT UNSIGNED NULL,
  caption VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_listing_images_listing (listing_id),
  CONSTRAINT fk_listing_images_listing FOREIGN KEY (listing_id) REFERENCES rental_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_views (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_listing_views_listing (listing_id),
  CONSTRAINT fk_listing_views_listing FOREIGN KEY (listing_id) REFERENCES rental_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_listing_favorites (listing_id, user_id),
  CONSTRAINT fk_listing_favorites_listing FOREIGN KEY (listing_id) REFERENCES rental_listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_listing_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(40) NULL,
  to_status VARCHAR(40) NOT NULL,
  comment TEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_lsh_listing (listing_id),
  CONSTRAINT fk_lsh_listing FOREIGN KEY (listing_id) REFERENCES rental_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Local Business Ads (P11) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  icon VARCHAR(80) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_business_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_ads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NULL,
  business_name VARCHAR(190) NOT NULL,
  description TEXT NULL,
  offer TEXT NULL,
  website VARCHAR(255) NULL,
  phone VARCHAR(32) NULL,
  whatsapp VARCHAR(32) NULL,
  address TEXT NULL,
  logo_attachment_id BIGINT UNSIGNED NULL,
  banner_attachment_id BIGINT UNSIGNED NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  priority INT NOT NULL DEFAULT 0,
  status ENUM('Pending','Active','Rejected','Expired','Inactive') NOT NULL DEFAULT 'Pending',
  expires_at DATETIME NULL,
  view_count INT NOT NULL DEFAULT 0,
  click_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  ctr DECIMAL(6,2) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  package_id BIGINT UNSIGNED NULL,
  expires_at_billing DATETIME NULL,
  renewal_notified TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_business_ads_status (status),
  KEY idx_business_ads_featured (featured),
  CONSTRAINT fk_business_ads_category FOREIGN KEY (category_id) REFERENCES business_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ad_clicks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  click_type VARCHAR(20) NOT NULL DEFAULT 'view',
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_ad_clicks_ad (ad_id),
  CONSTRAINT fk_ad_clicks_ad FOREIGN KEY (ad_id) REFERENCES business_ads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Announcements (P12) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('Low','Medium','High','Emergency') NOT NULL DEFAULT 'Medium',
  audience ENUM('All','Tenants','Security','Admin') NOT NULL DEFAULT 'All',
  attachment_id BIGINT UNSIGNED NULL,
  publish_at DATETIME NULL,
  expires_at DATETIME NULL,
  status ENUM('Draft','Published','Scheduled','Expired','Archived') NOT NULL DEFAULT 'Draft',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_announcements_status (status),
  KEY idx_announcements_audience (audience),
  CONSTRAINT fk_announcements_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcement_reads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  announcement_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  read_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_announcement_reads (announcement_id, user_id),
  CONSTRAINT fk_ann_reads_ann FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  CONSTRAINT fk_ann_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Emergency Contacts (P13) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL DEFAULT 'Other',
  phone VARCHAR(32) NOT NULL,
  alternate_phone VARCHAR(32) NULL,
  email VARCHAR(190) NULL,
  address TEXT NULL,
  priority INT NOT NULL DEFAULT 0,
  available_24h TINYINT(1) NOT NULL DEFAULT 0,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_emergency_contacts_category (category),
  KEY idx_emergency_contacts_pinned (is_pinned, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Daily Workers (P14) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_workers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NULL,
  worker_type VARCHAR(60) NOT NULL DEFAULT 'General',
  photo_attachment_id BIGINT UNSIGNED NULL,
  id_proof_attachment_id BIGINT UNSIGNED NULL,
  address TEXT NULL,
  office_id BIGINT UNSIGNED NULL,
  status ENUM('Active','Inactive','Blacklisted') NOT NULL DEFAULT 'Active',
  qr_code VARCHAR(40) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_daily_workers_qr (qr_code),
  KEY idx_daily_workers_type (worker_type),
  KEY idx_daily_workers_status (status),
  CONSTRAINT fk_daily_workers_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS worker_attendance (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  worker_id BIGINT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,
  entry_time DATETIME NULL,
  exit_time DATETIME NULL,
  status ENUM('Present','Absent','Half Day','Leave') NOT NULL DEFAULT 'Present',
  marked_by BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_worker_attendance (worker_id, work_date),
  KEY idx_worker_attendance_date (work_date),
  CONSTRAINT fk_worker_attendance_worker FOREIGN KEY (worker_id) REFERENCES daily_workers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS worker_visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  worker_id BIGINT UNSIGNED NOT NULL,
  office_id BIGINT UNSIGNED NULL,
  entry_time DATETIME NOT NULL,
  exit_time DATETIME NULL,
  authorized_by BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_worker_visits_worker (worker_id),
  KEY idx_worker_visits_date (entry_time),
  CONSTRAINT fk_worker_visits_worker FOREIGN KEY (worker_id) REFERENCES daily_workers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== P15-P28 tables (notifications, secretary, passes, events, cctv, premium, ad billing, payments) =====
-- ── 006: notifications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  priority ENUM('Low','Medium','High','Emergency') NOT NULL DEFAULT 'Medium',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  action_url VARCHAR(255) NULL,
  reference_type VARCHAR(64) NULL,
  reference_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_user_id (user_id),
  KEY idx_notifications_is_read (is_read),
  KEY idx_notifications_category (category),
  KEY idx_notifications_created_at (created_at),
  KEY idx_notifications_deleted_at (deleted_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 014: secretary permissions ──────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_secretary TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS secretary_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  module VARCHAR(64) NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 1,
  can_edit TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_secretary_perm (user_id, module),
  KEY idx_secretary_permissions_user (user_id),
  CONSTRAINT fk_secretary_perm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 015: visitor passes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitor_passes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pass_code VARCHAR(64) NOT NULL,
  pass_type VARCHAR(32) NOT NULL,
  visitor_name VARCHAR(190) NOT NULL,
  visitor_phone VARCHAR(32) NULL,
  host_name VARCHAR(190) NULL,
  host_office_id BIGINT UNSIGNED NULL,
  purpose TEXT NULL,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  max_uses INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  qr_payload TEXT NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  shared_via VARCHAR(64) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visitor_pass_code (pass_code),
  KEY idx_visitor_passes_status (status),
  KEY idx_visitor_passes_valid_until (valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitor_pass_scans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pass_id BIGINT UNSIGNED NOT NULL,
  scanned_at DATETIME NOT NULL,
  scanned_by BIGINT UNSIGNED NULL,
  action VARCHAR(32) NOT NULL DEFAULT 'entry',
  notes TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_pass_scans_pass (pass_id),
  CONSTRAINT fk_pass_scans_pass FOREIGN KEY (pass_id) REFERENCES visitor_passes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 016: community events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  location VARCHAR(255) NULL,
  organizer VARCHAR(190) NULL,
  event_date DATE NOT NULL,
  event_time VARCHAR(8) NULL,
  image_attachment_id BIGINT UNSIGNED NULL,
  attachment_id BIGINT UNSIGNED NULL,
  capacity INT NOT NULL DEFAULT 0,
  registration_required TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'Draft',
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_community_events_date (event_date),
  KEY idx_community_events_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_registrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(190) NOT NULL,
  phone VARCHAR(32) NULL,
  email VARCHAR(190) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Registered',
  registered_at DATETIME NOT NULL,
  notes TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_event_registrations_event (event_id),
  KEY idx_event_registrations_user (user_id),
  UNIQUE KEY idx_event_reg_unique (event_id, user_id),
  CONSTRAINT fk_event_reg_event FOREIGN KEY (event_id) REFERENCES community_events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 017: CCTV ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS camera_devices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  location VARCHAR(255) NOT NULL,
  zone VARCHAR(64) NULL,
  rtsp_url VARCHAR(255) NULL,
  hls_url VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  port INT NULL DEFAULT 554,
  username VARCHAR(128) NULL,
  password_hash VARCHAR(255) NULL,
  manufacturer VARCHAR(128) NULL,
  model VARCHAR(128) NULL,
  resolution VARCHAR(32) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Offline',
  last_heartbeat DATETIME NULL,
  snapshot_url VARCHAR(255) NULL,
  is_recording TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_camera_devices_status (status),
  KEY idx_camera_devices_zone (zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS camera_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  camera_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL DEFAULT 'Low',
  description TEXT NULL,
  snapshot_id BIGINT UNSIGNED NULL,
  metadata TEXT NULL,
  acknowledged TINYINT(1) NOT NULL DEFAULT 0,
  acknowledged_by BIGINT UNSIGNED NULL,
  acknowledged_at DATETIME NULL,
  occurred_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_camera_events_camera (camera_id),
  KEY idx_camera_events_type (event_type),
  KEY idx_camera_events_occurred (occurred_at),
  CONSTRAINT fk_camera_events_camera FOREIGN KEY (camera_id) REFERENCES camera_devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS camera_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  camera_id BIGINT UNSIGNED NOT NULL,
  file_path VARCHAR(255) NULL,
  file_url VARCHAR(255) NULL,
  captured_at DATETIME NOT NULL,
  `trigger` VARCHAR(32) NULL DEFAULT 'Manual',
  event_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_camera_snapshots_camera (camera_id),
  KEY idx_camera_snapshots_captured (captured_at),
  CONSTRAINT fk_camera_snapshots_camera FOREIGN KEY (camera_id) REFERENCES camera_devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 018: premium membership ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL,
  description TEXT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  features TEXT NULL,
  max_listings INT NULL DEFAULT 3,
  max_ads INT NULL DEFAULT 1,
  analytics_access TINYINT(1) NOT NULL DEFAULT 0,
  featured_vendor TINYINT(1) NOT NULL DEFAULT 0,
  featured_rental TINYINT(1) NOT NULL DEFAULT 0,
  priority_support TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscription_plan_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  billing_cycle VARCHAR(32) NOT NULL DEFAULT 'Monthly',
  started_at DATETIME NOT NULL,
  expires_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_ref VARCHAR(128) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_subscriptions_user (user_id),
  KEY idx_subscriptions_status (status),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS premium_features (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  feature_key VARCHAR(128) NOT NULL,
  feature_name VARCHAR(190) NOT NULL,
  description TEXT NULL,
  min_plan VARCHAR(64) NOT NULL DEFAULT 'premium',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_premium_feature_key (feature_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, max_listings, max_ads, analytics_access, featured_vendor, featured_rental, priority_support, is_active, sort_order, created_at)
VALUES
  ('Free', 'free', 'Basic access for all residents', 0, 0, '["3 rental listings","1 business ad","Basic notifications"]', 3, 1, 0, 0, 0, 0, 1, 1, NOW()),
  ('Premium', 'premium', 'Enhanced access with analytics and featured listings', 299, 2999, '["Unlimited rental listings","5 business ads","Community analytics","Featured vendor profile","Priority support","Advanced reports"]', -1, 5, 1, 1, 1, 1, 1, 2, NOW()),
  ('Enterprise', 'enterprise', 'Full platform access for property managers', 999, 9999, '["Everything in Premium","Custom branding","API access","Dedicated support","All premium features"]', -1, -1, 1, 1, 1, 1, 1, 3, NOW());

INSERT IGNORE INTO premium_features (feature_key, feature_name, description, min_plan, is_active, created_at) VALUES
  ('featured_vendor', 'Featured Vendor Profile', 'Appear at top of vendor listings', 'premium', 1, NOW()),
  ('featured_rental', 'Featured Rental Listing', 'Highlight rental listings', 'premium', 1, NOW()),
  ('analytics_access', 'Community Analytics', 'Access to full analytics dashboard', 'premium', 1, NOW()),
  ('priority_ads', 'Priority Ad Placement', 'Ads shown at premium positions', 'premium', 1, NOW()),
  ('unlimited_listings', 'Unlimited Listings', 'No cap on rental or ad listings', 'premium', 1, NOW());

-- ── 019: ad billing & analytics ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_packages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_days INT NOT NULL DEFAULT 30,
  max_impressions INT NULL DEFAULT 0,
  features TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ad_billing (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad_id BIGINT UNSIGNED NOT NULL,
  package_id BIGINT UNSIGNED NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  due_date DATETIME NULL,
  paid_at DATETIME NULL,
  payment_ref VARCHAR(128) NULL,
  renewal_reminded TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_ad_billing_ad (ad_id),
  KEY idx_ad_billing_status (billing_status),
  CONSTRAINT fk_ad_billing_ad FOREIGN KEY (ad_id) REFERENCES business_ads(id) ON DELETE CASCADE,
  CONSTRAINT fk_ad_billing_package FOREIGN KEY (package_id) REFERENCES ad_packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS impressions INT NOT NULL DEFAULT 0;
ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS clicks INT NOT NULL DEFAULT 0;
ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS ctr DECIMAL(6,2) NOT NULL DEFAULT 0;
ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS package_id BIGINT UNSIGNED NULL;
ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS expires_at_billing DATETIME NULL;
ALTER TABLE business_ads ADD COLUMN IF NOT EXISTS renewal_notified TINYINT(1) NOT NULL DEFAULT 0;

INSERT IGNORE INTO ad_packages (name, description, price, duration_days, max_impressions, features, is_active, sort_order, created_at) VALUES
  ('Basic', 'Standard listing for 30 days', 499, 30, 0, '["30-day listing","Standard placement","Click tracking"]', 1, 1, NOW()),
  ('Standard', 'Enhanced listing with impressions tracking', 999, 60, 10000, '["60-day listing","Enhanced placement","Impressions & CTR analytics","Email report"]', 1, 2, NOW()),
  ('Premium', 'Featured placement with full analytics', 1999, 90, 0, '["90-day listing","Featured badge","Top placement","Full analytics","Renewal reminder"]', 1, 3, NOW()),
  ('Featured', 'Maximum visibility sponsorship', 4999, 180, 0, '["180-day listing","Sponsored badge","Homepage banner","All analytics","Priority support","Custom design"]', 1, 4, NOW());

-- ── 020: razorpay payments ──────────────────────────────────────────────────
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(128) NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(128) NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255) NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(64) NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_gateway_status VARCHAR(64) NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_initiated_at DATETIME NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_completed_at DATETIME NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS refund_id VARCHAR(128) NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS refund_status VARCHAR(32) NULL DEFAULT 'None';

CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id BIGINT UNSIGNED NOT NULL,
  razorpay_order_id VARCHAR(128) NULL,
  razorpay_payment_id VARCHAR(128) NULL,
  razorpay_signature VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  status VARCHAR(32) NOT NULL DEFAULT 'created',
  payment_method VARCHAR(64) NULL,
  error_code VARCHAR(64) NULL,
  error_description TEXT NULL,
  webhook_received TINYINT(1) NOT NULL DEFAULT 0,
  metadata TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_payment_transactions_invoice (invoice_id),
  KEY idx_payment_transactions_order (razorpay_order_id),
  KEY idx_payment_transactions_payment (razorpay_payment_id),
  CONSTRAINT fk_payment_transactions_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════
-- Migrations 023–031 (OfficeGate v3 modules). Mirrors the SQLite migrations in
-- backend/database/migrations/ translated to MySQL. Keep in sync when adding
-- new SQLite migrations, since the PHP migration runner is SQLite-only.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 023: Office Expense Management (GST input-tax columns folded in from 029) ─
CREATE TABLE IF NOT EXISTS office_expenses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  expense_no VARCHAR(80) NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Other',
  payment_method VARCHAR(40) NOT NULL DEFAULT 'Petty Cash',
  payee VARCHAR(190) NULL,
  description TEXT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  expense_date DATE NULL,
  cheque_no VARCHAR(80) NULL,
  cheque_date DATE NULL,
  bank_name VARCHAR(160) NULL,
  cheque_front_attachment_id BIGINT UNSIGNED NULL,
  cheque_back_attachment_id BIGINT UNSIGNED NULL,
  receipt_attachment_id BIGINT UNSIGNED NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  approved_by BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  gstin VARCHAR(20) NULL,
  gst_rate DECIMAL(5,2) NULL,
  gst_amount DECIMAL(12,2) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_office_expenses_no (expense_no),
  KEY idx_office_expenses_date (expense_date),
  KEY idx_office_expenses_method (payment_method),
  KEY idx_office_expenses_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 024: Facility & Daily Operations logs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS cctv_daily_checks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  check_date DATE NOT NULL,
  camera_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Working',
  remarks TEXT NULL,
  checked_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cctv_daily_checks (check_date, camera_id),
  KEY idx_cctv_daily_checks_date (check_date),
  CONSTRAINT fk_cctv_daily_checks_camera FOREIGN KEY (camera_id) REFERENCES camera_devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS water_lorry_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  log_date DATE NOT NULL,
  supplier_name VARCHAR(160) NOT NULL,
  vehicle_no VARCHAR(40) NULL,
  capacity_litres DECIMAL(10,2) NULL,
  trips INT NOT NULL DEFAULT 1,
  amount DECIMAL(12,2) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_water_lorry_logs_date (log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eb_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  log_date DATE NOT NULL,
  meter_start DECIMAL(12,2) NULL,
  meter_end DECIMAL(12,2) NULL,
  power_cut_minutes INT NOT NULL DEFAULT 0,
  generator_note TEXT NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_eb_logs_date (log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS housekeeping_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  log_date DATE NOT NULL,
  area VARCHAR(160) NOT NULL,
  task VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  staff_name VARCHAR(160) NULL,
  remarks TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_housekeeping_logs_date (log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 025: IoT devices & events ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iot_devices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  device_type VARCHAR(40) NOT NULL DEFAULT 'other',
  protocol VARCHAR(20) NOT NULL DEFAULT 'http',
  ip_address VARCHAR(64) NULL,
  io_lines INT NULL,
  api_token VARCHAR(190) NULL,
  location VARCHAR(190) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  last_seen_at DATETIME NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_iot_devices_token (api_token),
  KEY idx_iot_devices_status (status),
  KEY idx_iot_devices_type (device_type),
  KEY idx_iot_devices_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS iot_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  device_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(40) NOT NULL DEFAULT 'fault',
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  io_line INT NULL,
  value VARCHAR(190) NULL,
  message TEXT NULL,
  payload TEXT NULL,
  acknowledged_at DATETIME NULL,
  acknowledged_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_iot_events_device (device_id),
  KEY idx_iot_events_type (event_type),
  KEY idx_iot_events_severity (severity),
  KEY idx_iot_events_created (created_at),
  KEY idx_iot_events_ack (acknowledged_at),
  CONSTRAINT fk_iot_events_device FOREIGN KEY (device_id) REFERENCES iot_devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 026: Asset tracking ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_tag VARCHAR(80) NOT NULL,
  name VARCHAR(190) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Other',
  asset_type VARCHAR(80) NULL,
  serial_no VARCHAR(120) NULL,
  `condition` VARCHAR(40) NOT NULL DEFAULT 'Good',
  status VARCHAR(40) NOT NULL DEFAULT 'Available',
  photo_attachment_id BIGINT UNSIGNED NULL,
  purchase_date DATE NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assets_tag (asset_tag),
  KEY idx_assets_status (status),
  KEY idx_assets_category (category),
  KEY idx_assets_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  staff_id BIGINT UNSIGNED NOT NULL,
  issued_by BIGINT UNSIGNED NULL,
  issued_at DATETIME NOT NULL,
  due_at DATETIME NULL,
  returned_at DATETIME NULL,
  return_condition VARCHAR(40) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_asset_assignments_asset (asset_id),
  KEY idx_asset_assignments_staff (staff_id),
  KEY idx_asset_assignments_open (returned_at),
  CONSTRAINT fk_asset_assignments_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  CONSTRAINT fk_asset_assignments_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_audits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  audited_by BIGINT UNSIGNED NULL,
  audit_date DATE NOT NULL,
  found_status VARCHAR(40) NOT NULL DEFAULT 'Available',
  `condition` VARCHAR(40) NOT NULL DEFAULT 'Good',
  remarks TEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_asset_audits_asset (asset_id),
  KEY idx_asset_audits_date (audit_date),
  CONSTRAINT fk_asset_audits_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 027: Office documents + tenant name transfers ───────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  doc_no VARCHAR(80) NULL,
  title VARCHAR(190) NOT NULL,
  category VARCHAR(120) NOT NULL DEFAULT 'Office Documents',
  office_id BIGINT UNSIGNED NULL,
  attachment_id BIGINT UNSIGNED NULL,
  file_name VARCHAR(255) NULL,
  expiry_date DATE NULL,
  tags VARCHAR(255) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Active',
  uploaded_by BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_documents_no (doc_no),
  KEY idx_documents_category (category),
  KEY idx_documents_office (office_id),
  KEY idx_documents_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS name_transfers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transfer_no VARCHAR(80) NULL,
  office_id BIGINT UNSIGNED NOT NULL,
  from_name VARCHAR(190) NULL,
  to_name VARCHAR(190) NOT NULL,
  to_contact_person VARCHAR(160) NULL,
  to_phone VARCHAR(32) NULL,
  to_email VARCHAR(190) NULL,
  reason TEXT NULL,
  effective_date DATE NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  supporting_doc_attachment_id BIGINT UNSIGNED NULL,
  requested_by BIGINT UNSIGNED NULL,
  approved_by BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name_transfers_no (transfer_no),
  KEY idx_name_transfers_office (office_id),
  KEY idx_name_transfers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 028: Staff payroll + medical reports ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  period_month VARCHAR(7) NOT NULL,
  status ENUM('Draft','Finalized','Paid') NOT NULL DEFAULT 'Draft',
  generated_by BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_payroll_runs_period (period_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payslips (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payroll_run_id BIGINT UNSIGNED NOT NULL,
  staff_id BIGINT UNSIGNED NOT NULL,
  period_month VARCHAR(7) NOT NULL,
  base_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  present_days INT NOT NULL DEFAULT 0,
  paid_days DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  absent_days INT NOT NULL DEFAULT 0,
  overtime_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  allowances DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  deductions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gross_pay DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_pay DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('Bank Transfer','Cash','Cheque') NULL DEFAULT 'Bank Transfer',
  paid_at DATETIME NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_payslips_period (period_month),
  KEY idx_payslips_staff (staff_id),
  KEY idx_payslips_run (payroll_run_id),
  CONSTRAINT fk_payslips_run FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
  CONSTRAINT fk_payslips_staff FOREIGN KEY (staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medical_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_no VARCHAR(80) NULL,
  staff_id BIGINT UNSIGNED NULL,
  person_name VARCHAR(190) NOT NULL,
  report_type ENUM('Fitness Certificate','Checkup','Injury','Insurance','Other') NOT NULL DEFAULT 'Checkup',
  report_date DATE NOT NULL,
  provider VARCHAR(190) NULL,
  summary TEXT NULL,
  result ENUM('Fit','Unfit','Follow-up','N/A') NOT NULL DEFAULT 'N/A',
  next_checkup_date DATE NULL,
  attachment_id BIGINT UNSIGNED NULL,
  confidential TINYINT(1) NOT NULL DEFAULT 1,
  recorded_by BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medical_reports_no (report_no),
  KEY idx_medical_reports_staff (staff_id),
  KEY idx_medical_reports_date (report_date),
  KEY idx_medical_reports_checkup (next_checkup_date),
  CONSTRAINT fk_medical_reports_staff FOREIGN KEY (staff_id) REFERENCES staff(id),
  CONSTRAINT fk_medical_reports_attachment FOREIGN KEY (attachment_id) REFERENCES attachments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 029: AMC contracts + DG maintenance logs (GST invoice cols via ALTER below)
CREATE TABLE IF NOT EXISTS amc_contracts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_no VARCHAR(80) NULL,
  title VARCHAR(190) NOT NULL,
  contract_type ENUM('AMC','DG Maintenance','Lift AMC','Fire Safety','Other') NOT NULL DEFAULT 'AMC',
  vendor_id BIGINT UNSIGNED NULL,
  vendor_name VARCHAR(190) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_frequency ENUM('Monthly','Quarterly','Half-Yearly','Yearly','One-Time') NOT NULL DEFAULT 'Yearly',
  reminder_days INT NOT NULL DEFAULT 30,
  document_attachment_id BIGINT UNSIGNED NULL,
  status ENUM('Active','Expired','Cancelled') NOT NULL DEFAULT 'Active',
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_amc_contracts_no (contract_no),
  KEY idx_amc_contracts_status (status),
  KEY idx_amc_contracts_end_date (end_date),
  KEY idx_amc_contracts_type (contract_type),
  CONSTRAINT fk_amc_contracts_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  CONSTRAINT fk_amc_contracts_attachment FOREIGN KEY (document_attachment_id) REFERENCES attachments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dg_maintenance_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  log_date DATE NOT NULL,
  dg_name VARCHAR(80) NOT NULL DEFAULT 'DG-1',
  run_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  diesel_added_litres DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  diesel_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  service_performed TEXT NULL,
  next_service_date DATE NULL,
  performed_by VARCHAR(160) NULL,
  remarks TEXT NULL,
  attachment_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_dg_logs_date (log_date),
  KEY idx_dg_logs_dg_name (dg_name),
  KEY idx_dg_logs_next_service (next_service_date),
  CONSTRAINT fk_dg_logs_attachment FOREIGN KEY (attachment_id) REFERENCES attachments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 029: GST output-tax columns on invoices (input-tax columns are inline on
-- office_expenses above).
ALTER TABLE invoices
  ADD COLUMN gstin VARCHAR(20) NULL,
  ADD COLUMN taxable_amount DECIMAL(12,2) NULL,
  ADD COLUMN gst_rate DECIMAL(5,2) NULL,
  ADD COLUMN cgst_amount DECIMAL(12,2) NULL,
  ADD COLUMN sgst_amount DECIMAL(12,2) NULL,
  ADD COLUMN igst_amount DECIMAL(12,2) NULL,
  ADD COLUMN gst_total DECIMAL(12,2) NULL;

-- 028: monthly base salary that payroll runs prorate from attendance.
ALTER TABLE staff
  ADD COLUMN base_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- ── 030: Organizations & super-admin multi-tenant foundation ────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  contact_person VARCHAR(160) NULL,
  contact_email VARCHAR(190) NULL,
  contact_phone VARCHAR(32) NULL,
  plan ENUM('Free','Standard','Premium') NOT NULL DEFAULT 'Free',
  status ENUM('Active','Suspended','Trial') NOT NULL DEFAULT 'Active',
  ads_enabled TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_organizations_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default organization: all pre-multi-tenant data belongs to it.
INSERT INTO organizations (id, name, slug, contact_person, contact_email, contact_phone, plan, status, ads_enabled, notes, created_at)
VALUES (1, 'BRILEY ONE', 'briley-one', 'Mr. Kumar', 'admin@officegate.com', '+919876500000', 'Premium', 'Active', 1, 'Default organization (pre-existing single-tenant data)', NOW())
ON DUPLICATE KEY UPDATE id = id;

-- Widen the users.role ENUM with 'super_admin' and add org_id.
ALTER TABLE users
  MODIFY COLUMN role ENUM('super_admin','admin','security','tenant') NOT NULL,
  ADD COLUMN org_id BIGINT UNSIGNED NULL,
  ADD KEY idx_users_org (org_id);

-- org_id on the org-scoped module tables (subscription_plans stays NULL = global
-- catalog shared across organizations).
ALTER TABLE subscriptions ADD COLUMN org_id BIGINT UNSIGNED NULL, ADD KEY idx_subscriptions_org (org_id);
ALTER TABLE subscription_plans ADD COLUMN org_id BIGINT UNSIGNED NULL;
ALTER TABLE business_ads ADD COLUMN org_id BIGINT UNSIGNED NULL, ADD KEY idx_business_ads_org (org_id);
ALTER TABLE business_categories ADD COLUMN org_id BIGINT UNSIGNED NULL;
ALTER TABLE ad_packages ADD COLUMN org_id BIGINT UNSIGNED NULL;
ALTER TABLE ad_billing ADD COLUMN org_id BIGINT UNSIGNED NULL, ADD KEY idx_ad_billing_org (org_id);
ALTER TABLE vendors ADD COLUMN org_id BIGINT UNSIGNED NULL, ADD KEY idx_vendors_org (org_id);

-- ── 031: Home automation (Home Assistant REST connector) ────────────────────
CREATE TABLE IF NOT EXISTS home_automation_hubs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  office_id BIGINT UNSIGNED NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'home_assistant',
  base_url VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  last_check_at DATETIME NULL,
  last_check_ok TINYINT(1) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_ha_hubs_owner (owner_user_id),
  KEY idx_ha_hubs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS home_automation_devices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hub_id BIGINT UNSIGNED NOT NULL,
  entity_id VARCHAR(190) NOT NULL,
  friendly_name VARCHAR(190) NULL,
  domain VARCHAR(20) NOT NULL DEFAULT 'other',
  is_controllable TINYINT(1) NOT NULL DEFAULT 1,
  visible_to_owner TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_ha_devices_hub (hub_id),
  KEY idx_ha_devices_entity (entity_id),
  CONSTRAINT fk_ha_devices_hub FOREIGN KEY (hub_id) REFERENCES home_automation_hubs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 033: Per-organization feature entitlements ──────────────────────────────
-- Effective rule is default-ON: a feature is enabled for an org when a row
-- exists with enabled=1 OR when no row exists for that (org, feature_key). Only
-- an explicit enabled=0 row disables a module. Org creation seeds all keys
-- enabled=1; the super admin narrows the set via the portal.
CREATE TABLE IF NOT EXISTS organization_features (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id BIGINT UNSIGNED NOT NULL,
  feature_key VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_org_features_org_key (org_id, feature_key),
  KEY idx_org_features_org (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the default organization (id 1) with every feature enabled.
INSERT INTO organization_features (org_id, feature_key, enabled, created_at) VALUES
  (1, 'visitors', 1, NOW()),
  (1, 'vehicles', 1, NOW()),
  (1, 'cctv', 1, NOW()),
  (1, 'daily_workers', 1, NOW()),
  (1, 'staff', 1, NOW()),
  (1, 'payroll', 1, NOW()),
  (1, 'medical', 1, NOW()),
  (1, 'inventory', 1, NOW()),
  (1, 'assets', 1, NOW()),
  (1, 'utilities', 1, NOW()),
  (1, 'daily_ops', 1, NOW()),
  (1, 'amc', 1, NOW()),
  (1, 'documents', 1, NOW()),
  (1, 'name_transfers', 1, NOW()),
  (1, 'finance', 1, NOW()),
  (1, 'expenses', 1, NOW()),
  (1, 'compliance', 1, NOW()),
  (1, 'reports', 1, NOW()),
  (1, 'analytics', 1, NOW()),
  (1, 'complaints', 1, NOW()),
  (1, 'maintenance', 1, NOW()),
  (1, 'rental', 1, NOW()),
  (1, 'announcements', 1, NOW()),
  (1, 'events', 1, NOW()),
  (1, 'emergency_contacts', 1, NOW()),
  (1, 'vendors', 1, NOW()),
  (1, 'vendor_marketplace', 1, NOW()),
  (1, 'subscriptions', 1, NOW()),
  (1, 'iot', 1, NOW()),
  (1, 'home_automation', 1, NOW()),
  (1, 'whatsapp', 1, NOW())
ON DUPLICATE KEY UPDATE enabled = VALUES(enabled);

SET FOREIGN_KEY_CHECKS = 1;

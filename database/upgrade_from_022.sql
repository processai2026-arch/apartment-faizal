-- ════════════════════════════════════════════════════════════════════════════
-- OfficeGate v3 — incremental MySQL upgrade (migrations 023–032)
--
-- Apply this ONLY to an existing production database that is still at the
-- migration-022 baseline (i.e. it already has users/offices/invoices/… but NOT
-- office_expenses/organizations/home_automation_hubs/etc.).
--
-- It does NOT recreate or touch the existing base tables — it only adds the new
-- v3 tables and the new columns. Safe to import in phpMyAdmin on top of live data.
--
-- If you instead want a clean install, import database/officegate_production.sql
-- into an EMPTY database (that file contains the full schema, 001–032).
--
-- After importing, run:  php scripts/seed.php   (creates the super_admin user).
-- ════════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
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

-- ── 032: CCTV browser-playable live view ────────────────────────────────────
-- camera_devices already exists (migration 017); add the hls_url column.
ALTER TABLE camera_devices ADD COLUMN hls_url VARCHAR(255) NULL;

-- ── 033: Per-organization feature entitlements ──────────────────────────────
-- Effective rule is default-ON: absent (org, feature_key) row = enabled. Only an
-- explicit enabled=0 row disables a module. Seeds the default org (id 1) fully on.
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

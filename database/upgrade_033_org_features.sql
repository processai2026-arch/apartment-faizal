-- ════════════════════════════════════════════════════════════════════════════
-- OfficeGate — incremental MySQL upgrade 033: per-organization feature toggles
--
-- Apply this ONLY to a production database that already contains the migration
-- 022–032 schema (users, organizations, home_automation_hubs, camera_devices
-- with hls_url, …) but does NOT yet have the organization_features table.
--
-- It adds a single table and seeds the default organization (id 1) with every
-- feature enabled. Effective rule is default-ON: a feature is enabled for an org
-- when a row exists with enabled=1 OR when no row exists for that
-- (org, feature_key). Only an explicit enabled=0 row disables a module, so this
-- upgrade is a no-op for behaviour until a super admin narrows a set.
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS + INSERT … ON DUPLICATE KEY UPDATE.
-- Full clean installs already include this via database/officegate_production.sql.
-- ════════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

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

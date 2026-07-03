-- Per-organization feature entitlements.
--
-- Effective rule is default-ON: a feature is enabled for an org when a row exists
-- with enabled=1 OR when no row exists for that (org, feature_key). Only an
-- explicit enabled=0 row disables a module. The super admin upserts explicit
-- rows via PUT /super/organizations/{id}/features; org creation seeds all keys
-- enabled=1. See backend/helpers/FeatureRegistry.php for the canonical key list.

CREATE TABLE IF NOT EXISTS organization_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  feature_key TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE(org_id, feature_key)
);
CREATE INDEX IF NOT EXISTS idx_org_features_org ON organization_features(org_id);

-- Seed the default organization (id 1) with every feature enabled.
INSERT OR IGNORE INTO organization_features (org_id, feature_key, enabled, created_at) VALUES
  (1, 'visitors', 1, datetime('now')),
  (1, 'vehicles', 1, datetime('now')),
  (1, 'cctv', 1, datetime('now')),
  (1, 'daily_workers', 1, datetime('now')),
  (1, 'staff', 1, datetime('now')),
  (1, 'payroll', 1, datetime('now')),
  (1, 'medical', 1, datetime('now')),
  (1, 'inventory', 1, datetime('now')),
  (1, 'assets', 1, datetime('now')),
  (1, 'utilities', 1, datetime('now')),
  (1, 'daily_ops', 1, datetime('now')),
  (1, 'amc', 1, datetime('now')),
  (1, 'documents', 1, datetime('now')),
  (1, 'name_transfers', 1, datetime('now')),
  (1, 'finance', 1, datetime('now')),
  (1, 'expenses', 1, datetime('now')),
  (1, 'compliance', 1, datetime('now')),
  (1, 'reports', 1, datetime('now')),
  (1, 'analytics', 1, datetime('now')),
  (1, 'complaints', 1, datetime('now')),
  (1, 'maintenance', 1, datetime('now')),
  (1, 'rental', 1, datetime('now')),
  (1, 'announcements', 1, datetime('now')),
  (1, 'events', 1, datetime('now')),
  (1, 'emergency_contacts', 1, datetime('now')),
  (1, 'vendors', 1, datetime('now')),
  (1, 'vendor_marketplace', 1, datetime('now')),
  (1, 'subscriptions', 1, datetime('now')),
  (1, 'iot', 1, datetime('now')),
  (1, 'home_automation', 1, datetime('now')),
  (1, 'whatsapp', 1, datetime('now'));

-- Organizations & Super Admin (multi-tenant foundation)
--
-- 1) organizations: client buildings/societies managed from the Super Admin portal.
-- 2) users: rebuilt to widen the role CHECK with 'super_admin' and to add org_id.
--    SQLite cannot ALTER a CHECK constraint, so the table is recreated with an
--    identical schema apart from the widened role CHECK and the appended org_id
--    column. The status CHECK ('active','inactive') is preserved verbatim.
-- 3) org_id (nullable INTEGER) added to the org-scoped module tables
--    (subscriptions, subscription_plans, business_ads, business_categories,
--    ad_packages, ad_billing, vendors) and existing rows backfilled to the
--    default organization (id 1) so current single-tenant data stays coherent.
--    subscription_plans rows are intentionally left NULL: NULL = global catalog
--    plan shared by every organization (see docs/MULTI_TENANT_ARCHITECTURE.md).

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  plan TEXT NOT NULL DEFAULT 'Free' CHECK(plan IN ('Free','Standard','Premium')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Suspended','Trial')),
  ads_enabled INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

-- Default organization: all pre-multi-tenant data belongs to it.
-- ads_enabled=1 because the existing building already carries business-ad data.
INSERT OR IGNORE INTO organizations (id, name, slug, contact_person, contact_email, contact_phone, plan, status, ads_enabled, notes, created_at)
VALUES (1, 'BRILEY ONE', 'briley-one', 'Mr. Kumar', 'admin@officegate.com', '+919876500000', 'Premium', 'Active', 1, 'Default organization (pre-existing single-tenant data)', datetime('now'));

-- ── users rebuild: role CHECK widened with 'super_admin', org_id appended ──
CREATE TABLE users_sa_rebuild (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('super_admin','admin','security','tenant')),
  office_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  is_secretary INTEGER NOT NULL DEFAULT 0,
  org_id INTEGER
);

INSERT INTO users_sa_rebuild (id, name, email, phone, password_hash, role, office_id, status, created_at, updated_at, deleted_at, is_secretary, org_id)
SELECT id, name, email, phone, password_hash, role, office_id, status, created_at, updated_at, deleted_at, is_secretary, 1
FROM users;

DROP TABLE users;
ALTER TABLE users_sa_rebuild RENAME TO users;

-- Recreate indexes lost with the old table (021_performance_indexes.sql).
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);

-- ── org_id on org-scoped module tables (one ALTER per statement) ──
ALTER TABLE subscriptions ADD COLUMN org_id INTEGER;
ALTER TABLE subscription_plans ADD COLUMN org_id INTEGER;
ALTER TABLE business_ads ADD COLUMN org_id INTEGER;
ALTER TABLE business_categories ADD COLUMN org_id INTEGER;
ALTER TABLE ad_packages ADD COLUMN org_id INTEGER;
ALTER TABLE ad_billing ADD COLUMN org_id INTEGER;
ALTER TABLE vendors ADD COLUMN org_id INTEGER;

-- Backfill current data to the default organization.
UPDATE subscriptions SET org_id = 1 WHERE org_id IS NULL;
UPDATE business_ads SET org_id = 1 WHERE org_id IS NULL;
UPDATE business_categories SET org_id = 1 WHERE org_id IS NULL;
UPDATE ad_packages SET org_id = 1 WHERE org_id IS NULL;
UPDATE ad_billing SET org_id = 1 WHERE org_id IS NULL;
UPDATE vendors SET org_id = 1 WHERE org_id IS NULL;
-- subscription_plans left NULL on purpose: global catalog shared across orgs.

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_business_ads_org ON business_ads(org_id);
CREATE INDEX IF NOT EXISTS idx_ad_billing_org ON ad_billing(org_id);
CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(org_id);

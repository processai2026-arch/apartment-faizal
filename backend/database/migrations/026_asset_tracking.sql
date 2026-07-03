-- Inventory & Utility Tracking — individually-tracked assets with unique asset IDs,
-- employee checkout/checkin, and periodic physical audits.

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_tag TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  asset_type TEXT,
  serial_no TEXT,
  condition TEXT NOT NULL DEFAULT 'Good',
  status TEXT NOT NULL DEFAULT 'Available',
  photo_attachment_id INTEGER,
  purchase_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  issued_by INTEGER,
  issued_at TEXT NOT NULL,
  due_at TEXT,
  returned_at TEXT,
  return_condition TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asset_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  audited_by INTEGER,
  audit_date TEXT NOT NULL,
  found_status TEXT NOT NULL DEFAULT 'Available',
  condition TEXT NOT NULL DEFAULT 'Good',
  remarks TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON assets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_staff ON asset_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_open ON asset_assignments(returned_at);
CREATE INDEX IF NOT EXISTS idx_asset_audits_asset ON asset_audits(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_audits_date ON asset_audits(audit_date);

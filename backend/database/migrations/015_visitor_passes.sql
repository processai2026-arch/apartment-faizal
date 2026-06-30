-- Smart QR Visitor Pass System (P17)

CREATE TABLE IF NOT EXISTS visitor_passes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pass_code TEXT NOT NULL UNIQUE,
  pass_type TEXT NOT NULL,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  host_name TEXT,
  host_office_id INTEGER,
  purpose TEXT,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  qr_payload TEXT NOT NULL,
  created_by INTEGER,
  shared_via TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_visitor_passes_code ON visitor_passes(pass_code);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_status ON visitor_passes(status);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_valid_until ON visitor_passes(valid_until);

CREATE TABLE IF NOT EXISTS visitor_pass_scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pass_id INTEGER NOT NULL,
  scanned_at TEXT NOT NULL,
  scanned_by INTEGER,
  action TEXT NOT NULL DEFAULT 'entry',
  notes TEXT,
  FOREIGN KEY (pass_id) REFERENCES visitor_passes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pass_scans_pass ON visitor_pass_scans(pass_id);

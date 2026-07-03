-- Office Documents storage & maintenance + Tenant Name Transfer (Association module)

-- Part 1: Documents module ----------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_no TEXT UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Office Documents',
  office_id INTEGER,
  attachment_id INTEGER,
  file_name TEXT,
  expiry_date TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  uploaded_by INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_office ON documents(office_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date);

-- Part 2: Name Transfer module ------------------------------------------------
CREATE TABLE IF NOT EXISTS name_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_no TEXT UNIQUE,
  office_id INTEGER NOT NULL,
  from_name TEXT,
  to_name TEXT NOT NULL,
  to_contact_person TEXT,
  to_phone TEXT,
  to_email TEXT,
  reason TEXT,
  effective_date TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  supporting_doc_attachment_id INTEGER,
  requested_by INTEGER,
  approved_by INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_name_transfers_office ON name_transfers(office_id);
CREATE INDEX IF NOT EXISTS idx_name_transfers_status ON name_transfers(status);

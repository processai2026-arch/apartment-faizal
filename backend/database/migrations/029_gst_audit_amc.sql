-- Accounts & Compliance: GST support on financials + AMC contracts + DG maintenance logs.
-- Runner records applied files in `migrations`, so this executes exactly once.

-- ── GST columns on invoices (output tax) — one ADD COLUMN per statement ─────
ALTER TABLE invoices ADD COLUMN gstin TEXT;
ALTER TABLE invoices ADD COLUMN taxable_amount REAL;
ALTER TABLE invoices ADD COLUMN gst_rate REAL;
ALTER TABLE invoices ADD COLUMN cgst_amount REAL;
ALTER TABLE invoices ADD COLUMN sgst_amount REAL;
ALTER TABLE invoices ADD COLUMN igst_amount REAL;
ALTER TABLE invoices ADD COLUMN gst_total REAL;

-- ── GST columns on office_expenses (input tax) ──────────────────────────────
ALTER TABLE office_expenses ADD COLUMN gstin TEXT;
ALTER TABLE office_expenses ADD COLUMN gst_rate REAL;
ALTER TABLE office_expenses ADD COLUMN gst_amount REAL;

-- ── AMC / DG maintenance contracts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amc_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_no TEXT UNIQUE,
  title TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'AMC' CHECK(contract_type IN ('AMC','DG Maintenance','Lift AMC','Fire Safety','Other')),
  vendor_id INTEGER,
  vendor_name TEXT,
  start_date TEXT,
  end_date TEXT,
  amount REAL NOT NULL DEFAULT 0,
  payment_frequency TEXT NOT NULL DEFAULT 'Yearly' CHECK(payment_frequency IN ('Monthly','Quarterly','Half-Yearly','Yearly','One-Time')),
  reminder_days INTEGER NOT NULL DEFAULT 30,
  document_attachment_id INTEGER,
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Expired','Cancelled')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (document_attachment_id) REFERENCES attachments(id)
);

CREATE INDEX IF NOT EXISTS idx_amc_contracts_status ON amc_contracts(status);
CREATE INDEX IF NOT EXISTS idx_amc_contracts_end_date ON amc_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_amc_contracts_type ON amc_contracts(contract_type);

-- ── DG (diesel generator) maintenance logs ──────────────────────────────────
CREATE TABLE IF NOT EXISTS dg_maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_date TEXT NOT NULL,
  dg_name TEXT NOT NULL DEFAULT 'DG-1',
  run_hours REAL NOT NULL DEFAULT 0,
  diesel_added_litres REAL NOT NULL DEFAULT 0,
  diesel_cost REAL NOT NULL DEFAULT 0,
  service_performed TEXT,
  next_service_date TEXT,
  performed_by TEXT,
  remarks TEXT,
  attachment_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (attachment_id) REFERENCES attachments(id)
);

CREATE INDEX IF NOT EXISTS idx_dg_logs_date ON dg_maintenance_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_dg_logs_dg_name ON dg_maintenance_logs(dg_name);
CREATE INDEX IF NOT EXISTS idx_dg_logs_next_service ON dg_maintenance_logs(next_service_date);

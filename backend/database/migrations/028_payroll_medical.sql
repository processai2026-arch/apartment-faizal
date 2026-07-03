-- Staff Payroll + Medical Reports Module

-- Give staff a monthly base salary that payroll runs prorate from attendance.
-- Additive column; existing rows default to 0 so nothing breaks.
ALTER TABLE staff ADD COLUMN base_salary REAL NOT NULL DEFAULT 0;

-- ── Payroll ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Finalized','Paid')),
  generated_by INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS payslips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payroll_run_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  period_month TEXT NOT NULL,
  base_salary REAL NOT NULL DEFAULT 0,
  present_days INTEGER NOT NULL DEFAULT 0,
  paid_days REAL NOT NULL DEFAULT 0,
  absent_days INTEGER NOT NULL DEFAULT 0,
  overtime_amount REAL NOT NULL DEFAULT 0,
  allowances REAL NOT NULL DEFAULT 0,
  deductions REAL NOT NULL DEFAULT 0,
  gross_pay REAL NOT NULL DEFAULT 0,
  net_pay REAL NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Bank Transfer' CHECK(payment_method IN ('Bank Transfer','Cash','Cheque')),
  paid_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(period_month);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period_month);
CREATE INDEX IF NOT EXISTS idx_payslips_staff ON payslips(staff_id);
CREATE INDEX IF NOT EXISTS idx_payslips_run ON payslips(payroll_run_id);

-- ── Medical Reports ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_no TEXT UNIQUE,
  staff_id INTEGER,
  person_name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'Checkup' CHECK(report_type IN ('Fitness Certificate','Checkup','Injury','Insurance','Other')),
  report_date TEXT NOT NULL,
  provider TEXT,
  summary TEXT,
  result TEXT NOT NULL DEFAULT 'N/A' CHECK(result IN ('Fit','Unfit','Follow-up','N/A')),
  next_checkup_date TEXT,
  attachment_id INTEGER,
  confidential INTEGER NOT NULL DEFAULT 1,
  recorded_by INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  FOREIGN KEY (attachment_id) REFERENCES attachments(id)
);

CREATE INDEX IF NOT EXISTS idx_medical_reports_staff ON medical_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_date ON medical_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_medical_reports_checkup ON medical_reports(next_checkup_date);

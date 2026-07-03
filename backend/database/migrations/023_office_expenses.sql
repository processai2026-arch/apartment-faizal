-- Office Expense Management Module (Petty Cash & Cheque Payments)

CREATE TABLE IF NOT EXISTS office_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_no TEXT UNIQUE,
  category TEXT NOT NULL DEFAULT 'Other',
  payment_method TEXT NOT NULL DEFAULT 'Petty Cash',
  payee TEXT,
  description TEXT,
  amount REAL NOT NULL DEFAULT 0,
  expense_date TEXT,
  cheque_no TEXT,
  cheque_date TEXT,
  bank_name TEXT,
  cheque_front_attachment_id INTEGER,
  cheque_back_attachment_id INTEGER,
  receipt_attachment_id INTEGER,
  status TEXT NOT NULL DEFAULT 'Pending',
  approved_by INTEGER,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_office_expenses_date ON office_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_office_expenses_method ON office_expenses(payment_method);
CREATE INDEX IF NOT EXISTS idx_office_expenses_status ON office_expenses(status);

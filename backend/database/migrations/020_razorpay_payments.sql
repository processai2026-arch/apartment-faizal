-- Razorpay Payment Integration (P24)
-- SQLite: ALTER TABLE ... ADD COLUMN is supported one column at a time

ALTER TABLE invoices ADD COLUMN razorpay_order_id TEXT;
ALTER TABLE invoices ADD COLUMN razorpay_payment_id TEXT;
ALTER TABLE invoices ADD COLUMN razorpay_signature TEXT;
ALTER TABLE invoices ADD COLUMN payment_method TEXT;
ALTER TABLE invoices ADD COLUMN payment_gateway_status TEXT;
ALTER TABLE invoices ADD COLUMN payment_initiated_at TEXT;
ALTER TABLE invoices ADD COLUMN payment_completed_at TEXT;
ALTER TABLE invoices ADD COLUMN refund_id TEXT;
ALTER TABLE invoices ADD COLUMN refund_status TEXT DEFAULT 'None';

CREATE TABLE IF NOT EXISTS payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  payment_method TEXT,
  error_code TEXT,
  error_description TEXT,
  webhook_received INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment ON payment_transactions(razorpay_payment_id);

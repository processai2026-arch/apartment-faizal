CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  vendor TEXT,
  purchase_date TEXT,
  used_quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  used_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_item_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('in','out','adjust')),
  quantity INTEGER NOT NULL,
  location TEXT,
  used_by TEXT,
  notes TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS utility_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  last_completed TEXT,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK(status IN ('Upcoming','Overdue','Done')),
  assigned_staff TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  office_id INTEGER,
  invoice_no TEXT NOT NULL UNIQUE,
  description TEXT,
  amount REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Paid','Overdue','Cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  paid_at TEXT NOT NULL,
  mode TEXT,
  reference_no TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE TABLE IF NOT EXISTS gate_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  scope TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ui_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  page_key TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE(user_id, page_key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL,
  original_name TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT NOT NULL UNIQUE,
  user_id INTEGER,
  route TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

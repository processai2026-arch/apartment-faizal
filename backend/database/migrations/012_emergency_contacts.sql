-- Emergency Contacts Module

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  address TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  available_24h INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

-- Seed essential emergency contacts
INSERT OR IGNORE INTO emergency_contacts (name, category, phone, available_24h, is_pinned, priority, status, created_at) VALUES
  ('Police Control Room', 'Police', '100', 1, 1, 1, 'Active', datetime('now')),
  ('Fire Brigade', 'Fire', '101', 1, 1, 2, 'Active', datetime('now')),
  ('Ambulance', 'Ambulance', '102', 1, 1, 3, 'Active', datetime('now')),
  ('Disaster Management', 'Hospital', '108', 1, 0, 4, 'Active', datetime('now'));

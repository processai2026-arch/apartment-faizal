-- Daily Worker Management Module

CREATE TABLE IF NOT EXISTS daily_workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  worker_type TEXT NOT NULL DEFAULT 'General',
  photo_attachment_id INTEGER,
  id_proof_attachment_id INTEGER,
  address TEXT,
  office_id INTEGER,
  status TEXT NOT NULL DEFAULT 'Active',
  qr_code TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS worker_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  work_date TEXT NOT NULL,
  entry_time TEXT,
  exit_time TEXT,
  status TEXT NOT NULL DEFAULT 'Present',
  marked_by INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE(worker_id, work_date),
  FOREIGN KEY (worker_id) REFERENCES daily_workers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS worker_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  office_id INTEGER,
  entry_time TEXT NOT NULL,
  exit_time TEXT,
  authorized_by INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (worker_id) REFERENCES daily_workers(id) ON DELETE CASCADE
);

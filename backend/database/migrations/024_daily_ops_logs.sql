-- Facility & Daily Operations — Daily Activity Reports

CREATE TABLE IF NOT EXISTS cctv_daily_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_date TEXT NOT NULL,
  camera_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Working',   -- 'Working' | 'Faulty' | 'Offline'
  remarks TEXT,
  checked_by INTEGER,
  created_at TEXT NOT NULL,
  UNIQUE(check_date, camera_id),
  FOREIGN KEY (camera_id) REFERENCES camera_devices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cctv_daily_checks_date ON cctv_daily_checks(check_date);

CREATE TABLE IF NOT EXISTS water_lorry_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_date TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  vehicle_no TEXT,
  capacity_litres REAL,
  trips INTEGER NOT NULL DEFAULT 1,
  amount REAL,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_water_lorry_logs_date ON water_lorry_logs(log_date);

CREATE TABLE IF NOT EXISTS eb_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_date TEXT NOT NULL,
  meter_start REAL,
  meter_end REAL,
  power_cut_minutes INTEGER NOT NULL DEFAULT 0,
  generator_note TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_eb_logs_date ON eb_logs(log_date);

CREATE TABLE IF NOT EXISTS housekeeping_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_date TEXT NOT NULL,
  area TEXT NOT NULL,                        -- area / block
  task TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',    -- 'Done' | 'Pending' | 'Partial'
  staff_name TEXT,
  remarks TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_housekeeping_logs_date ON housekeeping_logs(log_date);

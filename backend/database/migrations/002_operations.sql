CREATE TABLE IF NOT EXISTS offices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block TEXT NOT NULL,
  floor_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  allocated_vehicle_count INTEGER NOT NULL DEFAULT 0,
  used_vehicle_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Inactive','Vacant')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  UNIQUE(block, floor_number, company_name)
);

CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  office_id INTEGER,
  block TEXT,
  floor_number TEXT,
  company_name TEXT NOT NULL,
  whom_to_meet TEXT NOT NULL,
  reason TEXT NOT NULL,
  vehicle_type TEXT,
  vehicle_no TEXT,
  status TEXT NOT NULL DEFAULT 'Inside' CHECK(status IN ('Inside','Exited')),
  entry_time TEXT NOT NULL,
  exit_time TEXT,
  guard_name TEXT,
  remarks TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE IF NOT EXISTS visitor_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('entry','checkout')),
  occurred_at TEXT NOT NULL,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_no TEXT NOT NULL,
  vehicle_no_normalized TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_model TEXT,
  owner_name TEXT,
  office_id INTEGER,
  block TEXT,
  floor_number TEXT,
  company_name TEXT,
  parking_user_type TEXT,
  status TEXT NOT NULL DEFAULT 'Inside' CHECK(status IN ('Inside','Exited')),
  entry_time TEXT NOT NULL,
  exit_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (office_id) REFERENCES offices(id)
);

CREATE TABLE IF NOT EXISTS vehicle_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('entry','checkout')),
  occurred_at TEXT NOT NULL,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  contact TEXT NOT NULL,
  join_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  attendance_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('P','A','H')),
  marked_by INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE(staff_id, attendance_date),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  service_type TEXT NOT NULL,
  category TEXT NOT NULL,
  contact TEXT NOT NULL,
  last_visit TEXT,
  next_visit TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status, entry_time);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status, entry_time);
CREATE INDEX IF NOT EXISTS idx_vehicles_active_no ON vehicles(vehicle_no_normalized, status);

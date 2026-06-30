CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  office_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Low' CHECK(priority IN ('Low','Medium','High','Emergency')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Assigned','In Progress','Completed','Cancelled')),
  assigned_vendor_id INTEGER,
  assigned_staff_id INTEGER,
  attachment_id INTEGER,
  expected_completion TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES users(id),
  FOREIGN KEY (office_id) REFERENCES offices(id),
  FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (assigned_staff_id) REFERENCES staff(id),
  FOREIGN KEY (attachment_id) REFERENCES attachments(id)
);

CREATE TABLE IF NOT EXISTS maintenance_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maintenance_request_id INTEGER NOT NULL,
  updated_by INTEGER,
  old_status TEXT,
  new_status TEXT NOT NULL,
  remarks TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (maintenance_request_id) REFERENCES maintenance_requests(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_office ON maintenance_requests(office_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_vendor ON maintenance_requests(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_staff ON maintenance_requests(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_updates_request ON maintenance_updates(maintenance_request_id);

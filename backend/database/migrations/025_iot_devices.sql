-- IoT & Hardware Automation Foundation (fault detection for lifts / electrical boards)

CREATE TABLE IF NOT EXISTS iot_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'other',   -- 'lift' | 'electrical_board' | 'sensor' | 'gateway' | 'other'
  protocol TEXT NOT NULL DEFAULT 'http',       -- 'http' | 'mqtt' | 'modbus'
  ip_address TEXT,
  io_lines INTEGER,                            -- number of I/O lines on the module (16-26 class)
  api_token TEXT UNIQUE,                       -- secret used in X-Device-Token header for /iot/ingest
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Active',       -- 'Active' | 'Inactive'
  last_seen_at TEXT,                           -- updated on every ingest/heartbeat
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_type ON iot_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_iot_devices_last_seen ON iot_devices(last_seen_at);

CREATE TABLE IF NOT EXISTS iot_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'fault',    -- 'fault' | 'voltage_fluctuation' | 'status_change' | 'heartbeat' | 'test'
  severity TEXT NOT NULL DEFAULT 'info',       -- 'info' | 'warning' | 'critical'
  io_line INTEGER,                             -- which input line triggered (optional)
  value TEXT,                                  -- scalar reading as text, e.g. '252.4'
  message TEXT,                                -- human-readable description from the device
  payload TEXT,                                -- raw JSON blob as sent by the device
  acknowledged_at TEXT,
  acknowledged_by INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (device_id) REFERENCES iot_devices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_iot_events_device ON iot_events(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_events_type ON iot_events(event_type);
CREATE INDEX IF NOT EXISTS idx_iot_events_severity ON iot_events(severity);
CREATE INDEX IF NOT EXISTS idx_iot_events_created ON iot_events(created_at);
CREATE INDEX IF NOT EXISTS idx_iot_events_ack ON iot_events(acknowledged_at);

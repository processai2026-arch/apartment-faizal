-- CCTV Integration Foundation

CREATE TABLE IF NOT EXISTS camera_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  zone TEXT,                          -- e.g. 'Entrance', 'Parking', 'Lobby', 'Corridor', 'Perimeter'
  rtsp_url TEXT,                      -- Future: RTSP stream URL
  ip_address TEXT,
  port INTEGER DEFAULT 554,
  username TEXT,
  password_hash TEXT,                 -- store encrypted, never plain text
  manufacturer TEXT,
  model TEXT,
  resolution TEXT,                    -- e.g. '1080p', '4K'
  status TEXT NOT NULL DEFAULT 'Offline',   -- 'Online' | 'Offline' | 'Maintenance' | 'Fault'
  last_heartbeat TEXT,
  snapshot_url TEXT,                  -- URL of latest snapshot
  is_recording INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_camera_devices_status ON camera_devices(status);
CREATE INDEX IF NOT EXISTS idx_camera_devices_zone ON camera_devices(zone);

CREATE TABLE IF NOT EXISTS camera_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camera_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,  -- 'Motion' | 'Unknown Person' | 'Vehicle' | 'Intrusion' | 'Tamper' | 'Offline' | 'Online' | 'Manual'
  severity TEXT NOT NULL DEFAULT 'Low',   -- 'Low' | 'Medium' | 'High' | 'Critical'
  description TEXT,
  snapshot_id INTEGER,
  metadata TEXT,              -- JSON blob for future AI metadata
  acknowledged INTEGER NOT NULL DEFAULT 0,
  acknowledged_by INTEGER,
  acknowledged_at TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (camera_id) REFERENCES camera_devices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_camera_events_camera ON camera_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_type ON camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_occurred ON camera_events(occurred_at);

CREATE TABLE IF NOT EXISTS camera_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camera_id INTEGER NOT NULL,
  file_path TEXT,
  file_url TEXT,
  captured_at TEXT NOT NULL,
  trigger TEXT DEFAULT 'Manual',   -- 'Manual' | 'Motion' | 'Scheduled' | 'Event'
  event_id INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (camera_id) REFERENCES camera_devices(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_camera_snapshots_camera ON camera_snapshots(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_snapshots_captured ON camera_snapshots(captured_at);

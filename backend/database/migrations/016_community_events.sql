-- Community Events & Notice Board

CREATE TABLE IF NOT EXISTS community_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  organizer TEXT,
  event_date TEXT NOT NULL,         -- ISO date YYYY-MM-DD
  event_time TEXT,                   -- HH:MM
  image_attachment_id INTEGER,
  attachment_id INTEGER,
  capacity INTEGER DEFAULT 0,       -- 0 = unlimited
  registration_required INTEGER NOT NULL DEFAULT 0,  -- boolean
  status TEXT NOT NULL DEFAULT 'Draft', -- Draft | Published | Cancelled | Completed
  created_by INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_community_events_date ON community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_events_status ON community_events(status);

CREATE TABLE IF NOT EXISTS event_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'Registered', -- Registered | Cancelled | Attended
  registered_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (event_id) REFERENCES community_events(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_reg_unique ON event_registrations(event_id, user_id) WHERE user_id IS NOT NULL;

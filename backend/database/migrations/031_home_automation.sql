-- Home Automation (Phase 1: Home Assistant REST connector per client)
-- A hub row holds a client's Home Assistant base URL + long-lived access token.
-- The token is server-side only: never returned in API responses (masked).

CREATE TABLE IF NOT EXISTS home_automation_hubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_user_id INTEGER,                        -- the requesting client/tenant user (nullable)
  office_id INTEGER,                            -- optional office linkage
  provider TEXT NOT NULL DEFAULT 'home_assistant',
  base_url TEXT NOT NULL,                       -- e.g. https://xxx.ui.nabu.casa
  access_token TEXT NOT NULL,                   -- HA long-lived token; server-side only
  status TEXT NOT NULL DEFAULT 'Active',        -- 'Active' | 'Disabled'
  last_check_at TEXT,
  last_check_ok INTEGER,                        -- 1 reachable, 0 failed, NULL never checked
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_ha_hubs_owner ON home_automation_hubs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_ha_hubs_status ON home_automation_hubs(status);

CREATE TABLE IF NOT EXISTS home_automation_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hub_id INTEGER NOT NULL,
  entity_id TEXT NOT NULL,                      -- e.g. switch.living_room
  friendly_name TEXT,
  domain TEXT NOT NULL DEFAULT 'other',         -- 'switch' | 'light' | 'sensor' | 'climate' | 'cover' | 'other'
  is_controllable INTEGER NOT NULL DEFAULT 1,
  visible_to_owner INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (hub_id) REFERENCES home_automation_hubs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ha_devices_hub ON home_automation_devices(hub_id);
CREATE INDEX IF NOT EXISTS idx_ha_devices_entity ON home_automation_devices(entity_id);

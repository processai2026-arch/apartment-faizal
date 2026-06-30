-- Migration 014: Secretary Portal (P15)
-- Add is_secretary column to users safely (SQLite does not support IF NOT EXISTS for columns)
ALTER TABLE users ADD COLUMN is_secretary INTEGER NOT NULL DEFAULT 0;

-- Secretary module permissions table
CREATE TABLE IF NOT EXISTS secretary_permissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  module      TEXT    NOT NULL,
  can_view    INTEGER NOT NULL DEFAULT 1,
  can_edit    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL,
  updated_at  TEXT,
  UNIQUE(user_id, module),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_secretary_permissions_user ON secretary_permissions(user_id);

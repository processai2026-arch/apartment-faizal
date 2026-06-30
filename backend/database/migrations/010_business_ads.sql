-- Local Business Advertisement Module

CREATE TABLE IF NOT EXISTS business_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS business_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  business_name TEXT NOT NULL,
  description TEXT,
  offer TEXT,
  website TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  logo_attachment_id INTEGER,
  banner_attachment_id INTEGER,
  featured INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  expires_at TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (category_id) REFERENCES business_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_id INTEGER NOT NULL,
  user_id INTEGER,
  click_type TEXT NOT NULL DEFAULT 'view',
  ip_address TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (ad_id) REFERENCES business_ads(id) ON DELETE CASCADE
);

-- Seed default categories
INSERT OR IGNORE INTO business_categories (name, slug, icon, created_at) VALUES
  ('Food & Dining', 'food-dining', 'UtensilsCrossed', datetime('now')),
  ('Grocery & Supermarket', 'grocery', 'ShoppingCart', datetime('now')),
  ('Healthcare & Pharmacy', 'healthcare', 'HeartPulse', datetime('now')),
  ('Beauty & Wellness', 'beauty', 'Sparkles', datetime('now')),
  ('Education & Tutoring', 'education', 'BookOpen', datetime('now')),
  ('Repair & Services', 'repair', 'Wrench', datetime('now')),
  ('Fitness & Sports', 'fitness', 'Dumbbell', datetime('now')),
  ('Transport & Logistics', 'transport', 'Truck', datetime('now'));

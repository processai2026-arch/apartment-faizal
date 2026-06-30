-- Advertisement Billing & Analytics Extension

CREATE TABLE IF NOT EXISTS ad_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_impressions INTEGER DEFAULT 0,
  features TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS ad_billing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_id INTEGER NOT NULL,
  package_id INTEGER,
  amount REAL NOT NULL DEFAULT 0,
  billing_status TEXT NOT NULL DEFAULT 'Pending',
  due_date TEXT,
  paid_at TEXT,
  payment_ref TEXT,
  renewal_reminded INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (ad_id) REFERENCES business_ads(id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES ad_packages(id)
);
CREATE INDEX IF NOT EXISTS idx_ad_billing_ad ON ad_billing(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_billing_status ON ad_billing(billing_status);

ALTER TABLE business_ads ADD COLUMN impressions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE business_ads ADD COLUMN clicks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE business_ads ADD COLUMN ctr REAL NOT NULL DEFAULT 0;
ALTER TABLE business_ads ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE business_ads ADD COLUMN package_id INTEGER;
ALTER TABLE business_ads ADD COLUMN expires_at_billing TEXT;
ALTER TABLE business_ads ADD COLUMN renewal_notified INTEGER NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO ad_packages (name, description, price, duration_days, max_impressions, features, is_active, sort_order, created_at) VALUES
  ('Basic', 'Standard listing for 30 days', 499, 30, 0, '["30-day listing","Standard placement","Click tracking"]', 1, 1, datetime('now')),
  ('Standard', 'Enhanced listing with impressions tracking', 999, 60, 10000, '["60-day listing","Enhanced placement","Impressions & CTR analytics","Email report"]', 1, 2, datetime('now')),
  ('Premium', 'Featured placement with full analytics', 1999, 90, 0, '["90-day listing","Featured badge","Top placement","Full analytics","Renewal reminder"]', 1, 3, datetime('now')),
  ('Featured', 'Maximum visibility sponsorship', 4999, 180, 0, '["180-day listing","Sponsored badge","Homepage banner","All analytics","Priority support","Custom design"]', 1, 4, datetime('now'));

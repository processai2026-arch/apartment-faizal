-- Premium Membership & Revenue System (P22)

CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly REAL NOT NULL DEFAULT 0,
  price_yearly REAL NOT NULL DEFAULT 0,
  features TEXT,
  max_listings INTEGER DEFAULT 3,
  max_ads INTEGER DEFAULT 1,
  analytics_access INTEGER NOT NULL DEFAULT 0,
  featured_vendor INTEGER NOT NULL DEFAULT 0,
  featured_rental INTEGER NOT NULL DEFAULT 0,
  priority_support INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  billing_cycle TEXT NOT NULL DEFAULT 'Monthly',
  started_at TEXT NOT NULL,
  expires_at TEXT,
  cancelled_at TEXT,
  amount_paid REAL NOT NULL DEFAULT 0,
  payment_ref TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE TABLE IF NOT EXISTS premium_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  min_plan TEXT NOT NULL DEFAULT 'premium',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

-- Seed default plans
INSERT OR IGNORE INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, max_listings, max_ads, analytics_access, featured_vendor, featured_rental, priority_support, is_active, sort_order, created_at)
VALUES
  ('Free', 'free', 'Basic access for all residents', 0, 0, '["3 rental listings","1 business ad","Basic notifications"]', 3, 1, 0, 0, 0, 0, 1, 1, datetime('now')),
  ('Premium', 'premium', 'Enhanced access with analytics and featured listings', 299, 2999, '["Unlimited rental listings","5 business ads","Community analytics","Featured vendor profile","Priority support","Advanced reports"]', -1, 5, 1, 1, 1, 1, 1, 2, datetime('now')),
  ('Enterprise', 'enterprise', 'Full platform access for property managers', 999, 9999, '["Everything in Premium","Custom branding","API access","Dedicated support","All premium features"]', -1, -1, 1, 1, 1, 1, 1, 3, datetime('now'));

-- Seed premium features
INSERT OR IGNORE INTO premium_features (feature_key, feature_name, description, min_plan, is_active, created_at) VALUES
  ('featured_vendor', 'Featured Vendor Profile', 'Appear at top of vendor listings', 'premium', 1, datetime('now')),
  ('featured_rental', 'Featured Rental Listing', 'Highlight rental listings', 'premium', 1, datetime('now')),
  ('analytics_access', 'Community Analytics', 'Access to full analytics dashboard', 'premium', 1, datetime('now')),
  ('priority_ads', 'Priority Ad Placement', 'Ads shown at premium positions', 'premium', 1, datetime('now')),
  ('unlimited_listings', 'Unlimited Listings', 'No cap on rental or ad listings', 'premium', 1, datetime('now'));

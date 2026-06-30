-- Vendor Marketplace: extend the existing vendors table (no duplicate vendor table)
-- and add supporting marketplace tables. SQLite dialect (one ADD COLUMN per statement).

ALTER TABLE vendors ADD COLUMN description TEXT;
ALTER TABLE vendors ADD COLUMN service_area TEXT;
ALTER TABLE vendors ADD COLUMN availability TEXT;
ALTER TABLE vendors ADD COLUMN rating_avg REAL NOT NULL DEFAULT 0;
ALTER TABLE vendors ADD COLUMN review_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vendors ADD COLUMN booking_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vendors ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vendors ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vendors ADD COLUMN category_id INTEGER;

CREATE TABLE IF NOT EXISTS vendor_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS vendor_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL,
  unit TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TABLE IF NOT EXISTS vendor_gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  attachment_id INTEGER,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (attachment_id) REFERENCES attachments(id)
);

CREATE TABLE IF NOT EXISTS vendor_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  booking_id INTEGER,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  attachment_id INTEGER,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Hidden')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES vendor_bookings(id),
  FOREIGN KEY (attachment_id) REFERENCES attachments(id)
);

CREATE TABLE IF NOT EXISTS vendor_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  office_id INTEGER,
  service_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_for TEXT,
  status TEXT NOT NULL DEFAULT 'Requested' CHECK(status IN ('Requested','Confirmed','In Progress','Completed','Cancelled')),
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (office_id) REFERENCES offices(id),
  FOREIGN KEY (service_id) REFERENCES vendor_services(id)
);

CREATE INDEX IF NOT EXISTS idx_vendors_featured ON vendors(is_featured, rating_avg);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor ON vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_gallery_vendor ON vendor_gallery(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor ON vendor_reviews(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_user ON vendor_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_vendor ON vendor_bookings(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_user ON vendor_bookings(user_id);

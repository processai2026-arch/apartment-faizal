-- Rental Marketplace: listings, images, views, favorites

CREATE TABLE IF NOT EXISTS rental_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  office_id INTEGER,
  owner_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  listing_type TEXT NOT NULL DEFAULT 'Rent',
  property_type TEXT NOT NULL DEFAULT 'Office',
  price REAL,
  deposit REAL,
  area_sqft REAL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  furnishing TEXT,
  available_from TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  featured INTEGER NOT NULL DEFAULT 0,
  contact_name TEXT,
  contact_phone TEXT,
  admin_notes TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS listing_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  attachment_id INTEGER,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (listing_id) REFERENCES rental_listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listing_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  user_id INTEGER,
  ip_address TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES rental_listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listing_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(listing_id, user_id),
  FOREIGN KEY (listing_id) REFERENCES rental_listings(id) ON DELETE CASCADE
);

-- Approval workflow history
CREATE TABLE IF NOT EXISTS listing_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  changed_by INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES rental_listings(id) ON DELETE CASCADE
);

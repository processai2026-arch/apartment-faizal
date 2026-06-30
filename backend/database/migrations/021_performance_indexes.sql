-- Performance Indexes: Prompt 25 Optimization Pass
-- All indexes use IF NOT EXISTS to be safe on re-run.
-- Existing indexes (from migrations 001-020) are NOT duplicated here.

-- visitors: deleted_at (status+entry_time already indexed in 002)
CREATE INDEX IF NOT EXISTS idx_visitors_deleted_at ON visitors(deleted_at);

-- vehicles: deleted_at (status+entry_time and vehicle_no_normalized already indexed in 002)
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at);

-- staff: status, deleted_at (no existing indexes)
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_deleted_at ON staff(deleted_at);

-- complaints: priority, deleted_at (status+created_at, tenant, office, vendor already indexed in 005)
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_deleted_at ON complaints(deleted_at);

-- maintenance_requests: deleted_at (status+created_at, tenant, office, vendor, staff already indexed in 007)
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_deleted_at ON maintenance_requests(deleted_at);

-- notifications: all needed indexes already present in 006; add composite for unread+role query
CREATE INDEX IF NOT EXISTS idx_notifications_unread_role ON notifications(is_read, deleted_at, created_at);

-- vendor_bookings: explicit status index, deleted_at (vendor+status and user already indexed in 008)
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_status ON vendor_bookings(status);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_deleted_at ON vendor_bookings(deleted_at);

-- rental_listings: no indexes existed; add all commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_rental_listings_status ON rental_listings(status);
CREATE INDEX IF NOT EXISTS idx_rental_listings_deleted_at ON rental_listings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_rental_listings_created_at ON rental_listings(created_at);
CREATE INDEX IF NOT EXISTS idx_rental_listings_owner ON rental_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_status_deleted ON rental_listings(status, deleted_at, created_at);

-- business_ads: no indexes existed
CREATE INDEX IF NOT EXISTS idx_business_ads_status ON business_ads(status);
CREATE INDEX IF NOT EXISTS idx_business_ads_deleted_at ON business_ads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_business_ads_category ON business_ads(category_id);
CREATE INDEX IF NOT EXISTS idx_business_ads_featured ON business_ads(featured, status);

-- announcements: no indexes existed
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_deleted_at ON announcements(deleted_at);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_at ON announcements(publish_at);
CREATE INDEX IF NOT EXISTS idx_announcements_status_publish ON announcements(status, publish_at, deleted_at);

-- community_events: event_date and status already indexed in 016; add deleted_at
CREATE INDEX IF NOT EXISTS idx_community_events_deleted_at ON community_events(deleted_at);

-- daily_workers: no indexes existed
CREATE INDEX IF NOT EXISTS idx_daily_workers_status ON daily_workers(status);
CREATE INDEX IF NOT EXISTS idx_daily_workers_deleted_at ON daily_workers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_daily_workers_office ON daily_workers(office_id);

-- worker_attendance: work_date is used in GROUP BY queries
CREATE INDEX IF NOT EXISTS idx_worker_attendance_date ON worker_attendance(work_date);
CREATE INDEX IF NOT EXISTS idx_worker_attendance_worker_date ON worker_attendance(worker_id, work_date);

-- users: role is frequently filtered (notifications, access control)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- vendors: status and deleted_at for list queries
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at ON vendors(deleted_at);

-- Add deleted_at to worker_attendance so it works with CrudModel's soft-delete
-- aware queries (list/find/update all filter on deleted_at IS NULL).
ALTER TABLE worker_attendance ADD COLUMN deleted_at TEXT;

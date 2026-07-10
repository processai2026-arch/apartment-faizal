-- Super Admin Task Manager
CREATE TABLE IF NOT EXISTS super_tasks (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
  category VARCHAR(100),
  due_date DATE,
  due_time TIME,
  completed_at DATETIME,
  created_by INTEGER,
  assigned_to VARCHAR(255),
  notes TEXT,
  tags VARCHAR(500),
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  deleted_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_super_tasks_status ON super_tasks(status);
CREATE INDEX IF NOT EXISTS idx_super_tasks_due ON super_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_super_tasks_priority ON super_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_super_tasks_created_by ON super_tasks(created_by);

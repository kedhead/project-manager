-- Migration 014: Additional performance indexes
-- Description: Advanced indexes for common query patterns and performance optimization

-- Composite indexes for frequently joined tables
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_project_dates ON tasks(project_id, start_date, end_date) WHERE deleted_at IS NULL;

-- Index for Gantt chart queries (tasks ordered by dates within project)
CREATE INDEX idx_tasks_gantt_view ON tasks(project_id, start_date, end_date, position)
    WHERE deleted_at IS NULL AND parent_task_id IS NULL;

-- Index for subtask queries
CREATE INDEX idx_tasks_subtasks ON tasks(parent_task_id, position) WHERE deleted_at IS NULL;

-- Index for overdue tasks
CREATE INDEX idx_tasks_overdue ON tasks(end_date, status)
    WHERE deleted_at IS NULL AND status != 'completed' AND status != 'cancelled';

-- Index for upcoming deadlines (notification queries)
CREATE INDEX idx_tasks_upcoming_deadlines ON tasks(assigned_to, end_date, status)
    WHERE deleted_at IS NULL AND status NOT IN ('completed', 'cancelled');

-- Index for project activity feed
CREATE INDEX idx_activity_logs_project_recent ON activity_logs(project_id, created_at DESC);

-- Index for user activity feed
CREATE INDEX idx_activity_logs_user_recent ON activity_logs(user_id, created_at DESC);

-- Partial index for active sessions only
CREATE INDEX idx_sessions_active_users ON sessions(user_id, last_activity_at DESC)
    WHERE is_active = true AND expires_at > CURRENT_TIMESTAMP;

-- Index for file storage statistics
CREATE INDEX idx_file_attachments_storage_stats ON file_attachments(uploaded_by, file_size)
    WHERE deleted_at IS NULL;

-- Index for unread notification count queries
CREATE INDEX idx_notifications_unread_count ON notifications(user_id)
    WHERE is_read = false;

-- Index for task search by title (using trigram for fuzzy search)
-- Requires pg_trgm extension: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_tasks_title_trgm ON tasks USING GIN (title gin_trgm_ops) WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON INDEX idx_tasks_project_status IS 'Optimizes queries filtering tasks by project and status';
COMMENT ON INDEX idx_tasks_gantt_view IS 'Optimizes Gantt chart view queries (top-level tasks with date ordering)';
COMMENT ON INDEX idx_tasks_overdue IS 'Quickly identifies overdue tasks for alerts and reports';
COMMENT ON INDEX idx_activity_logs_project_recent IS 'Optimizes project activity feed queries';
COMMENT ON INDEX idx_sessions_active_users IS 'Tracks currently active user sessions for real-time features';

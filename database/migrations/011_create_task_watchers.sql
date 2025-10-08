-- Migration 011: Create task_watchers table
-- Description: Tracks users watching tasks for notifications

-- Drop existing table if exists
DROP TABLE IF EXISTS task_watchers CASCADE;

-- Create task_watchers table (junction table)
CREATE TABLE task_watchers (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    watch_started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_task_watcher UNIQUE(task_id, user_id)
);

-- Create indexes
CREATE INDEX idx_task_watchers_task_id ON task_watchers(task_id);
CREATE INDEX idx_task_watchers_user_id ON task_watchers(user_id);

-- Add table comment
COMMENT ON TABLE task_watchers IS 'Junction table for users watching tasks. Watchers receive notifications for all task updates.';

-- Add column comments
COMMENT ON COLUMN task_watchers.watch_started_at IS 'Timestamp when user started watching this task';

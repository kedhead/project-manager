-- Migration 008: Create activity_logs table
-- Description: Audit trail for all important actions in the system

-- Drop existing table if exists
DROP TABLE IF EXISTS activity_logs CASCADE;

-- Create entity type enum
DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM (
        'project',
        'task',
        'comment',
        'file_attachment',
        'project_member',
        'task_dependency'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create action type enum
DO $$ BEGIN
    CREATE TYPE action_type AS ENUM (
        'created',
        'updated',
        'deleted',
        'restored',
        'assigned',
        'unassigned',
        'completed',
        'reopened',
        'commented',
        'uploaded',
        'invited',
        'removed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create activity_logs table
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- NULL if user deleted
    entity_type entity_type NOT NULL,
    entity_id BIGINT NOT NULL, -- ID of the entity that was modified
    action action_type NOT NULL,
    changes JSONB, -- Store before/after values for updates
    metadata JSONB, -- Additional context (IP address, user agent, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for JSONB columns (GIN index for efficient querying)
    -- These can be added after initial migration if needed
    -- CREATE INDEX idx_activity_logs_changes ON activity_logs USING GIN (changes);
    -- CREATE INDEX idx_activity_logs_metadata ON activity_logs USING GIN (metadata);

    -- Constraints
    CONSTRAINT entity_id_positive CHECK (entity_id > 0)
);

-- Create indexes
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC); -- DESC for recent activity queries
CREATE INDEX idx_activity_logs_changes ON activity_logs USING GIN (changes);

-- Add table comment
COMMENT ON TABLE activity_logs IS 'Immutable audit trail of all system actions. Never delete records from this table. Used for activity feeds, change tracking, and compliance.';

-- Add column comments
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity that was modified';
COMMENT ON COLUMN activity_logs.entity_id IS 'ID of the specific entity (e.g., task_id, comment_id)';
COMMENT ON COLUMN activity_logs.action IS 'Action performed on the entity';
COMMENT ON COLUMN activity_logs.changes IS 'JSONB object with before/after values for updates. Example: {"field": "status", "old": "in_progress", "new": "completed"}';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional context like IP address, user agent, API client, etc.';

-- Example changes JSONB structure:
-- For updates: {"field": "status", "old_value": "in_progress", "new_value": "completed"}
-- For creates: {"fields": {"title": "New Task", "priority": "high"}}
-- For deletes: {"deleted_entity": {"id": 123, "title": "Old Task"}}

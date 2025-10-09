-- Migration: Add Groups/Teams Feature
-- This adds the ability to create groups within projects and assign tasks to groups

-- Create groups table
CREATE TABLE groups (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code for UI
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT group_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT group_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create group_members junction table
CREATE TABLE group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique membership
    CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

-- Add assigned_group_id to tasks table
ALTER TABLE tasks
ADD COLUMN assigned_group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL;

-- Add constraint: task can be assigned to person OR group, not both
ALTER TABLE tasks
ADD CONSTRAINT task_assignment_check CHECK (
    (assigned_to IS NOT NULL AND assigned_group_id IS NULL) OR
    (assigned_to IS NULL AND assigned_group_id IS NOT NULL) OR
    (assigned_to IS NULL AND assigned_group_id IS NULL)
);

-- Create indexes for performance
CREATE INDEX idx_groups_project_id ON groups(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_tasks_assigned_group ON tasks(assigned_group_id) WHERE deleted_at IS NULL;

-- Update trigger for groups updated_at
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE groups IS 'Project groups/teams for task assignment';
COMMENT ON TABLE group_members IS 'Members belonging to groups';
COMMENT ON COLUMN tasks.assigned_group_id IS 'Group assigned to this task (mutually exclusive with assigned_to)';

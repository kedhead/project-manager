-- Migration 003: Create project_members table
-- Description: Maps users to projects with role-based permissions

-- Drop existing table if exists
DROP TABLE IF EXISTS project_members CASCADE;

-- Create project role enum type
DO $$ BEGIN
    CREATE TYPE project_role AS ENUM ('owner', 'manager', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create project_members table (junction table)
CREATE TABLE project_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role project_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by BIGINT REFERENCES users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT unique_project_user UNIQUE(project_id, user_id)
);

-- Create indexes
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);
CREATE INDEX idx_project_members_invited_by ON project_members(invited_by);

-- Add table comment
COMMENT ON TABLE project_members IS 'Junction table mapping users to projects with role-based permissions. Roles: owner (full control), manager (can manage tasks/members), member (can create/edit tasks), viewer (read-only).';

-- Add column comments
COMMENT ON COLUMN project_members.role IS 'Permission level: owner > manager > member > viewer';
COMMENT ON COLUMN project_members.invited_by IS 'User who invited this member (NULL if self-created or inviter deleted)';
COMMENT ON COLUMN project_members.joined_at IS 'Timestamp when user was added to project';

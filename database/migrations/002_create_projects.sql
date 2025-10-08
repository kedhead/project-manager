-- Migration 002: Create projects table
-- Description: Stores project information and metadata

-- Drop existing table if exists
DROP TABLE IF EXISTS projects CASCADE;

-- Create project status enum type
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create projects table
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status project_status NOT NULL DEFAULT 'planning',
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ, -- Soft delete support

    -- Constraints
    CONSTRAINT project_name_length_check CHECK (LENGTH(TRIM(name)) >= 1),
    CONSTRAINT project_dates_check CHECK (
        (start_date IS NULL AND end_date IS NULL) OR
        (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date)
    )
);

-- Create indexes
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_start_date ON projects(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_end_date ON projects(end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add table comment
COMMENT ON TABLE projects IS 'Stores project metadata. Each project can have multiple tasks and members. Uses RESTRICT on created_by to prevent deletion of users who created projects.';

-- Add column comments
COMMENT ON COLUMN projects.status IS 'Current project status: planning, active, on_hold, completed, or cancelled';
COMMENT ON COLUMN projects.created_by IS 'User who created the project (cannot be deleted while project exists)';
COMMENT ON COLUMN projects.start_date IS 'Planned start date (can be NULL for projects without defined timeline)';
COMMENT ON COLUMN projects.end_date IS 'Planned end date (must be >= start_date if both are set)';
COMMENT ON COLUMN projects.deleted_at IS 'Timestamp for soft delete (NULL = not deleted)';

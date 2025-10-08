-- Migration 004: Create tasks table
-- Description: Stores project tasks with scheduling and assignment information

-- Drop existing table if exists
DROP TABLE IF EXISTS tasks CASCADE;

-- Create task status enum type
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create task priority enum type
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tasks table
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    duration INTEGER, -- Duration in days
    progress INTEGER NOT NULL DEFAULT 0,
    status task_status NOT NULL DEFAULT 'not_started',
    priority task_priority NOT NULL DEFAULT 'medium',
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    parent_task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE, -- For subtasks
    position INTEGER NOT NULL DEFAULT 0, -- For ordering tasks within a project
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ, -- Soft delete support

    -- Constraints
    CONSTRAINT task_title_length_check CHECK (LENGTH(TRIM(title)) >= 1),
    CONSTRAINT task_progress_range_check CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT task_dates_check CHECK (
        (start_date IS NULL AND end_date IS NULL) OR
        (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date)
    ),
    CONSTRAINT task_duration_check CHECK (duration IS NULL OR duration > 0),
    CONSTRAINT task_estimated_hours_check CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
    CONSTRAINT task_actual_hours_check CHECK (actual_hours IS NULL OR actual_hours >= 0),
    CONSTRAINT task_completed_status_check CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- Create indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_start_date ON tasks(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_end_date ON tasks(end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_position ON tasks(project_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add table comment
COMMENT ON TABLE tasks IS 'Stores project tasks with scheduling, assignment, and progress tracking. Supports hierarchical subtasks via parent_task_id self-reference.';

-- Add column comments
COMMENT ON COLUMN tasks.duration IS 'Task duration in days (for Gantt chart scheduling)';
COMMENT ON COLUMN tasks.progress IS 'Completion percentage (0-100)';
COMMENT ON COLUMN tasks.parent_task_id IS 'Self-referential FK for subtasks (NULL = top-level task)';
COMMENT ON COLUMN tasks.position IS 'Integer for custom ordering within project (lower values appear first)';
COMMENT ON COLUMN tasks.estimated_hours IS 'Estimated effort in hours';
COMMENT ON COLUMN tasks.actual_hours IS 'Actual time spent in hours';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was marked as completed';
COMMENT ON COLUMN tasks.deleted_at IS 'Timestamp for soft delete (NULL = not deleted)';

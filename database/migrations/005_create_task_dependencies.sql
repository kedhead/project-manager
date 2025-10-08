-- Migration 005: Create task_dependencies table
-- Description: Stores task dependency relationships for Gantt chart visualization

-- Drop existing table if exists
DROP TABLE IF EXISTS task_dependencies CASCADE;

-- Create dependency type enum
DO $$ BEGIN
    CREATE TYPE dependency_type AS ENUM (
        'finish_to_start',  -- Predecessor must finish before successor starts (most common)
        'start_to_start',   -- Both tasks start at the same time
        'finish_to_finish', -- Both tasks finish at the same time
        'start_to_finish'   -- Predecessor must start before successor finishes (rare)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create task_dependencies table
CREATE TABLE task_dependencies (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, -- Dependent task (successor)
    depends_on_task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, -- Prerequisite task (predecessor)
    dependency_type dependency_type NOT NULL DEFAULT 'finish_to_start',
    lag_time INTEGER NOT NULL DEFAULT 0, -- Lag time in days (can be negative for lead time)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_task_dependency UNIQUE(task_id, depends_on_task_id),
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

-- Create indexes
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);
CREATE INDEX idx_task_dependencies_both ON task_dependencies(task_id, depends_on_task_id);

-- Add table comment
COMMENT ON TABLE task_dependencies IS 'Defines directed dependencies between tasks for Gantt chart scheduling. Prevents circular dependencies via application logic.';

-- Add column comments
COMMENT ON COLUMN task_dependencies.task_id IS 'The dependent task (successor) - this task depends on another';
COMMENT ON COLUMN task_dependencies.depends_on_task_id IS 'The prerequisite task (predecessor) - the task that must be completed first';
COMMENT ON COLUMN task_dependencies.dependency_type IS 'Type of dependency relationship: finish_to_start (default), start_to_start, finish_to_finish, or start_to_finish';
COMMENT ON COLUMN task_dependencies.lag_time IS 'Lag/lead time in days. Positive = delay after predecessor, Negative = start before predecessor completes';

-- Example dependency scenarios:
-- finish_to_start: Task B starts after Task A finishes (default)
-- start_to_start: Task B starts when Task A starts (parallel tasks)
-- finish_to_finish: Task B finishes when Task A finishes
-- start_to_finish: Task B finishes when Task A starts (rare, used in just-in-time scenarios)

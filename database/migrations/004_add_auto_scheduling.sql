-- Add auto_scheduling field to projects table
-- This allows per-project control of automatic dependency cascading

ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_scheduling BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN projects.auto_scheduling IS 'Enable automatic task rescheduling when dependencies change (default: false)';

-- Create index for querying projects with auto-scheduling enabled
CREATE INDEX IF NOT EXISTS idx_projects_auto_scheduling ON projects(auto_scheduling) WHERE auto_scheduling = true;

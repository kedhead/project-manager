-- Migration 012: Create tags and task_tags tables
-- Description: Support for task categorization and filtering

-- Drop existing tables if exist
DROP TABLE IF EXISTS task_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;

-- Create tags table
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280', -- Hex color code
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT tag_name_length_check CHECK (LENGTH(TRIM(name)) >= 1),
    CONSTRAINT tag_color_format_check CHECK (color ~* '^#[0-9A-F]{6}$'),
    CONSTRAINT unique_project_tag_name UNIQUE(project_id, name)
);

-- Create task_tags junction table
CREATE TABLE task_tags (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_task_tag UNIQUE(task_id, tag_id)
);

-- Create indexes
CREATE INDEX idx_tags_project_id ON tags(project_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

-- Add table comments
COMMENT ON TABLE tags IS 'Project-specific tags for categorizing and filtering tasks.';
COMMENT ON TABLE task_tags IS 'Junction table mapping tags to tasks (many-to-many relationship).';

-- Add column comments
COMMENT ON COLUMN tags.color IS 'Hex color code for visual tag representation (e.g., #3B82F6)';
COMMENT ON COLUMN tags.name IS 'Tag name unique within project (e.g., "Frontend", "Backend", "Bug")';

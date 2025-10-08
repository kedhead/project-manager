-- Migration 013: Create database triggers
-- Description: Automated timestamp updates and data consistency triggers

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-set completed_at when task status changes to completed
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
        NEW.progress = 100;
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_completed_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_completed_at();

-- Function to set is_edited flag on comments
CREATE OR REPLACE FUNCTION mark_comment_as_edited()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content != OLD.content THEN
        NEW.is_edited = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_comment_edited
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION mark_comment_as_edited();

-- Function to prevent circular task dependencies (basic check)
-- Note: Full circular dependency detection requires recursive query in application
CREATE OR REPLACE FUNCTION prevent_direct_circular_dependency()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM task_dependencies
        WHERE task_id = NEW.depends_on_task_id
        AND depends_on_task_id = NEW.task_id
    ) THEN
        RAISE EXCEPTION 'Circular dependency detected: Task % cannot depend on Task % (reverse dependency exists)',
            NEW.task_id, NEW.depends_on_task_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_dependency
    BEFORE INSERT OR UPDATE ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_circular_dependency();

-- Function to ensure tasks and dependencies are in the same project
CREATE OR REPLACE FUNCTION validate_task_dependency_project()
RETURNS TRIGGER AS $$
DECLARE
    task_project_id BIGINT;
    depends_project_id BIGINT;
BEGIN
    SELECT project_id INTO task_project_id FROM tasks WHERE id = NEW.task_id;
    SELECT project_id INTO depends_project_id FROM tasks WHERE id = NEW.depends_on_task_id;

    IF task_project_id != depends_project_id THEN
        RAISE EXCEPTION 'Task dependencies must be within the same project. Task % (project %) cannot depend on Task % (project %)',
            NEW.task_id, task_project_id, NEW.depends_on_task_id, depends_project_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_dependency_project
    BEFORE INSERT OR UPDATE ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION validate_task_dependency_project();

-- Add comments
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';
COMMENT ON FUNCTION update_task_completed_at() IS 'Sets completed_at timestamp and progress to 100 when task status changes to completed';
COMMENT ON FUNCTION mark_comment_as_edited() IS 'Sets is_edited flag when comment content is modified';
COMMENT ON FUNCTION prevent_direct_circular_dependency() IS 'Prevents direct circular dependencies (A depends on B, B depends on A)';
COMMENT ON FUNCTION validate_task_dependency_project() IS 'Ensures task dependencies are within the same project';

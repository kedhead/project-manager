-- =====================================================================
-- PostgreSQL Database Schema for Project Management Application
-- =====================================================================
-- Version: 1.0
-- Description: Complete database schema for a Microsoft Project-like
--              project management application with Gantt charts,
--              task dependencies, real-time collaboration, and notifications
--
-- Features:
-- - User authentication and authorization
-- - Multi-project support with role-based permissions
-- - Tasks with hierarchical subtasks
-- - Task dependencies (finish-to-start, start-to-start, etc.)
-- - File attachments with metadata
-- - Threaded comments
-- - Activity logging and audit trail
-- - Notifications (in-app and email)
-- - Real-time collaboration support via sessions
-- - Task watchers and tags
-- - Soft deletes for data retention
-- - Automated triggers for data consistency
--
-- Usage:
--   psql -U postgres -d your_database < schema.sql
--
-- Note: Run migrations in order from 001 to 015 for granular control,
--       or run this complete schema file for fresh database setup.
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_uuid()

-- =====================================================================
-- CLEANUP: Drop existing objects (for clean reinstall)
-- =====================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS set_task_completed_at ON tasks;
DROP TRIGGER IF EXISTS mark_comment_edited ON comments;
DROP TRIGGER IF EXISTS check_circular_dependency ON task_dependencies;
DROP TRIGGER IF EXISTS validate_dependency_project ON task_dependencies;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_task_completed_at();
DROP FUNCTION IF EXISTS mark_comment_as_edited();
DROP FUNCTION IF EXISTS prevent_direct_circular_dependency();
DROP FUNCTION IF EXISTS validate_task_dependency_project();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS task_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS task_watchers CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS entity_type CASCADE;
DROP TYPE IF EXISTS dependency_type CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS project_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;

-- =====================================================================
-- CUSTOM TYPES (ENUMS)
-- =====================================================================

-- Project status enumeration
CREATE TYPE project_status AS ENUM (
    'planning',
    'active',
    'on_hold',
    'completed',
    'cancelled'
);

-- Project member role enumeration
CREATE TYPE project_role AS ENUM (
    'owner',    -- Full control over project
    'manager',  -- Can manage tasks and members
    'member',   -- Can create and edit tasks
    'viewer'    -- Read-only access
);

-- Task status enumeration
CREATE TYPE task_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'blocked',
    'cancelled'
);

-- Task priority enumeration
CREATE TYPE task_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Task dependency type enumeration
CREATE TYPE dependency_type AS ENUM (
    'finish_to_start',   -- Most common: predecessor finishes before successor starts
    'start_to_start',    -- Both tasks start at the same time
    'finish_to_finish',  -- Both tasks finish at the same time
    'start_to_finish'    -- Rare: predecessor starts before successor finishes
);

-- Entity type for activity logs and notifications
CREATE TYPE entity_type AS ENUM (
    'project',
    'task',
    'comment',
    'file_attachment',
    'project_member',
    'task_dependency'
);

-- Action type for activity logs
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

-- Notification type enumeration
CREATE TYPE notification_type AS ENUM (
    'task_assigned',
    'task_completed',
    'task_updated',
    'deadline_reminder',
    'deadline_overdue',
    'comment_mention',
    'comment_reply',
    'file_uploaded',
    'project_invited',
    'dependency_blocked'
);

-- =====================================================================
-- TABLE DEFINITIONS
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: users
-- Description: Stores user authentication and profile information
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ, -- Soft delete support

    -- Constraints
    CONSTRAINT email_format_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT name_length_check CHECK (
        LENGTH(TRIM(first_name)) >= 1 AND
        LENGTH(TRIM(last_name)) >= 1
    )
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_is_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE users IS 'Stores user accounts with authentication credentials and profile information. Supports soft deletes.';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (never store plain text)';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp for soft delete (NULL = not deleted)';

-- ---------------------------------------------------------------------
-- Table: projects
-- Description: Stores project information and metadata
-- ---------------------------------------------------------------------
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
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT project_name_length_check CHECK (LENGTH(TRIM(name)) >= 1),
    CONSTRAINT project_dates_check CHECK (
        (start_date IS NULL AND end_date IS NULL) OR
        (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date)
    )
);

-- Indexes for projects table
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_start_date ON projects(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_end_date ON projects(end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE projects IS 'Stores project metadata. Uses RESTRICT on created_by to prevent deletion of users who created projects.';
COMMENT ON COLUMN projects.status IS 'Current project status: planning, active, on_hold, completed, or cancelled';

-- ---------------------------------------------------------------------
-- Table: project_members
-- Description: Junction table for project membership with roles
-- ---------------------------------------------------------------------
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

-- Indexes for project_members table
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);

COMMENT ON TABLE project_members IS 'Junction table mapping users to projects with role-based permissions.';
COMMENT ON COLUMN project_members.role IS 'Permission level: owner > manager > member > viewer';

-- ---------------------------------------------------------------------
-- Table: tasks
-- Description: Stores project tasks with scheduling and assignments
-- ---------------------------------------------------------------------
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
    position INTEGER NOT NULL DEFAULT 0, -- For ordering tasks
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

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

-- Indexes for tasks table
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

-- Composite indexes for common queries
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_project_dates ON tasks(project_id, start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_gantt_view ON tasks(project_id, start_date, end_date, position)
    WHERE deleted_at IS NULL AND parent_task_id IS NULL;
CREATE INDEX idx_tasks_subtasks ON tasks(parent_task_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_overdue ON tasks(end_date, status)
    WHERE deleted_at IS NULL AND status != 'completed' AND status != 'cancelled';
CREATE INDEX idx_tasks_upcoming_deadlines ON tasks(assigned_to, end_date, status)
    WHERE deleted_at IS NULL AND status NOT IN ('completed', 'cancelled');

COMMENT ON TABLE tasks IS 'Stores project tasks with scheduling, assignment, and progress tracking. Supports hierarchical subtasks.';
COMMENT ON COLUMN tasks.parent_task_id IS 'Self-referential FK for subtasks (NULL = top-level task)';
COMMENT ON COLUMN tasks.position IS 'Integer for custom ordering within project';

-- ---------------------------------------------------------------------
-- Table: task_dependencies
-- Description: Stores task dependency relationships for Gantt charts
-- ---------------------------------------------------------------------
CREATE TABLE task_dependencies (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, -- Successor
    depends_on_task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, -- Predecessor
    dependency_type dependency_type NOT NULL DEFAULT 'finish_to_start',
    lag_time INTEGER NOT NULL DEFAULT 0, -- Lag/lead time in days
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_task_dependency UNIQUE(task_id, depends_on_task_id),
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

-- Indexes for task_dependencies table
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);
CREATE INDEX idx_task_dependencies_both ON task_dependencies(task_id, depends_on_task_id);

COMMENT ON TABLE task_dependencies IS 'Defines directed dependencies between tasks for Gantt chart scheduling.';
COMMENT ON COLUMN task_dependencies.lag_time IS 'Lag/lead time in days. Positive = delay, Negative = start early';

-- ---------------------------------------------------------------------
-- Table: comments
-- Description: Stores task comments and discussions
-- ---------------------------------------------------------------------
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT comment_content_length_check CHECK (LENGTH(TRIM(content)) >= 1)
);

-- Indexes for comments table
CREATE INDEX idx_comments_task_id ON comments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user_id ON comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_deleted_at ON comments(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE comments IS 'Stores task comments with support for threaded replies.';
COMMENT ON COLUMN comments.parent_comment_id IS 'Self-referential FK for threaded replies (NULL = top-level)';

-- ---------------------------------------------------------------------
-- Table: file_attachments
-- Description: Stores metadata for files attached to tasks
-- ---------------------------------------------------------------------
CREATE TABLE file_attachments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    mime_type VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64), -- SHA-256 hash
    description TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT file_name_length_check CHECK (LENGTH(TRIM(file_name)) >= 1),
    CONSTRAINT file_size_check CHECK (file_size > 0)
);

-- Indexes for file_attachments table
CREATE INDEX idx_file_attachments_task_id ON file_attachments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_attachments_uploaded_by ON file_attachments(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_attachments_uploaded_at ON file_attachments(uploaded_at);
CREATE INDEX idx_file_attachments_mime_type ON file_attachments(mime_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_attachments_file_hash ON file_attachments(file_hash) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_attachments_storage_stats ON file_attachments(uploaded_by, file_size) WHERE deleted_at IS NULL;

COMMENT ON TABLE file_attachments IS 'Stores metadata for files attached to tasks. Actual files stored in blob storage.';
COMMENT ON COLUMN file_attachments.file_hash IS 'SHA-256 hash for integrity verification and deduplication';

-- ---------------------------------------------------------------------
-- Table: activity_logs
-- Description: Immutable audit trail for all system actions
-- ---------------------------------------------------------------------
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    entity_type entity_type NOT NULL,
    entity_id BIGINT NOT NULL,
    action action_type NOT NULL,
    changes JSONB, -- Store before/after values
    metadata JSONB, -- Additional context (IP, user agent, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT entity_id_positive CHECK (entity_id > 0)
);

-- Indexes for activity_logs table
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_changes ON activity_logs USING GIN (changes);
CREATE INDEX idx_activity_logs_project_recent ON activity_logs(project_id, created_at DESC);
CREATE INDEX idx_activity_logs_user_recent ON activity_logs(user_id, created_at DESC);

COMMENT ON TABLE activity_logs IS 'Immutable audit trail. Never delete records from this table.';
COMMENT ON COLUMN activity_logs.changes IS 'JSONB object with before/after values';

-- ---------------------------------------------------------------------
-- Table: notifications
-- Description: Stores user notifications for events and reminders
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    related_entity_type entity_type NOT NULL,
    related_entity_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    sent_via_email BOOLEAN NOT NULL DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT notification_title_length_check CHECK (LENGTH(TRIM(title)) >= 1),
    CONSTRAINT notification_message_length_check CHECK (LENGTH(TRIM(message)) >= 1),
    CONSTRAINT notification_entity_id_positive CHECK (related_entity_id > 0),
    CONSTRAINT notification_email_consistency CHECK (
        (sent_via_email = true AND email_sent_at IS NOT NULL) OR
        (sent_via_email = false AND email_sent_at IS NULL)
    ),
    CONSTRAINT notification_read_consistency CHECK (
        (is_read = true AND read_at IS NOT NULL) OR
        (is_read = false AND read_at IS NULL)
    )
);

-- Indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_entity ON notifications(related_entity_type, related_entity_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notifications_unsent_email ON notifications(user_id, sent_via_email) WHERE sent_via_email = false;
CREATE INDEX idx_notifications_unread_count ON notifications(user_id) WHERE is_read = false;

COMMENT ON TABLE notifications IS 'Stores in-app and email notifications for users.';
COMMENT ON COLUMN notifications.action_url IS 'Deep link to navigate to the related entity';

-- ---------------------------------------------------------------------
-- Table: sessions
-- Description: Stores user session data for authentication
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT session_expiry_check CHECK (expires_at > created_at)
);

-- Indexes for sessions table
CREATE INDEX idx_sessions_user_id ON sessions(user_id) WHERE is_active = true;
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash) WHERE is_active = true;
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at DESC);
CREATE INDEX idx_sessions_active_users ON sessions(user_id, last_activity_at DESC)
    WHERE is_active = true;

COMMENT ON TABLE sessions IS 'Stores active user sessions for authentication and real-time collaboration.';
COMMENT ON COLUMN sessions.token_hash IS 'Hashed session token (never store plain tokens)';

-- ---------------------------------------------------------------------
-- Table: task_watchers
-- Description: Tracks users watching tasks for notifications
-- ---------------------------------------------------------------------
CREATE TABLE task_watchers (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    watch_started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_task_watcher UNIQUE(task_id, user_id)
);

-- Indexes for task_watchers table
CREATE INDEX idx_task_watchers_task_id ON task_watchers(task_id);
CREATE INDEX idx_task_watchers_user_id ON task_watchers(user_id);

COMMENT ON TABLE task_watchers IS 'Junction table for users watching tasks. Watchers receive notifications for all updates.';

-- ---------------------------------------------------------------------
-- Table: tags
-- Description: Project-specific tags for categorizing tasks
-- ---------------------------------------------------------------------
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

-- Indexes for tags table
CREATE INDEX idx_tags_project_id ON tags(project_id);
CREATE INDEX idx_tags_name ON tags(name);

COMMENT ON TABLE tags IS 'Project-specific tags for categorizing and filtering tasks.';
COMMENT ON COLUMN tags.color IS 'Hex color code for visual tag representation';

-- ---------------------------------------------------------------------
-- Table: task_tags
-- Description: Junction table mapping tags to tasks
-- ---------------------------------------------------------------------
CREATE TABLE task_tags (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_task_tag UNIQUE(task_id, tag_id)
);

-- Indexes for task_tags table
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

COMMENT ON TABLE task_tags IS 'Junction table mapping tags to tasks (many-to-many relationship).';

-- =====================================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';

-- Apply updated_at trigger to relevant tables
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

COMMENT ON FUNCTION update_task_completed_at() IS 'Sets completed_at timestamp and progress to 100 when task status changes to completed';

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

COMMENT ON FUNCTION mark_comment_as_edited() IS 'Sets is_edited flag when comment content is modified';

CREATE TRIGGER mark_comment_edited
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION mark_comment_as_edited();

-- Function to prevent circular task dependencies (basic check)
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

COMMENT ON FUNCTION prevent_direct_circular_dependency() IS 'Prevents direct circular dependencies (A depends on B, B depends on A)';

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

COMMENT ON FUNCTION validate_task_dependency_project() IS 'Ensures task dependencies are within the same project';

CREATE TRIGGER validate_dependency_project
    BEFORE INSERT OR UPDATE ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION validate_task_dependency_project();

-- =====================================================================
-- SCHEMA INFORMATION QUERIES
-- =====================================================================

-- View to see all tables and their row counts (useful for monitoring)
-- Usage: SELECT * FROM schema_summary;
CREATE OR REPLACE VIEW schema_summary AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMENT ON VIEW schema_summary IS 'Summary of all tables with their sizes for monitoring database growth';

-- =====================================================================
-- COMPLETION MESSAGE
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Tables created: 15';
    RAISE NOTICE 'Custom types: 8';
    RAISE NOTICE 'Triggers: 8';
    RAISE NOTICE 'Functions: 5';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create your first user account';
    RAISE NOTICE '2. Create a project';
    RAISE NOTICE '3. Add project members';
    RAISE NOTICE '4. Create tasks with dependencies';
    RAISE NOTICE '';
    RAISE NOTICE 'For development, consider running:';
    RAISE NOTICE '  database/migrations/015_create_seed_data.sql';
    RAISE NOTICE '=======================================================';
END $$;

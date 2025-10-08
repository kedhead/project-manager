-- Migration 006: Create comments table
-- Description: Stores task comments and discussions

-- Drop existing table if exists
DROP TABLE IF EXISTS comments CASCADE;

-- Create comments table
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE, -- For threaded replies
    content TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ, -- Soft delete support

    -- Constraints
    CONSTRAINT comment_content_length_check CHECK (LENGTH(TRIM(content)) >= 1)
);

-- Create indexes
CREATE INDEX idx_comments_task_id ON comments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user_id ON comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_deleted_at ON comments(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add table comment
COMMENT ON TABLE comments IS 'Stores task comments and discussions. Supports threaded replies via parent_comment_id. User is set to NULL on deletion to preserve comment history.';

-- Add column comments
COMMENT ON COLUMN comments.parent_comment_id IS 'Self-referential FK for threaded replies (NULL = top-level comment)';
COMMENT ON COLUMN comments.is_edited IS 'Flag to indicate if comment has been modified after creation';
COMMENT ON COLUMN comments.deleted_at IS 'Timestamp for soft delete (NULL = not deleted)';

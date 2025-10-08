-- Migration 007: Create file_attachments table
-- Description: Stores metadata for files attached to tasks

-- Drop existing table if exists
DROP TABLE IF EXISTS file_attachments CASCADE;

-- Create file_attachments table
CREATE TABLE file_attachments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL, -- Storage path (local filesystem, S3, etc.)
    file_size BIGINT NOT NULL, -- Size in bytes
    mime_type VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64), -- SHA-256 hash for deduplication and integrity check
    description TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ, -- Soft delete support

    -- Constraints
    CONSTRAINT file_name_length_check CHECK (LENGTH(TRIM(file_name)) >= 1),
    CONSTRAINT file_size_check CHECK (file_size > 0)
);

-- Create indexes
CREATE INDEX idx_file_attachments_task_id ON file_attachments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_attachments_uploaded_by ON file_attachments(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_attachments_uploaded_at ON file_attachments(uploaded_at);
CREATE INDEX idx_file_attachments_mime_type ON file_attachments(mime_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_attachments_file_hash ON file_attachments(file_hash) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_attachments_deleted_at ON file_attachments(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add table comment
COMMENT ON TABLE file_attachments IS 'Stores metadata for files attached to tasks. Actual files should be stored in blob storage (S3, Azure Blob, etc.) with path referenced here.';

-- Add column comments
COMMENT ON COLUMN file_attachments.file_path IS 'Full path or URL to stored file (e.g., s3://bucket/path/to/file.pdf)';
COMMENT ON COLUMN file_attachments.file_size IS 'File size in bytes for quota management and UI display';
COMMENT ON COLUMN file_attachments.mime_type IS 'MIME type (e.g., application/pdf, image/png) for proper file handling';
COMMENT ON COLUMN file_attachments.file_hash IS 'SHA-256 hash for file integrity verification and deduplication';
COMMENT ON COLUMN file_attachments.deleted_at IS 'Timestamp for soft delete (NULL = not deleted)';

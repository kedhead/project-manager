-- Migration 001: Create users table
-- Description: Stores user authentication and profile information

-- Drop existing table if exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
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

-- Create indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_is_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add table comment
COMMENT ON TABLE users IS 'Stores user accounts with authentication credentials and profile information. Supports soft deletes.';

-- Add column comments
COMMENT ON COLUMN users.email IS 'Unique email address used for login and notifications';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (never store plain text)';
COMMENT ON COLUMN users.is_active IS 'Flag to disable user access without deleting the account';
COMMENT ON COLUMN users.email_verification_token IS 'Token sent via email for account verification';
COMMENT ON COLUMN users.password_reset_token IS 'Token sent via email for password reset flow';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp for soft delete (NULL = not deleted)';

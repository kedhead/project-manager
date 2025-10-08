-- Migration 010: Create sessions table
-- Description: Stores user session data for real-time collaboration and authentication

-- Drop existing table if exists
DROP TABLE IF EXISTS sessions CASCADE;

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed session token
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT session_expiry_check CHECK (expires_at > created_at)
);

-- Create indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id) WHERE is_active = true;
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash) WHERE is_active = true;
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at DESC);

-- Add table comment
COMMENT ON TABLE sessions IS 'Stores active user sessions for authentication and real-time collaboration tracking. Sessions expire after inactivity.';

-- Add column comments
COMMENT ON COLUMN sessions.token_hash IS 'Hashed session token (never store plain tokens)';
COMMENT ON COLUMN sessions.ip_address IS 'IP address of the user for security auditing';
COMMENT ON COLUMN sessions.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN sessions.is_active IS 'Flag to invalidate session without deletion';
COMMENT ON COLUMN sessions.last_activity_at IS 'Timestamp of last user activity (updated on each request)';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration timestamp (typically 7-30 days)';

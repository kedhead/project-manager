-- Migration 015: Seed data
-- Description: Optional seed data for development and testing
-- Note: This should be run in development only, not in production

-- This file is intentionally left minimal for production use
-- Add sample data as needed for development/testing

-- Example: Insert default system user (for automated actions)
-- INSERT INTO users (email, password_hash, first_name, last_name, is_active, is_email_verified)
-- VALUES (
--     'system@projectmanager.local',
--     '$2a$10$placeholder_hash', -- Replace with actual bcrypt hash
--     'System',
--     'User',
--     true,
--     true
-- )
-- ON CONFLICT (email) DO NOTHING;

-- Add any other seed data below as needed

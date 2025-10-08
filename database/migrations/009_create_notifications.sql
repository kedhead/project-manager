-- Migration 009: Create notifications table
-- Description: Stores user notifications for events and reminders

-- Drop existing table if exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notification type enum
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    related_entity_type entity_type NOT NULL,
    related_entity_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT, -- Deep link to the relevant entity
    is_read BOOLEAN NOT NULL DEFAULT false,
    sent_via_email BOOLEAN NOT NULL DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ, -- Optional expiration for time-sensitive notifications

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

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_entity ON notifications(related_entity_type, related_entity_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notifications_unsent_email ON notifications(user_id, sent_via_email) WHERE sent_via_email = false;

-- Add table comment
COMMENT ON TABLE notifications IS 'Stores in-app and email notifications for users. Supports read/unread tracking and email delivery status.';

-- Add column comments
COMMENT ON COLUMN notifications.type IS 'Type of notification event';
COMMENT ON COLUMN notifications.related_entity_type IS 'Type of entity this notification relates to';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity';
COMMENT ON COLUMN notifications.action_url IS 'Deep link URL to navigate to the related entity (e.g., /projects/123/tasks/456)';
COMMENT ON COLUMN notifications.sent_via_email IS 'Flag indicating if notification was sent via email';
COMMENT ON COLUMN notifications.email_sent_at IS 'Timestamp when email was sent (NULL if not sent)';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when user marked notification as read';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration timestamp for time-sensitive notifications';

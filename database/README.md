# Database Schema Documentation

## Overview

This directory contains the complete PostgreSQL database schema for the Project Management application. The schema is designed to support a Microsoft Project-like application with features including Gantt charts, task dependencies, real-time collaboration, file attachments, and comprehensive notification systems.

## Features

- **User Authentication & Authorization**: Secure user accounts with role-based permissions
- **Multi-Project Support**: Users can create and manage multiple projects
- **Hierarchical Tasks**: Tasks with subtasks and custom ordering
- **Task Dependencies**: Four dependency types (finish-to-start, start-to-start, finish-to-finish, start-to-finish)
- **File Attachments**: Metadata storage for task-related files
- **Threaded Comments**: Discussion support with nested replies
- **Activity Logging**: Immutable audit trail for compliance and history
- **Notifications**: In-app and email notifications for task events
- **Real-time Collaboration**: Session tracking for active users
- **Task Watchers & Tags**: Enhanced organization and notification control
- **Soft Deletes**: Data retention for critical entities
- **Automated Triggers**: Data consistency and validation

## Directory Structure

```
database/
├── schema.sql                      # Complete schema (all-in-one)
├── migrations/                     # Individual migration files
│   ├── 001_create_users.sql
│   ├── 002_create_projects.sql
│   ├── 003_create_project_members.sql
│   ├── 004_create_tasks.sql
│   ├── 005_create_task_dependencies.sql
│   ├── 006_create_comments.sql
│   ├── 007_create_file_attachments.sql
│   ├── 008_create_activity_logs.sql
│   ├── 009_create_notifications.sql
│   ├── 010_create_sessions.sql
│   ├── 011_create_task_watchers.sql
│   ├── 012_create_tags.sql
│   ├── 013_create_triggers.sql
│   ├── 014_create_indexes_performance.sql
│   └── 015_create_seed_data.sql
└── README.md                       # This file
```

## Installation

### Option 1: Complete Schema (Fresh Install)

For a fresh database, run the complete schema file:

```bash
# Create database
createdb project_manager

# Install schema
psql -U postgres -d project_manager < schema.sql
```

### Option 2: Individual Migrations (Granular Control)

For more control or to integrate with a migration framework:

```bash
# Run migrations in order
for file in migrations/*.sql; do
    echo "Running $file..."
    psql -U postgres -d project_manager < "$file"
done
```

### Required PostgreSQL Extensions

The schema automatically enables the following extensions:
- `pgcrypto` - For UUID generation (gen_random_uuid())

Optional extensions for enhanced functionality:
- `pg_trgm` - For fuzzy text search on task titles (commented out in migrations)

## Database Schema

### Core Tables

#### 1. users
Stores user authentication and profile information.

**Key Fields:**
- `id`: Primary key (BIGSERIAL)
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `first_name`, `last_name`: User name
- `is_active`: Account status flag
- `is_email_verified`: Email verification status
- `deleted_at`: Soft delete timestamp

**Indexes:**
- Email (partial index for non-deleted)
- Active status
- Created date

#### 2. projects
Stores project metadata and timeline information.

**Key Fields:**
- `id`: Primary key
- `name`: Project name
- `status`: Enum (planning, active, on_hold, completed, cancelled)
- `start_date`, `end_date`: Project timeline
- `created_by`: Foreign key to users (RESTRICT)
- `deleted_at`: Soft delete timestamp

**Business Rules:**
- End date must be >= start date
- Created by user cannot be deleted while project exists

#### 3. project_members
Junction table for project membership with role-based permissions.

**Key Fields:**
- `project_id`, `user_id`: Composite unique constraint
- `role`: Enum (owner, manager, member, viewer)
- `invited_by`: Foreign key to users

**Permission Levels:**
- **Owner**: Full control over project
- **Manager**: Can manage tasks and members
- **Member**: Can create and edit tasks
- **Viewer**: Read-only access

#### 4. tasks
Core task management with scheduling and assignment.

**Key Fields:**
- `id`: Primary key
- `project_id`: Foreign key to projects (CASCADE)
- `title`, `description`: Task details
- `start_date`, `end_date`, `duration`: Scheduling
- `progress`: Percentage (0-100)
- `status`: Enum (not_started, in_progress, completed, blocked, cancelled)
- `priority`: Enum (low, medium, high, critical)
- `assigned_to`: Foreign key to users (SET NULL)
- `parent_task_id`: Self-reference for subtasks
- `position`: Custom ordering within project
- `estimated_hours`, `actual_hours`: Time tracking
- `completed_at`: Auto-set via trigger when status = completed

**Triggers:**
- Auto-updates `completed_at` and sets progress to 100 when completed
- Auto-updates `updated_at` timestamp

#### 5. task_dependencies
Defines task dependencies for Gantt chart scheduling.

**Key Fields:**
- `task_id`: Dependent task (successor)
- `depends_on_task_id`: Prerequisite task (predecessor)
- `dependency_type`: Enum (finish_to_start, start_to_start, finish_to_finish, start_to_finish)
- `lag_time`: Lag/lead time in days (positive = delay, negative = lead)

**Dependency Types:**
- **finish_to_start**: Predecessor must finish before successor starts (most common)
- **start_to_start**: Both tasks start at the same time
- **finish_to_finish**: Both tasks finish at the same time
- **start_to_finish**: Predecessor must start before successor finishes (rare)

**Validation:**
- Prevents self-dependencies
- Prevents direct circular dependencies (A→B, B→A)
- Ensures dependencies are within same project

#### 6. comments
Task comments with threaded reply support.

**Key Fields:**
- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users (SET NULL)
- `parent_comment_id`: Self-reference for replies
- `content`: Comment text
- `is_edited`: Auto-set via trigger when content changes

#### 7. file_attachments
Metadata for files attached to tasks.

**Key Fields:**
- `task_id`: Foreign key to tasks
- `file_name`, `file_path`: File location
- `file_size`: Size in bytes
- `mime_type`: File type
- `file_hash`: SHA-256 hash for integrity/deduplication

**Note:** Actual files should be stored in blob storage (S3, Azure Blob, etc.)

#### 8. activity_logs
Immutable audit trail for all system actions.

**Key Fields:**
- `project_id`, `user_id`: Context
- `entity_type`, `entity_id`: What was changed
- `action`: Type of change (created, updated, deleted, etc.)
- `changes`: JSONB with before/after values
- `metadata`: JSONB with additional context (IP, user agent, etc.)

**Important:** Never delete records from this table (compliance/audit purposes)

#### 9. notifications
User notifications for events and reminders.

**Key Fields:**
- `user_id`: Notification recipient
- `type`: Enum (task_assigned, deadline_reminder, comment_mention, etc.)
- `related_entity_type`, `related_entity_id`: What triggered notification
- `is_read`, `read_at`: Read status
- `sent_via_email`, `email_sent_at`: Email delivery status
- `action_url`: Deep link to related entity

#### 10. sessions
Active user sessions for authentication and real-time features.

**Key Fields:**
- `id`: UUID primary key
- `user_id`: Foreign key to users
- `token_hash`: Hashed session token
- `ip_address`, `user_agent`: Security context
- `last_activity_at`: Track user activity
- `expires_at`: Session expiration

#### 11. task_watchers
Junction table for users watching tasks.

**Key Fields:**
- `task_id`, `user_id`: Composite unique constraint
- `watch_started_at`: When user started watching

**Purpose:** Watchers receive notifications for all task updates

#### 12. tags & task_tags
Project-specific tags for task categorization.

**Key Fields (tags):**
- `project_id`: Tags are project-specific
- `name`: Tag name (unique within project)
- `color`: Hex color code for visual representation

**Key Fields (task_tags):**
- `task_id`, `tag_id`: Many-to-many relationship

## Custom Types (ENUMs)

The schema defines several custom types for data validation:

- `project_status`: planning, active, on_hold, completed, cancelled
- `project_role`: owner, manager, member, viewer
- `task_status`: not_started, in_progress, completed, blocked, cancelled
- `task_priority`: low, medium, high, critical
- `dependency_type`: finish_to_start, start_to_start, finish_to_finish, start_to_finish
- `entity_type`: project, task, comment, file_attachment, project_member, task_dependency
- `action_type`: created, updated, deleted, restored, assigned, unassigned, completed, etc.
- `notification_type`: task_assigned, deadline_reminder, comment_mention, etc.

## Database Triggers

### Automated Triggers

1. **update_updated_at_column()**: Auto-updates `updated_at` timestamp on:
   - users
   - projects
   - tasks
   - comments

2. **update_task_completed_at()**: When task status changes to 'completed':
   - Sets `completed_at` to current timestamp
   - Sets `progress` to 100

3. **mark_comment_as_edited()**: Sets `is_edited` flag when comment content changes

4. **prevent_direct_circular_dependency()**: Prevents direct circular dependencies in task_dependencies

5. **validate_task_dependency_project()**: Ensures task dependencies are within the same project

## Indexing Strategy

### Performance Indexes

The schema includes comprehensive indexing for optimal query performance:

1. **Foreign Key Indexes**: All foreign keys have indexes
2. **Partial Indexes**: Indexes on soft-deleted tables exclude deleted rows
3. **Composite Indexes**: Multi-column indexes for common query patterns
4. **GIN Indexes**: For JSONB columns (activity_logs.changes)
5. **Conditional Indexes**: Optimized for specific query patterns (e.g., overdue tasks)

### Key Indexes

- **Gantt Chart View**: `idx_tasks_gantt_view` (project_id, start_date, end_date, position)
- **Overdue Tasks**: `idx_tasks_overdue` (end_date, status)
- **Unread Notifications**: `idx_notifications_user_unread` (user_id, is_read)
- **Active Sessions**: `idx_sessions_active_users` (user_id, last_activity_at)
- **Activity Feed**: `idx_activity_logs_project_recent` (project_id, created_at DESC)

## Referential Integrity

### Cascade Delete Rules

- **Projects → Tasks**: CASCADE (deleting project deletes all tasks)
- **Tasks → Comments**: CASCADE (deleting task deletes comments)
- **Tasks → File Attachments**: CASCADE
- **Tasks → Dependencies**: CASCADE
- **Users → Projects**: RESTRICT (cannot delete user who created projects)
- **Users → Tasks (assigned_to)**: SET NULL (preserve task if user deleted)
- **Users → Comments**: SET NULL (preserve comment history)

### Soft Deletes

The following tables support soft deletes via `deleted_at` timestamp:
- users
- projects
- tasks
- comments
- file_attachments

**Benefits:**
- Data retention for audit purposes
- Ability to restore deleted items
- Preserve referential integrity

## Query Examples

### Get all tasks for a project with dependencies

```sql
SELECT
    t.*,
    json_agg(
        json_build_object(
            'depends_on', td.depends_on_task_id,
            'type', td.dependency_type,
            'lag_time', td.lag_time
        )
    ) FILTER (WHERE td.id IS NOT NULL) as dependencies
FROM tasks t
LEFT JOIN task_dependencies td ON t.id = td.task_id
WHERE t.project_id = $1 AND t.deleted_at IS NULL
GROUP BY t.id
ORDER BY t.position;
```

### Get project activity feed

```sql
SELECT
    al.*,
    u.first_name || ' ' || u.last_name as user_name,
    u.avatar_url
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.project_id = $1
ORDER BY al.created_at DESC
LIMIT 50;
```

### Get overdue tasks for a user

```sql
SELECT
    t.*,
    p.name as project_name
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE t.assigned_to = $1
    AND t.end_date < CURRENT_DATE
    AND t.status NOT IN ('completed', 'cancelled')
    AND t.deleted_at IS NULL
ORDER BY t.end_date ASC;
```

### Get unread notification count

```sql
SELECT COUNT(*)
FROM notifications
WHERE user_id = $1 AND is_read = false;
```

## Security Considerations

1. **Password Storage**: Always use bcrypt for password hashing (never store plain text)
2. **Session Tokens**: Hash session tokens before storage
3. **Email Validation**: Regex check constraint on email format
4. **SQL Injection**: Use parameterized queries (prepared statements)
5. **Row-Level Security**: Consider PostgreSQL RLS for multi-tenant scenarios
6. **Audit Trail**: activity_logs provides immutable audit trail

## Performance Tuning

### Recommended PostgreSQL Settings

For optimal performance with this schema:

```sql
-- Increase shared buffers for larger datasets
shared_buffers = '256MB'

-- Optimize for SSD storage
random_page_cost = 1.1

-- Increase work memory for complex queries
work_mem = '16MB'

-- Enable query plan caching
plan_cache_mode = 'auto'
```

### Monitoring Queries

```sql
-- Check table sizes
SELECT * FROM schema_summary;

-- Find slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Backup and Maintenance

### Regular Backups

```bash
# Full database backup
pg_dump -U postgres -d project_manager -F c -f backup.dump

# Schema-only backup
pg_dump -U postgres -d project_manager -s -f schema_backup.sql

# Restore from backup
pg_restore -U postgres -d project_manager backup.dump
```

### Maintenance Tasks

```sql
-- Vacuum and analyze all tables
VACUUM ANALYZE;

-- Reindex for better performance
REINDEX DATABASE project_manager;

-- Clean up expired sessions
DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;

-- Clean up old notifications (optional)
DELETE FROM notifications WHERE expires_at < CURRENT_TIMESTAMP;
```

## Migration Guide

### Adding New Columns

```sql
-- Example: Add custom field to tasks
ALTER TABLE tasks ADD COLUMN custom_field VARCHAR(255);

-- Create migration file: migrations/016_add_custom_field.sql
```

### Modifying Enums

```sql
-- Add new enum value
ALTER TYPE task_status ADD VALUE 'on_hold';

-- Note: Cannot remove enum values without recreating type
```

### Data Migration

```sql
-- Example: Migrate old status to new status
UPDATE tasks SET status = 'blocked' WHERE old_status = 'waiting';
```

## Troubleshooting

### Common Issues

1. **Circular Dependency Error**: The trigger prevents direct circular dependencies (A→B, B→A). For complex circular dependencies, implement detection in application logic.

2. **Cannot Delete User**: If user created projects, they cannot be deleted (RESTRICT constraint). Either reassign projects or use soft delete.

3. **Slow Queries**: Check index usage with `EXPLAIN ANALYZE`. Add composite indexes for complex WHERE clauses.

4. **Large activity_logs Table**: Implement partitioning by date for better performance:
   ```sql
   -- Create partitioned table (requires PostgreSQL 10+)
   CREATE TABLE activity_logs_partitioned (LIKE activity_logs)
   PARTITION BY RANGE (created_at);
   ```

## Future Enhancements

Potential schema improvements for future versions:

1. **Table Partitioning**: Partition large tables (activity_logs, notifications) by date
2. **Full-Text Search**: Add GIN indexes with `pg_trgm` for fuzzy search
3. **Materialized Views**: Create materialized views for complex reports
4. **Time-Series Data**: Consider TimescaleDB extension for time-series analytics
5. **Row-Level Security**: Implement RLS for multi-tenant security
6. **Custom Aggregates**: Create custom aggregate functions for reporting

## License

This schema is part of the Project Management Application.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review PostgreSQL documentation: https://www.postgresql.org/docs/
- File an issue in the project repository

---

**Last Updated**: 2025-10-07
**Schema Version**: 1.0
**PostgreSQL Version**: 12+

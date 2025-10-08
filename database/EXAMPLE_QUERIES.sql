-- =====================================================================
-- EXAMPLE QUERIES FOR PROJECT MANAGEMENT APPLICATION
-- =====================================================================
-- This file contains example queries for common use cases
-- Use these as a reference for building your application

-- =====================================================================
-- USER MANAGEMENT
-- =====================================================================

-- Create a new user
INSERT INTO users (email, password_hash, first_name, last_name)
VALUES ('john.doe@example.com', '$2a$10$hashed_password_here', 'John', 'Doe')
RETURNING id, email, first_name, last_name, created_at;

-- Get user by email (for login)
SELECT id, email, password_hash, first_name, last_name, is_active, is_email_verified
FROM users
WHERE email = 'john.doe@example.com'
    AND deleted_at IS NULL
    AND is_active = true;

-- Update user profile
UPDATE users
SET first_name = 'Jonathan',
    avatar_url = 'https://example.com/avatars/john.jpg'
WHERE id = 1;

-- Soft delete user
UPDATE users
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- =====================================================================
-- PROJECT MANAGEMENT
-- =====================================================================

-- Create a new project
INSERT INTO projects (name, description, start_date, end_date, status, created_by)
VALUES (
    'Website Redesign',
    'Complete redesign of company website',
    '2025-01-01',
    '2025-06-30',
    'planning',
    1 -- user_id
)
RETURNING id, name, created_at;

-- Get all projects for a user (as member or creator)
SELECT DISTINCT
    p.id,
    p.name,
    p.description,
    p.status,
    p.start_date,
    p.end_date,
    p.created_at,
    pm.role as user_role,
    u.first_name || ' ' || u.last_name as created_by_name
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN users u ON p.created_by = u.id
WHERE (pm.user_id = 1 OR p.created_by = 1)
    AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;

-- Get project with member count and task statistics
SELECT
    p.id,
    p.name,
    p.status,
    COUNT(DISTINCT pm.user_id) as member_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.deleted_at IS NULL) as total_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.deleted_at IS NULL) as completed_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_progress' AND t.deleted_at IS NULL) as in_progress_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.end_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled') AND t.deleted_at IS NULL) as overdue_tasks
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN tasks t ON p.id = t.project_id
WHERE p.id = 1
    AND p.deleted_at IS NULL
GROUP BY p.id, p.name, p.status;

-- =====================================================================
-- PROJECT MEMBERS & PERMISSIONS
-- =====================================================================

-- Add user to project with role
INSERT INTO project_members (project_id, user_id, role, invited_by)
VALUES (1, 2, 'member', 1)
ON CONFLICT (project_id, user_id) DO NOTHING
RETURNING id;

-- Get all members of a project
SELECT
    pm.id,
    pm.role,
    pm.joined_at,
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.avatar_url,
    inviter.first_name || ' ' || inviter.last_name as invited_by_name
FROM project_members pm
JOIN users u ON pm.user_id = u.id
LEFT JOIN users inviter ON pm.invited_by = inviter.id
WHERE pm.project_id = 1
ORDER BY pm.role, pm.joined_at;

-- Check if user has permission to edit project
SELECT EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = 1
        AND pm.user_id = 2
        AND pm.role IN ('owner', 'manager', 'member')
) as can_edit;

-- Update user role in project
UPDATE project_members
SET role = 'manager'
WHERE project_id = 1 AND user_id = 2;

-- Remove user from project
DELETE FROM project_members
WHERE project_id = 1 AND user_id = 2;

-- =====================================================================
-- TASK MANAGEMENT
-- =====================================================================

-- Create a new task
INSERT INTO tasks (
    project_id,
    title,
    description,
    start_date,
    end_date,
    duration,
    priority,
    assigned_to,
    created_by,
    estimated_hours
)
VALUES (
    1,
    'Design homepage mockup',
    'Create high-fidelity mockup of new homepage design',
    '2025-01-15',
    '2025-01-22',
    7,
    'high',
    2,
    1,
    16.0
)
RETURNING id, title, created_at;

-- Get all tasks for a project (Gantt chart view)
SELECT
    t.id,
    t.title,
    t.description,
    t.start_date,
    t.end_date,
    t.duration,
    t.progress,
    t.status,
    t.priority,
    t.position,
    t.parent_task_id,
    t.estimated_hours,
    t.actual_hours,
    assigned_user.id as assigned_user_id,
    assigned_user.first_name || ' ' || assigned_user.last_name as assigned_user_name,
    assigned_user.avatar_url as assigned_user_avatar,
    creator.first_name || ' ' || creator.last_name as created_by_name,
    (
        SELECT json_agg(
            json_build_object(
                'id', td.id,
                'depends_on_task_id', td.depends_on_task_id,
                'dependency_type', td.dependency_type,
                'lag_time', td.lag_time
            )
        )
        FROM task_dependencies td
        WHERE td.task_id = t.id
    ) as dependencies,
    (
        SELECT json_agg(
            json_build_object(
                'id', tag.id,
                'name', tag.name,
                'color', tag.color
            )
        )
        FROM task_tags tt
        JOIN tags tag ON tt.tag_id = tag.id
        WHERE tt.task_id = t.id
    ) as tags
FROM tasks t
LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
LEFT JOIN users creator ON t.created_by = creator.id
WHERE t.project_id = 1
    AND t.deleted_at IS NULL
ORDER BY t.position, t.start_date;

-- Get task with all related data (detail view)
SELECT
    t.*,
    assigned_user.email as assigned_user_email,
    assigned_user.first_name || ' ' || assigned_user.last_name as assigned_user_name,
    creator.first_name || ' ' || creator.last_name as created_by_name,
    parent.title as parent_task_title
FROM tasks t
LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
LEFT JOIN users creator ON t.created_by = creator.id
LEFT JOIN tasks parent ON t.parent_task_id = parent.id
WHERE t.id = 1
    AND t.deleted_at IS NULL;

-- Update task progress and status
UPDATE tasks
SET progress = 50,
    status = 'in_progress',
    actual_hours = 8.5
WHERE id = 1;

-- Mark task as completed
UPDATE tasks
SET status = 'completed'
    -- completed_at and progress=100 will be set automatically by trigger
WHERE id = 1;

-- Get tasks assigned to a user
SELECT
    t.id,
    t.title,
    t.start_date,
    t.end_date,
    t.status,
    t.priority,
    t.progress,
    p.name as project_name,
    p.id as project_id
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE t.assigned_to = 2
    AND t.deleted_at IS NULL
    AND t.status NOT IN ('completed', 'cancelled')
ORDER BY t.priority DESC, t.end_date ASC;

-- Get overdue tasks
SELECT
    t.id,
    t.title,
    t.end_date,
    t.status,
    t.priority,
    p.name as project_name,
    assigned_user.first_name || ' ' || assigned_user.last_name as assigned_to_name
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
WHERE t.end_date < CURRENT_DATE
    AND t.status NOT IN ('completed', 'cancelled')
    AND t.deleted_at IS NULL
ORDER BY t.end_date ASC;

-- Get subtasks of a task
SELECT
    t.id,
    t.title,
    t.status,
    t.progress,
    t.assigned_to
FROM tasks t
WHERE t.parent_task_id = 1
    AND t.deleted_at IS NULL
ORDER BY t.position;

-- =====================================================================
-- TASK DEPENDENCIES
-- =====================================================================

-- Create a task dependency
INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type, lag_time)
VALUES (2, 1, 'finish_to_start', 0)
RETURNING id;

-- Get all dependencies for a task (predecessors)
SELECT
    td.id,
    td.dependency_type,
    td.lag_time,
    t.id as depends_on_task_id,
    t.title as depends_on_task_title,
    t.start_date as depends_on_start_date,
    t.end_date as depends_on_end_date,
    t.status as depends_on_status
FROM task_dependencies td
JOIN tasks t ON td.depends_on_task_id = t.id
WHERE td.task_id = 2;

-- Get all tasks that depend on a specific task (successors)
SELECT
    td.id,
    td.dependency_type,
    td.lag_time,
    t.id as successor_task_id,
    t.title as successor_task_title,
    t.status as successor_status
FROM task_dependencies td
JOIN tasks t ON td.task_id = t.id
WHERE td.depends_on_task_id = 1;

-- Check for circular dependencies (basic check - should be done in application)
-- This query finds if there's a reverse dependency
SELECT EXISTS (
    SELECT 1
    FROM task_dependencies
    WHERE task_id = 1 -- The task that should depend on another
        AND depends_on_task_id = 2 -- The task it should depend on
) OR EXISTS (
    SELECT 1
    FROM task_dependencies
    WHERE task_id = 2 -- Check reverse
        AND depends_on_task_id = 1
) as has_circular_dependency;

-- =====================================================================
-- COMMENTS
-- =====================================================================

-- Add a comment to a task
INSERT INTO comments (task_id, user_id, content)
VALUES (1, 2, 'I have completed the initial mockup. Please review.')
RETURNING id, created_at;

-- Add a reply to a comment
INSERT INTO comments (task_id, user_id, parent_comment_id, content)
VALUES (1, 1, 1, 'Great work! Just a few minor changes needed.')
RETURNING id, created_at;

-- Get all comments for a task (threaded)
WITH RECURSIVE comment_tree AS (
    -- Top-level comments
    SELECT
        c.id,
        c.task_id,
        c.user_id,
        c.parent_comment_id,
        c.content,
        c.is_edited,
        c.created_at,
        c.updated_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url,
        0 as depth,
        ARRAY[c.created_at] as sort_path
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = 1
        AND c.parent_comment_id IS NULL
        AND c.deleted_at IS NULL

    UNION ALL

    -- Replies
    SELECT
        c.id,
        c.task_id,
        c.user_id,
        c.parent_comment_id,
        c.content,
        c.is_edited,
        c.created_at,
        c.updated_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url,
        ct.depth + 1,
        ct.sort_path || c.created_at
    FROM comments c
    JOIN users u ON c.user_id = u.id
    JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.deleted_at IS NULL
)
SELECT * FROM comment_tree
ORDER BY sort_path;

-- Update a comment
UPDATE comments
SET content = 'Updated comment text'
WHERE id = 1 AND user_id = 2;  -- is_edited flag will be set by trigger

-- Delete (soft delete) a comment
UPDATE comments
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = 1 AND user_id = 2;

-- =====================================================================
-- FILE ATTACHMENTS
-- =====================================================================

-- Upload a file attachment
INSERT INTO file_attachments (
    task_id,
    uploaded_by,
    file_name,
    file_path,
    file_size,
    mime_type,
    file_hash,
    description
)
VALUES (
    1,
    2,
    'homepage_mockup_v1.pdf',
    's3://bucket/files/2025/01/homepage_mockup_v1.pdf',
    2048576,  -- 2MB in bytes
    'application/pdf',
    'a1b2c3d4e5f6...',  -- SHA-256 hash
    'Initial homepage mockup design'
)
RETURNING id, uploaded_at;

-- Get all attachments for a task
SELECT
    fa.id,
    fa.file_name,
    fa.file_size,
    fa.mime_type,
    fa.description,
    fa.uploaded_at,
    u.first_name || ' ' || u.last_name as uploaded_by_name
FROM file_attachments fa
JOIN users u ON fa.uploaded_by = u.id
WHERE fa.task_id = 1
    AND fa.deleted_at IS NULL
ORDER BY fa.uploaded_at DESC;

-- Get total file storage used by a user
SELECT
    uploaded_by,
    COUNT(*) as file_count,
    SUM(file_size) as total_bytes,
    pg_size_pretty(SUM(file_size)::bigint) as total_size
FROM file_attachments
WHERE uploaded_by = 2
    AND deleted_at IS NULL
GROUP BY uploaded_by;

-- =====================================================================
-- ACTIVITY LOGS
-- =====================================================================

-- Log a task creation
INSERT INTO activity_logs (
    project_id,
    user_id,
    entity_type,
    entity_id,
    action,
    changes,
    metadata
)
VALUES (
    1,
    2,
    'task',
    1,
    'created',
    jsonb_build_object(
        'title', 'Design homepage mockup',
        'status', 'not_started',
        'priority', 'high'
    ),
    jsonb_build_object(
        'ip_address', '192.168.1.100',
        'user_agent', 'Mozilla/5.0...'
    )
);

-- Log a task update
INSERT INTO activity_logs (
    project_id,
    user_id,
    entity_type,
    entity_id,
    action,
    changes
)
VALUES (
    1,
    2,
    'task',
    1,
    'updated',
    jsonb_build_object(
        'field', 'status',
        'old_value', 'not_started',
        'new_value', 'in_progress'
    )
);

-- Get activity feed for a project
SELECT
    al.id,
    al.entity_type,
    al.entity_id,
    al.action,
    al.changes,
    al.created_at,
    u.first_name || ' ' || u.last_name as user_name,
    u.avatar_url,
    -- Get entity title based on type
    CASE
        WHEN al.entity_type = 'task' THEN (SELECT title FROM tasks WHERE id = al.entity_id)
        WHEN al.entity_type = 'project' THEN (SELECT name FROM projects WHERE id = al.entity_id)
        ELSE NULL
    END as entity_title
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.project_id = 1
ORDER BY al.created_at DESC
LIMIT 50;

-- Get user's recent activity across all projects
SELECT
    al.id,
    al.entity_type,
    al.action,
    al.created_at,
    p.name as project_name,
    CASE
        WHEN al.entity_type = 'task' THEN (SELECT title FROM tasks WHERE id = al.entity_id)
        ELSE NULL
    END as entity_title
FROM activity_logs al
LEFT JOIN projects p ON al.project_id = p.id
WHERE al.user_id = 2
ORDER BY al.created_at DESC
LIMIT 20;

-- =====================================================================
-- NOTIFICATIONS
-- =====================================================================

-- Create a notification for task assignment
INSERT INTO notifications (
    user_id,
    type,
    related_entity_type,
    related_entity_id,
    title,
    message,
    action_url
)
VALUES (
    2,
    'task_assigned',
    'task',
    1,
    'New task assigned',
    'You have been assigned to "Design homepage mockup"',
    '/projects/1/tasks/1'
)
RETURNING id;

-- Get unread notifications for a user
SELECT
    n.id,
    n.type,
    n.title,
    n.message,
    n.action_url,
    n.created_at
FROM notifications n
WHERE n.user_id = 2
    AND n.is_read = false
    AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
ORDER BY n.created_at DESC;

-- Get unread notification count
SELECT COUNT(*)
FROM notifications
WHERE user_id = 2
    AND is_read = false
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- Mark notification as read
UPDATE notifications
SET is_read = true,
    read_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Mark all notifications as read for a user
UPDATE notifications
SET is_read = true,
    read_at = CURRENT_TIMESTAMP
WHERE user_id = 2
    AND is_read = false;

-- Create deadline reminder notification
INSERT INTO notifications (
    user_id,
    type,
    related_entity_type,
    related_entity_id,
    title,
    message,
    action_url,
    sent_via_email,
    email_sent_at
)
VALUES (
    2,
    'deadline_reminder',
    'task',
    1,
    'Task deadline approaching',
    'Task "Design homepage mockup" is due in 2 days',
    '/projects/1/tasks/1',
    true,
    CURRENT_TIMESTAMP
);

-- =====================================================================
-- TAGS
-- =====================================================================

-- Create tags for a project
INSERT INTO tags (project_id, name, color)
VALUES
    (1, 'Frontend', '#3B82F6'),
    (1, 'Backend', '#10B981'),
    (1, 'Design', '#F59E0B'),
    (1, 'Bug', '#EF4444')
ON CONFLICT (project_id, name) DO NOTHING;

-- Add tags to a task
INSERT INTO task_tags (task_id, tag_id)
SELECT 1, id FROM tags WHERE project_id = 1 AND name IN ('Frontend', 'Design')
ON CONFLICT (task_id, tag_id) DO NOTHING;

-- Get all tasks with a specific tag
SELECT
    t.id,
    t.title,
    t.status,
    t.priority,
    tag.name as tag_name,
    tag.color as tag_color
FROM tasks t
JOIN task_tags tt ON t.id = tt.task_id
JOIN tags tag ON tt.tag_id = tag.id
WHERE tag.project_id = 1
    AND tag.name = 'Frontend'
    AND t.deleted_at IS NULL;

-- Get tag usage statistics for a project
SELECT
    tag.id,
    tag.name,
    tag.color,
    COUNT(tt.task_id) as task_count
FROM tags tag
LEFT JOIN task_tags tt ON tag.id = tt.tag_id
WHERE tag.project_id = 1
GROUP BY tag.id, tag.name, tag.color
ORDER BY task_count DESC, tag.name;

-- =====================================================================
-- TASK WATCHERS
-- =====================================================================

-- Add user as a watcher to a task
INSERT INTO task_watchers (task_id, user_id)
VALUES (1, 3)
ON CONFLICT (task_id, user_id) DO NOTHING;

-- Get all watchers for a task
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as name,
    tw.watch_started_at
FROM task_watchers tw
JOIN users u ON tw.user_id = u.id
WHERE tw.task_id = 1;

-- Remove user from watching a task
DELETE FROM task_watchers
WHERE task_id = 1 AND user_id = 3;

-- Get all tasks a user is watching
SELECT
    t.id,
    t.title,
    t.status,
    p.name as project_name
FROM task_watchers tw
JOIN tasks t ON tw.task_id = t.id
JOIN projects p ON t.project_id = p.id
WHERE tw.user_id = 3
    AND t.deleted_at IS NULL;

-- =====================================================================
-- SESSIONS
-- =====================================================================

-- Create a new session
INSERT INTO sessions (
    user_id,
    token_hash,
    ip_address,
    user_agent,
    expires_at
)
VALUES (
    2,
    'hashed_token_here',
    '192.168.1.100'::inet,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    CURRENT_TIMESTAMP + INTERVAL '7 days'
)
RETURNING id;

-- Validate and update session
UPDATE sessions
SET last_activity_at = CURRENT_TIMESTAMP
WHERE token_hash = 'hashed_token_here'
    AND is_active = true
    AND expires_at > CURRENT_TIMESTAMP
RETURNING user_id;

-- Get active sessions for a user
SELECT
    id,
    ip_address,
    user_agent,
    last_activity_at,
    expires_at,
    created_at
FROM sessions
WHERE user_id = 2
    AND is_active = true
    AND expires_at > CURRENT_TIMESTAMP
ORDER BY last_activity_at DESC;

-- Logout (invalidate session)
UPDATE sessions
SET is_active = false
WHERE id = 'session-uuid-here';

-- Logout all sessions for a user
UPDATE sessions
SET is_active = false
WHERE user_id = 2 AND is_active = true;

-- Clean up expired sessions
DELETE FROM sessions
WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- =====================================================================
-- REPORTING QUERIES
-- =====================================================================

-- Project progress report
SELECT
    p.id,
    p.name,
    p.status,
    COUNT(DISTINCT t.id) FILTER (WHERE t.deleted_at IS NULL) as total_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.deleted_at IS NULL) as completed_tasks,
    ROUND(
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.deleted_at IS NULL)::numeric /
        NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.deleted_at IS NULL), 0) * 100,
        2
    ) as completion_percentage,
    SUM(t.estimated_hours) FILTER (WHERE t.deleted_at IS NULL) as total_estimated_hours,
    SUM(t.actual_hours) FILTER (WHERE t.deleted_at IS NULL) as total_actual_hours
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
WHERE p.id = 1
GROUP BY p.id, p.name, p.status;

-- User workload report
SELECT
    u.id,
    u.first_name || ' ' || u.last_name as name,
    COUNT(t.id) FILTER (WHERE t.status NOT IN ('completed', 'cancelled') AND t.deleted_at IS NULL) as active_tasks,
    COUNT(t.id) FILTER (WHERE t.end_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled') AND t.deleted_at IS NULL) as overdue_tasks,
    SUM(t.estimated_hours) FILTER (WHERE t.status NOT IN ('completed', 'cancelled') AND t.deleted_at IS NULL) as total_estimated_hours
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
WHERE u.id = 2
GROUP BY u.id, u.first_name, u.last_name;

-- Team performance report
SELECT
    u.id,
    u.first_name || ' ' || u.last_name as name,
    COUNT(t.id) FILTER (WHERE t.deleted_at IS NULL) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'completed' AND t.deleted_at IS NULL) as completed_tasks,
    ROUND(AVG(t.progress) FILTER (WHERE t.deleted_at IS NULL), 2) as avg_progress,
    SUM(t.actual_hours) FILTER (WHERE t.deleted_at IS NULL) as total_hours_worked
FROM users u
JOIN project_members pm ON u.id = pm.user_id
LEFT JOIN tasks t ON u.id = t.assigned_to AND t.project_id = pm.project_id
WHERE pm.project_id = 1
GROUP BY u.id, u.first_name, u.last_name
ORDER BY completed_tasks DESC;

-- =====================================================================
-- ADVANCED QUERIES
-- =====================================================================

-- Critical path analysis (simplified - real critical path requires recursive graph analysis)
WITH task_depths AS (
    SELECT
        t.id,
        t.title,
        t.duration,
        COUNT(td.depends_on_task_id) as dependency_count
    FROM tasks t
    LEFT JOIN task_dependencies td ON t.id = td.task_id
    WHERE t.project_id = 1 AND t.deleted_at IS NULL
    GROUP BY t.id, t.title, t.duration
)
SELECT * FROM task_depths
ORDER BY dependency_count DESC, duration DESC;

-- Find tasks blocking other tasks
SELECT DISTINCT
    t.id,
    t.title,
    t.status,
    t.end_date,
    COUNT(td.task_id) as blocking_task_count
FROM tasks t
JOIN task_dependencies td ON t.id = td.depends_on_task_id
WHERE t.status NOT IN ('completed', 'cancelled')
    AND t.deleted_at IS NULL
GROUP BY t.id, t.title, t.status, t.end_date
HAVING COUNT(td.task_id) > 0
ORDER BY blocking_task_count DESC;

-- Search tasks by keyword (full-text search would be better with pg_trgm)
SELECT
    t.id,
    t.title,
    t.description,
    p.name as project_name,
    ts_rank(
        to_tsvector('english', t.title || ' ' || COALESCE(t.description, '')),
        plainto_tsquery('english', 'homepage design')
    ) as rank
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE to_tsvector('english', t.title || ' ' || COALESCE(t.description, ''))
      @@ plainto_tsquery('english', 'homepage design')
    AND t.deleted_at IS NULL
ORDER BY rank DESC;

-- =====================================================================
-- MAINTENANCE QUERIES
-- =====================================================================

-- Find orphaned tasks (assigned to deleted users)
SELECT
    t.id,
    t.title,
    t.assigned_to,
    t.project_id
FROM tasks t
WHERE t.assigned_to IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = t.assigned_to AND u.deleted_at IS NULL
    )
    AND t.deleted_at IS NULL;

-- Find tasks with invalid date ranges
SELECT id, title, start_date, end_date
FROM tasks
WHERE start_date IS NOT NULL
    AND end_date IS NOT NULL
    AND end_date < start_date
    AND deleted_at IS NULL;

-- Clean up old soft-deleted records (optional - be careful!)
-- DELETE FROM tasks WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
-- DELETE FROM comments WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
-- DELETE FROM file_attachments WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

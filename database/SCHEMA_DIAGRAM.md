# Database Schema Diagram

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROJECT MANAGEMENT SCHEMA                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      USERS       │
├──────────────────┤
│ PK id            │
│    email         │◄──────────┐
│    password_hash │           │
│    first_name    │           │
│    last_name     │           │
│    avatar_url    │           │
│    is_active     │           │
│    last_login    │           │
│    created_at    │           │
│    updated_at    │           │
│    deleted_at    │           │
└──────────────────┘           │
         △                     │
         │                     │
         │ created_by          │
         │ (RESTRICT)          │
         │                     │
┌────────┴─────────┐           │
│    PROJECTS      │           │
├──────────────────┤           │
│ PK id            │           │
│    name          │           │
│    description   │           │
│    start_date    │           │
│    end_date      │           │
│    status        │           │
│ FK created_by    ├───────────┘
│    created_at    │
│    updated_at    │
│    deleted_at    │
└──────────────────┘
         △
         │
         │ CASCADE
         │
    ┌────┴────┬──────────────┬──────────────┬──────────────┐
    │         │              │              │              │
┌───┴────────┐│         ┌────┴─────┐   ┌────┴─────┐  ┌────┴─────────┐
│PROJECT_    ││         │  TASKS   │   │ACTIVITY_ │  │     TAGS     │
│MEMBERS     ││         │          │   │LOGS      │  │              │
├────────────┤│         ├──────────┤   ├──────────┤  ├──────────────┤
│PK id       ││         │PK id     │   │PK id     │  │PK id         │
│FK project_id│         │FK project│   │FK project│  │FK project_id │
│FK user_id  ││         │   _id    │   │   _id    │  │   name       │
│   role     ││         │   title  │   │FK user_id│  │   color      │
│   joined_at││         │   descr. │   │ entity_  │  │   created_at │
│FK invited_by│         │   start_ │   │  type    │  └──────────────┘
└────────────┘│         │   date   │   │ entity_id│         △
              │         │   end_   │   │   action │         │
              │         │   date   │   │   changes│         │
              │         │   duration│   │ metadata │         │
              │         │   progress│   │created_at│         │
              │         │   status │   └──────────┘         │
              │         │   priority│                       │
              │         │FK assigned│                       │
              │         │   _to    │                       │
              │         │FK created│                       │
              │         │   _by    │                       │
              │         │FK parent_│                       │
              │         │   task_id│ (subtasks)            │
              │         │   position│                       │
              │         │estimated │                       │
              │         │   _hours │                       │
              │         │actual_   │                       │
              │         │   hours  │                       │
              │         │completed │                       │
              │         │   _at    │                       │
              │         │created_at│                       │
              │         │updated_at│                       │
              │         │deleted_at│                       │
              │         └──────────┘                       │
              │              △                             │
              │              │ CASCADE                     │
              │         ┌────┴────┬──────────┬─────────┬───┴──────┐
              │         │         │          │         │          │
              │    ┌────┴──────┐ │    ┌─────┴─────┐ ┌─┴────────┐ │
              │    │TASK_      │ │    │COMMENTS   │ │FILE_     │ │
              │    │DEPENDENCIES│ │    │           │ │ATTACH-   │ │
              │    ├───────────┤ │    ├───────────┤ │MENTS     │ │
              │    │PK id      │ │    │PK id      │ ├──────────┤ │
              │    │FK task_id │ │    │FK task_id │ │PK id     │ │
              │    │FK depends_│ │    │FK user_id │ │FK task_id│ │
              │    │   on_task│ │    │FK parent_ │ │FK uploaded│ │
              │    │   _id    │ │    │   comment │ │   _by    │ │
              │    │dependency│ │    │   _id     │ │file_name │ │
              │    │   _type  │ │    │   content │ │file_path │ │
              │    │lag_time  │ │    │is_edited  │ │file_size │ │
              │    │created_at│ │    │created_at │ │mime_type │ │
              │    └──────────┘ │    │updated_at │ │file_hash │ │
              │                 │    │deleted_at │ │description│ │
              │                 │    └───────────┘ │uploaded_at│ │
              │                 │                  │deleted_at │ │
              │                 │                  └──────────┘ │
              │                 │                               │
              │            ┌────┴─────────┐               ┌────┴─────┐
              │            │TASK_WATCHERS │               │TASK_TAGS │
              │            ├──────────────┤               ├──────────┤
              │            │PK id         │               │PK id     │
              │            │FK task_id    │               │FK task_id│
              │            │FK user_id    │               │FK tag_id │◄─┘
              │            │watch_started │               │created_at│
              │            │   _at        │               └──────────┘
              │            └──────────────┘
              │
              │
         ┌────┴────────────┐
         │ NOTIFICATIONS   │
         ├─────────────────┤
         │ PK id           │
         │ FK user_id      │
         │    type         │
         │ related_entity_ │
         │    type         │
         │ related_entity_ │
         │    id           │
         │    title        │
         │    message      │
         │    action_url   │
         │    is_read      │
         │    read_at      │
         │ sent_via_email  │
         │ email_sent_at   │
         │    created_at   │
         │    expires_at   │
         └─────────────────┘

         ┌─────────────────┐
         │    SESSIONS     │
         ├─────────────────┤
         │ PK id (UUID)    │
         │ FK user_id      │
         │    token_hash   │
         │    ip_address   │
         │    user_agent   │
         │    is_active    │
         │ last_activity   │
         │    _at          │
         │    expires_at   │
         │    created_at   │
         └─────────────────┘
```

## Relationship Details

### Primary Relationships

| Parent Table | Child Table | Relationship | ON DELETE |
|--------------|-------------|--------------|-----------|
| users | projects | 1:N | RESTRICT |
| users | sessions | 1:N | CASCADE |
| users | notifications | 1:N | CASCADE |
| projects | tasks | 1:N | CASCADE |
| projects | project_members | 1:N | CASCADE |
| projects | activity_logs | 1:N | CASCADE |
| projects | tags | 1:N | CASCADE |
| tasks | tasks (subtasks) | 1:N | CASCADE |
| tasks | comments | 1:N | CASCADE |
| tasks | file_attachments | 1:N | CASCADE |
| tasks | task_dependencies | N:N | CASCADE |

### Many-to-Many Relationships

| Table 1 | Junction Table | Table 2 | Purpose |
|---------|---------------|---------|---------|
| projects | project_members | users | Project membership with roles |
| tasks | task_watchers | users | Task watch notifications |
| tasks | task_tags | tags | Task categorization |
| tasks | task_dependencies | tasks | Task dependency graph |

### Cascade Behavior

#### CASCADE Deletes
When these records are deleted, related records are also deleted:
- Delete **project** → deletes all tasks, members, activity logs, tags
- Delete **task** → deletes all comments, attachments, dependencies, watchers, tags
- Delete **user** → deletes all sessions, notifications, project memberships

#### RESTRICT Deletes
These records cannot be deleted if referenced:
- Delete **user** → blocked if user created projects or tasks

#### SET NULL
These records are set to NULL when parent is deleted:
- Delete **user** → sets `assigned_to`, `uploaded_by`, `created_by` in comments to NULL
- Preserves data integrity while allowing user deletion

## Key Constraints

### Unique Constraints
- `users.email` - One email per user
- `project_members(project_id, user_id)` - User can join project once
- `task_watchers(task_id, user_id)` - User can watch task once
- `task_tags(task_id, tag_id)` - Tag can be applied to task once
- `task_dependencies(task_id, depends_on_task_id)` - One dependency between two tasks
- `tags(project_id, name)` - Tag name unique within project

### Check Constraints
- `task_dependencies.no_self_dependency` - Task cannot depend on itself
- `tasks.progress` - Must be between 0-100
- `tasks.dates` - End date >= start date
- `projects.dates` - End date >= start date
- `users.email` - Valid email format
- `tags.color` - Valid hex color code (#RRGGBB)

### Trigger Constraints
- **Circular Dependencies** - Prevents direct circular dependencies (A→B, B→A)
- **Cross-Project Dependencies** - Tasks can only depend on tasks in same project
- **Completed Tasks** - Auto-sets `completed_at` and progress to 100 when status = completed
- **Edited Comments** - Auto-sets `is_edited` flag when content changes

## Index Summary

### High-Priority Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| tasks | idx_tasks_gantt_view | Composite | Gantt chart queries |
| tasks | idx_tasks_overdue | Partial | Overdue task alerts |
| tasks | idx_tasks_project_status | Composite | Filter by project and status |
| notifications | idx_notifications_user_unread | Partial | Unread notification count |
| activity_logs | idx_activity_logs_project_recent | Composite | Activity feed |
| sessions | idx_sessions_active_users | Partial | Active user tracking |

## Data Flow Examples

### Creating a Task
```
1. INSERT INTO tasks (project_id, title, assigned_to, ...)
   ↓
2. Trigger: update_tasks_updated_at (sets updated_at)
   ↓
3. INSERT INTO activity_logs (entity_type='task', action='created', ...)
   ↓
4. INSERT INTO notifications (user_id=assigned_to, type='task_assigned', ...)
   ↓
5. Optional: INSERT INTO task_watchers (task_id, user_id)
```

### Completing a Task
```
1. UPDATE tasks SET status='completed' WHERE id=?
   ↓
2. Trigger: update_task_completed_at
   - Sets completed_at = CURRENT_TIMESTAMP
   - Sets progress = 100
   ↓
3. Trigger: update_tasks_updated_at
   - Sets updated_at = CURRENT_TIMESTAMP
   ↓
4. INSERT INTO activity_logs (action='completed', changes={...})
   ↓
5. INSERT INTO notifications (type='task_completed', ...)
```

### Deleting a Project (Cascade)
```
1. DELETE FROM projects WHERE id=?
   ↓
2. CASCADE: Delete all tasks in project
   ↓
3. CASCADE: Delete all comments on those tasks
   ↓
4. CASCADE: Delete all file_attachments on those tasks
   ↓
5. CASCADE: Delete all task_dependencies
   ↓
6. CASCADE: Delete all task_watchers
   ↓
7. CASCADE: Delete all task_tags
   ↓
8. CASCADE: Delete all project_members
   ↓
9. CASCADE: Delete all activity_logs for project
   ↓
10. CASCADE: Delete all tags in project
```

## Performance Considerations

### Hot Tables (High Write Volume)
- `activity_logs` - Every action generates a log entry
- `notifications` - Frequent inserts for user notifications
- `sessions` - Updated on every request

**Optimization Strategies:**
- Consider partitioning by date
- Regular VACUUM ANALYZE
- Archive old data periodically

### Large Tables (High Row Count Expected)
- `tasks` - Grows with project usage
- `comments` - Can grow very large
- `file_attachments` - Metadata only, but high volume

**Optimization Strategies:**
- Ensure proper indexing on foreign keys
- Use partial indexes for common filters
- Consider soft delete cleanup policies

---

**Legend:**
- PK = Primary Key
- FK = Foreign Key
- CASCADE = Delete child records when parent is deleted
- RESTRICT = Prevent deletion if child records exist
- SET NULL = Set child FK to NULL when parent is deleted
- △ = One-to-Many relationship
- ◄─► = Many-to-Many relationship (via junction table)

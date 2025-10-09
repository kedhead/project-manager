#!/bin/bash

echo "Running groups migration..."
echo ""

# Copy SQL file into container and run it
docker cp fix-migration.sql pm_db:/tmp/fix-migration.sql
docker-compose exec -T db psql -U pmuser -d projectmanager -f /tmp/fix-migration.sql

echo ""
echo "Checking if column was added..."
docker-compose exec db psql -U pmuser -d projectmanager -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_group_id';"

echo ""
echo "Restarting backend..."
docker-compose restart backend

echo ""
echo "Done! Check if errors are gone:"
echo "docker-compose logs --tail=20 backend"

# OLD APPROACH BELOW - KEEPING AS BACKUP
docker-compose exec -T db psql -U pmuser -d projectmanager <<'EOSQL_BACKUP'
-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_groups_project_id ON groups(project_id);
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Add assigned_group_id to tasks (check first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'assigned_group_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN assigned_group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL;
        CREATE INDEX idx_tasks_assigned_group_id ON tasks(assigned_group_id);

        -- Add constraint
        ALTER TABLE tasks ADD CONSTRAINT task_assignment_check CHECK (
            (assigned_to IS NOT NULL AND assigned_group_id IS NULL) OR
            (assigned_to IS NULL AND assigned_group_id IS NOT NULL) OR
            (assigned_to IS NULL AND assigned_group_id IS NULL)
        );

        RAISE NOTICE 'Added assigned_group_id column to tasks table';
    ELSE
        RAISE NOTICE 'Column assigned_group_id already exists';
    END IF;
END $$;

SELECT 'Migration completed!' as status;
EOSQL

echo ""
echo "Restarting backend..."
docker-compose restart backend

echo ""
echo "Done! Check logs:"
docker-compose logs --tail=10 backend

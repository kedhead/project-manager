#!/bin/bash

echo "=== Fixing ContainerConfig Error ==="
echo ""

# Stop all containers
echo "1. Stopping all containers..."
docker-compose down

# Remove containers forcefully
echo "2. Removing containers..."
docker rm -f pm_backend pm_frontend pm_db pm_nginx 2>/dev/null || true

# Remove any dangling containers
echo "3. Cleaning up dangling containers..."
docker container prune -f

# Pull latest code
echo "4. Pulling latest code..."
git pull

# Rebuild without cache
echo "5. Rebuilding images (this may take a few minutes)..."
docker-compose build --no-cache backend frontend

# Start containers
echo "6. Starting containers..."
docker-compose up -d

# Wait a bit for database to be ready
echo "7. Waiting for database to be ready..."
sleep 10

# Run the migration
echo "8. Running groups migration..."
docker-compose exec -T db psql -U pmuser -d projectmanager << 'EOSQL'
-- Check if groups table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'groups') THEN
        -- Create groups table
        CREATE TABLE groups (
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

        CREATE INDEX idx_groups_project_id ON groups(project_id);
        CREATE INDEX idx_groups_deleted_at ON groups(deleted_at);

        -- Create group_members table
        CREATE TABLE group_members (
            id BIGSERIAL PRIMARY KEY,
            group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            added_by BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
            added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
        );

        CREATE INDEX idx_group_members_group_id ON group_members(group_id);
        CREATE INDEX idx_group_members_user_id ON group_members(user_id);

        -- Add assigned_group_id to tasks
        ALTER TABLE tasks ADD COLUMN assigned_group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL;

        -- Add constraint to ensure task is assigned to person OR group, not both
        ALTER TABLE tasks ADD CONSTRAINT task_assignment_check CHECK (
            (assigned_to IS NOT NULL AND assigned_group_id IS NULL) OR
            (assigned_to IS NULL AND assigned_group_id IS NOT NULL) OR
            (assigned_to IS NULL AND assigned_group_id IS NULL)
        );

        CREATE INDEX idx_tasks_assigned_group_id ON tasks(assigned_group_id);

        RAISE NOTICE 'Groups migration completed successfully!';
    ELSE
        RAISE NOTICE 'Groups table already exists, skipping migration.';
    END IF;
END $$;
EOSQL

echo ""
echo "9. Checking container status..."
docker-compose ps

echo ""
echo "10. Checking backend logs..."
docker-compose logs --tail=20 backend

echo ""
echo "=== Deployment Complete! ==="
echo "If you see any errors above, run: docker-compose logs backend"

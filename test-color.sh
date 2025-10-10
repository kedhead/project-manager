#!/bin/bash

# Test if color column exists and has data
# Run this on your VPS

echo "=================================="
echo "Testing Color Column"
echo "=================================="
echo ""

cd ~/project-manager

echo "Step 1: Check if color column exists..."
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'color';"
echo ""

echo "Step 2: Check color values in tasks..."
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "SELECT id, title, color FROM tasks WHERE project_id = 2 LIMIT 5;"
echo ""

echo "Step 3: Update a task with a test color..."
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "UPDATE tasks SET color = '#FF5733' WHERE id = 3;"
echo ""

echo "Step 4: Verify the color was set..."
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "SELECT id, title, color FROM tasks WHERE id = 3;"
echo ""

echo "=================================="
echo "Test Complete!"
echo "=================================="

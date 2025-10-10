#!/bin/bash

# Check and fix color column issue
# Run this on your VPS

set -e

echo "=================================="
echo "Checking Color Column Setup"
echo "=================================="
echo ""

cd ~/project-manager

echo "Step 1: Checking if color column exists in database..."
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "\d tasks" | grep color || echo "Color column NOT FOUND"
echo ""

echo "Step 2: Running database migration..."
docker cp database/migrations/003_add_task_color.sql pm_postgres:/tmp/
docker exec -i pm_postgres psql -U pm_user -d project_manager -f /tmp/003_add_task_color.sql
echo ""

echo "Step 3: Verifying column was added..."
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "\d tasks" | grep color
echo ""

echo "Step 4: Pulling latest backend code..."
git pull origin main
echo ""

echo "Step 5: Checking backend files..."
ls -la backend/dist/services/tasks.service.js 2>/dev/null || echo "Backend not built locally"
echo ""

echo "Step 6: Deploying backend..."
docker cp backend/dist/. pm_backend:/app/dist/ 2>/dev/null || echo "No local build to deploy"
echo ""

echo "Step 7: Restarting backend..."
docker-compose restart backend
echo "Waiting for backend to restart..."
sleep 5
echo ""

echo "Step 8: Checking backend logs..."
docker-compose logs --tail=20 backend
echo ""

echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "Test the application and check browser console again"

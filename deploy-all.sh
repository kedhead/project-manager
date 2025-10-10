#!/bin/bash

# Full Stack Deployment Script
# Run this on your VPS

set -e  # Exit on error

echo "=================================="
echo "Full Stack Deployment Script"
echo "=================================="
echo ""

echo "Step 1: Navigating to project directory..."
cd ~/project-manager
echo "Current directory: $(pwd)"
echo ""

echo "Step 2: Pulling latest changes..."
git pull origin main
echo ""

echo "Step 3: Running database migration..."
if [ -f "database/migrations/003_add_task_color.sql" ]; then
    docker cp database/migrations/003_add_task_color.sql pm_postgres:/tmp/
    docker exec -i pm_postgres psql -U pm_user -d project_manager -f /tmp/003_add_task_color.sql || echo "Migration may have already run"
    echo "Database migration complete"
else
    echo "Migration file not found, skipping..."
fi
echo ""

echo "Step 4: Deploying backend..."
docker cp backend/dist/. pm_backend:/app/dist/
echo "Backend files copied"
echo ""

echo "Step 5: Restarting backend service..."
docker-compose restart backend
echo "Waiting for backend to start..."
sleep 5
echo ""

echo "Step 6: Deploying frontend..."
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
echo "Frontend files copied"
echo ""

echo "Step 7: Reloading nginx..."
docker exec pm_frontend nginx -s reload
echo ""

echo "Step 8: Checking container status..."
docker-compose ps
echo ""

echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Application should be live at: http://107.173.91.179"
echo ""
echo "To check logs:"
echo "  Backend:  docker-compose logs backend --tail=50"
echo "  Frontend: docker logs pm_frontend --tail=50"
echo "  Database: docker-compose logs postgres --tail=50"

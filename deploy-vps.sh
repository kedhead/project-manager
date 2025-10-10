#!/bin/bash

# Complete VPS Deployment Script
# Run this ON YOUR VPS

set -e  # Exit on error

echo "=================================="
echo "Complete VPS Deployment"
echo "=================================="
echo ""

cd ~/project-manager

echo "Step 1: Pulling latest code..."
git pull origin main
echo ""

echo "Step 2: Building frontend on VPS..."
cd frontend
npm install
npm run build
cd ..
echo ""

echo "Step 3: Building backend on VPS..."
cd backend
npm install
npm run build
cd ..
echo ""

echo "Step 4: Running database migration..."
if [ -f "database/migrations/003_add_task_color.sql" ]; then
    docker cp database/migrations/003_add_task_color.sql pm_postgres:/tmp/ 2>/dev/null || true
    docker exec -i pm_postgres psql -U pm_user -d project_manager -f /tmp/003_add_task_color.sql 2>/dev/null || echo "Migration already applied"
fi
echo ""

echo "Step 5: Deploying backend..."
docker cp backend/dist/. pm_backend:/app/dist/
docker-compose restart backend
echo "Waiting for backend to start..."
sleep 5
echo ""

echo "Step 6: Completely clearing frontend..."
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"
echo ""

echo "Step 7: Deploying frontend..."
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
echo ""

echo "Step 8: Verifying deployment..."
echo ""
echo "=== Frontend files ==="
docker exec pm_frontend ls -la /usr/share/nginx/html/
echo ""
echo "=== Assets ==="
docker exec pm_frontend ls -la /usr/share/nginx/html/assets/ | head -10
echo ""

echo "Step 9: Restarting nginx..."
docker restart pm_frontend
sleep 3
echo ""

echo "Step 10: Checking all containers..."
docker-compose ps
echo ""

echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Application: http://107.173.91.179"
echo ""
echo "To check logs:"
echo "  docker-compose logs backend --tail=50"
echo "  docker logs pm_frontend --tail=50"

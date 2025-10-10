#!/bin/bash

# Deploy from local machine to VPS
# Run this on your LOCAL machine (Windows Git Bash)

set -e

VPS_HOST="root@107.173.91.179"
VPS_PATH="~/project-manager"

echo "=================================="
echo "Deploying from Local to VPS"
echo "=================================="
echo ""

echo "Step 1: Building frontend locally..."
cd frontend
npm run build
cd ..
echo ""

echo "Step 2: Building backend locally..."
cd backend
npm run build
cd ..
echo ""

echo "Step 3: Creating tarball of built files..."
tar -czf frontend-dist.tar.gz -C frontend/dist .
tar -czf backend-dist.tar.gz -C backend/dist .
echo ""

echo "Step 4: Copying files to VPS..."
scp frontend-dist.tar.gz "$VPS_HOST:$VPS_PATH/"
scp backend-dist.tar.gz "$VPS_HOST:$VPS_PATH/"
scp database/migrations/003_add_task_color.sql "$VPS_HOST:$VPS_PATH/" 2>/dev/null || true
echo ""

echo "Step 5: Extracting and deploying on VPS..."
ssh "$VPS_HOST" << 'ENDSSH'
cd ~/project-manager

# Run database migration
docker cp 003_add_task_color.sql pm_postgres:/tmp/ 2>/dev/null || true
docker exec -i pm_postgres psql -U pm_user -d project_manager -f /tmp/003_add_task_color.sql 2>/dev/null || echo "Migration already applied"

# Deploy backend
mkdir -p backend-temp
tar -xzf backend-dist.tar.gz -C backend-temp
docker cp backend-temp/. pm_backend:/app/dist/
rm -rf backend-temp
docker-compose restart backend
echo "Waiting for backend..."
sleep 5

# Deploy frontend
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"
mkdir -p frontend-temp
tar -xzf frontend-dist.tar.gz -C frontend-temp
docker cp frontend-temp/. pm_frontend:/usr/share/nginx/html/
rm -rf frontend-temp

# Verify
echo ""
echo "=== Verifying frontend files ==="
docker exec pm_frontend ls -la /usr/share/nginx/html/
echo ""
echo "=== Verifying assets ==="
docker exec pm_frontend ls -la /usr/share/nginx/html/assets/

# Restart nginx
docker restart pm_frontend
sleep 3

# Clean up tarballs
rm -f frontend-dist.tar.gz backend-dist.tar.gz

echo ""
echo "Deployment complete!"
docker-compose ps
ENDSSH

echo ""
echo "Step 6: Cleaning up local tarballs..."
rm -f frontend-dist.tar.gz backend-dist.tar.gz
echo ""

echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Application: http://107.173.91.179"

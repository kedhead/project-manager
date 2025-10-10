#!/bin/bash

# Fix nginx configuration and redeploy frontend
# Run this on your VPS

set -e  # Exit on error

echo "=================================="
echo "Fixing Nginx Configuration"
echo "=================================="
echo ""

cd ~/project-manager

echo "Step 1: Pulling latest changes..."
git pull origin main
echo ""

echo "Step 2: Backing up current nginx config..."
docker exec pm_frontend cat /etc/nginx/conf.d/default.conf > nginx-backup.conf || echo "No config to backup"
echo ""

echo "Step 3: Copying new nginx configuration..."
docker cp nginx.conf pm_frontend:/etc/nginx/conf.d/default.conf
echo ""

echo "Step 4: Testing nginx configuration..."
docker exec pm_frontend nginx -t
echo ""

echo "Step 5: Clearing old frontend files..."
docker exec pm_frontend rm -rf /usr/share/nginx/html/*
echo ""

echo "Step 6: Copying fresh frontend build..."
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
echo ""

echo "Step 7: Verifying files were copied..."
echo "Root files:"
docker exec pm_frontend ls -la /usr/share/nginx/html/
echo ""
echo "Assets directory:"
docker exec pm_frontend ls -la /usr/share/nginx/html/assets/
echo ""

echo "Step 8: Restarting nginx container..."
docker restart pm_frontend
echo "Waiting for nginx to start..."
sleep 3
echo ""

echo "Step 9: Checking nginx is running..."
docker ps | grep pm_frontend
echo ""

echo "=================================="
echo "Fix Complete!"
echo "=================================="
echo ""
echo "Test the application at: http://107.173.91.179"
echo ""
echo "If still having issues, check nginx logs:"
echo "  docker logs pm_frontend --tail=50"

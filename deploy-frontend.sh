#!/bin/bash

# Frontend Deployment and Diagnostics Script
# Run this on your VPS

set -e  # Exit on error

echo "=================================="
echo "Frontend Deployment Script"
echo "=================================="
echo ""

echo "Step 1: Checking if frontend files exist..."
docker exec pm_frontend ls -la /usr/share/nginx/html/
echo ""

echo "Step 2: Checking assets directory..."
docker exec pm_frontend ls -la /usr/share/nginx/html/assets/ || echo "Assets directory not found!"
echo ""

echo "Step 3: Checking nginx configuration..."
docker exec pm_frontend cat /etc/nginx/conf.d/default.conf
echo ""

echo "Step 4: Navigating to project directory..."
cd ~/project-manager
echo "Current directory: $(pwd)"
echo ""

echo "Step 5: Pulling latest changes..."
git pull origin main
echo ""

echo "Step 6: Copying frontend files to container..."
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
echo ""

echo "Step 7: Verifying files were copied..."
echo "Root files:"
docker exec pm_frontend ls -la /usr/share/nginx/html/
echo ""
echo "Assets files:"
docker exec pm_frontend ls -la /usr/share/nginx/html/assets/
echo ""

echo "Step 8: Reloading nginx..."
docker exec pm_frontend nginx -s reload
echo ""

echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Check your browser at: http://107.173.91.179"
echo "If still broken, check the nginx logs:"
echo "  docker logs pm_frontend --tail=50"

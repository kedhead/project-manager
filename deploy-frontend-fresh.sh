#!/bin/bash

# Deploy Fresh Frontend Build
# Run this on your VPS

set -e  # Exit on error

echo "=================================="
echo "Deploying Fresh Frontend Build"
echo "=================================="
echo ""

cd ~/project-manager

echo "Step 1: Pulling latest code..."
git pull origin main
echo ""

echo "Step 2: Completely clearing nginx html directory..."
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"
echo ""

echo "Step 3: Copying complete fresh build (all files at once)..."
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
echo ""

echo "Step 4: Verifying all files are present..."
echo ""
echo "=== Root directory ==="
docker exec pm_frontend ls -la /usr/share/nginx/html/
echo ""
echo "=== Assets directory ==="
docker exec pm_frontend ls -la /usr/share/nginx/html/assets/
echo ""
echo "=== index.html content ==="
docker exec pm_frontend cat /usr/share/nginx/html/index.html
echo ""

echo "Step 5: Restarting nginx..."
docker restart pm_frontend
echo "Waiting for nginx to restart..."
sleep 3
echo ""

echo "Step 6: Verifying nginx is running..."
docker ps | grep pm_frontend
echo ""

echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Visit: http://107.173.91.179"
echo ""
echo "If still broken, run:"
echo "  docker logs pm_frontend --tail=50"

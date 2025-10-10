#!/bin/bash

# Deploy Backend
# Run this on your VPS

set -e

echo "=================================="
echo "Deploying Backend"
echo "=================================="
echo ""

cd ~/project-manager

echo "Step 1: Pulling latest code..."
git pull origin main
echo ""

echo "Step 2: Deploying backend files..."
docker cp backend/dist/. pm_backend:/app/dist/
echo ""

echo "Step 3: Restarting backend..."
docker-compose restart backend
echo "Waiting for backend to restart..."
sleep 5
echo ""

echo "Step 4: Checking backend status..."
docker-compose ps | grep backend
echo ""

echo "Step 5: Testing backend health..."
curl -I http://localhost:3000/health
echo ""

echo "=================================="
echo "Backend Deployment Complete!"
echo "=================================="

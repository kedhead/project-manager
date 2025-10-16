#!/bin/bash

# ==============================================================================
# CLEAN DEPLOYMENT SCRIPT - Project Manager Frontend
# ==============================================================================
# This script ensures a completely clean deployment with no cached files
# Run this on your VPS: bash deploy-clean.sh
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CLEAN DEPLOYMENT SCRIPT - Project Manager Frontend        ║${NC}"
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo ""

# ==============================================================================
# Step 1: Navigate to project directory
# ==============================================================================
echo -e "${YELLOW}[1/10]${NC} Navigating to project directory..."
cd ~/project-manager || { echo -e "${RED}ERROR: ~/project-manager not found${NC}"; exit 1; }
echo -e "${GREEN}✓ In project directory${NC}"
echo ""

# ==============================================================================
# Step 2: Pull latest code from GitHub
# ==============================================================================
echo -e "${YELLOW}[2/10]${NC} Pulling latest code from GitHub..."
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# ==============================================================================
# Step 3: Create .env file with correct API URL
# ==============================================================================
echo -e "${YELLOW}[3/10]${NC} Creating .env file..."
echo 'VITE_API_URL=http://107.173.91.179/api' > frontend/.env
echo -e "${GREEN}✓ .env created${NC}"
cat frontend/.env
echo ""

# ==============================================================================
# Step 4: Navigate to frontend and install dependencies
# ==============================================================================
echo -e "${YELLOW}[4/10]${NC} Installing frontend dependencies..."
cd frontend
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ==============================================================================
# Step 5: Build frontend
# ==============================================================================
echo -e "${YELLOW}[5/10]${NC} Building frontend..."
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# ==============================================================================
# Step 6: Verify build output
# ==============================================================================
echo -e "${YELLOW}[6/10]${NC} Verifying build files..."
echo "Files in dist/assets/:"
ls -lh dist/assets/
echo ""
echo "index.html content:"
cat dist/index.html | grep -E "(index-|stylesheet)"
echo -e "${GREEN}✓ Build verified${NC}"
echo ""

# ==============================================================================
# Step 7: Stop frontend container (optional but safe)
# ==============================================================================
echo -e "${YELLOW}[7/10]${NC} Stopping frontend container..."
cd ..
docker stop pm_frontend || echo "Container was not running"
echo -e "${GREEN}✓ Container stopped${NC}"
echo ""

# ==============================================================================
# Step 8: COMPLETELY CLEAR container files
# ==============================================================================
echo -e "${YELLOW}[8/10]${NC} CLEARING all old files from container..."
docker start pm_frontend
sleep 2
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"
echo ""
echo "Verifying container is empty:"
docker exec pm_frontend ls -la /usr/share/nginx/html/ || echo "Directory is empty"
echo -e "${GREEN}✓ Container cleared${NC}"
echo ""

# ==============================================================================
# Step 9: Copy NEW build to container
# ==============================================================================
echo -e "${YELLOW}[9/10]${NC} Copying new build to container..."
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
echo ""
echo "Verifying new files in container:"
docker exec pm_frontend ls -lh /usr/share/nginx/html/
echo ""
echo "Files in assets directory:"
docker exec pm_frontend ls -lh /usr/share/nginx/html/assets/
echo ""
echo "index.html in container:"
docker exec pm_frontend cat /usr/share/nginx/html/index.html | grep -E "(index-|stylesheet)"
echo -e "${GREEN}✓ New build deployed${NC}"
echo ""

# ==============================================================================
# Step 10: Restart frontend container
# ==============================================================================
echo -e "${YELLOW}[10/10]${NC} Restarting frontend container..."
docker restart pm_frontend
echo ""
echo "Waiting for container to start..."
sleep 5
echo ""
echo "Container status:"
docker ps | grep pm_frontend
echo -e "${GREEN}✓ Container restarted${NC}"
echo ""

# ==============================================================================
# FINAL STATUS
# ==============================================================================
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DEPLOYMENT COMPLETE!                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ All steps completed successfully!${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Open browser: http://107.173.91.179"
echo "2. HARD REFRESH: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "3. Check DevTools Console (F12) - should be clean!"
echo "4. Test the Gantt chart - all features should work"
echo ""
echo -e "${YELLOW}If you still see errors:${NC}"
echo "- Clear browser cache completely"
echo "- Try incognito/private window"
echo "- Check that correct files are loaded in Network tab"
echo ""
echo -e "${GREEN}The new SVAR Gantt is much faster and cleaner!${NC}"
echo ""

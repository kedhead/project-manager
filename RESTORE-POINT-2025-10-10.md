# Restore Point - October 10, 2025

## Current State
Full-featured project management application with Gantt charts, custom task colors, parent task styling, teams/groups, and all core functionality working.

**Git Commit:** `3d6e7f0` - Add color field to task update controller

## Features Completed
- ✅ Interactive DHTMLX Gantt chart with drag-and-drop
- ✅ Task dependencies (4 types: FS, SS, FF, SF)
- ✅ File uploads and attachments
- ✅ Comments and activity tracking
- ✅ Team collaboration with 4 role levels (Owner, Manager, Member, Viewer)
- ✅ Groups/Teams functionality with color coding
- ✅ Export to Excel, CSV, and PDF
- ✅ JWT authentication with refresh tokens
- ✅ **Custom task colors** - Set custom colors for timeline bars
- ✅ **Parent task styling** - Bold text and dark gradient bars for parent tasks
- ✅ **Auto-calculated duration** - Duration auto-fills from start/end dates
- ✅ Rate limiting (1000 requests per 15 minutes)

## Tech Stack
- **Frontend:** React + TypeScript + Vite, DHTMLX Gantt (free v8.0.6), Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 15
- **Deployment:** Docker + Docker Compose on VPS (107.173.91.179)

## Project Structure
```
project-manager/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── GanttChart.tsx       # Main Gantt chart component
│   │   │   ├── TaskDetailModal.tsx  # Task edit modal with color picker
│   │   │   └── ...
│   │   ├── styles/
│   │   │   └── gantt.css           # Custom Gantt styling
│   │   └── api/
│   │       └── tasks.ts            # Task API with color field
│   └── dist/          # Built frontend (committed to git)
├── backend/           # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   │   └── tasks.controller.ts  # Handles color in updates
│   │   ├── services/
│   │   │   └── tasks.service.ts     # Task business logic
│   │   └── config/
│   │       └── index.ts            # Rate limiting config
│   └── dist/          # Built backend (committed to git)
├── database/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_add_groups.sql
│       └── 003_add_task_color.sql   # Color field migration
├── docker-compose.yml
└── deployment scripts/
    ├── deploy-frontend.sh
    ├── deploy-backend.sh
    ├── deploy-all.sh
    └── check-and-fix-color.sh
```

## Database Schema Updates
Latest migration added `color` field to tasks:
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT NULL;
COMMENT ON COLUMN tasks.color IS 'Hex color code for task bar (e.g., #FF5733)';
```

## How to Deploy

### Full Deployment (recommended)
```bash
# On VPS
cd ~/project-manager
git pull origin main

# Deploy backend
docker cp backend/dist/. pm_backend:/app/dist/
docker-compose restart backend

# Deploy frontend
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
docker restart pm_frontend
```

### Quick Deploy Scripts
```bash
# On VPS - use pre-made scripts
cd ~/project-manager
git pull origin main

# Deploy everything
chmod +x deploy-all.sh
./deploy-all.sh

# Or deploy individually
chmod +x deploy-backend.sh deploy-frontend.sh
./deploy-backend.sh    # Backend only
./deploy-frontend.sh   # Frontend only
```

## Environment Variables (.env on VPS)
```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=project_manager
DB_USER=pm_user
DB_PASSWORD=<secure password>

# JWT
JWT_SECRET=<64 char secret>
JWT_REFRESH_SECRET=<64 char secret>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://107.173.91.179

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## Docker Containers
```bash
# Check status
docker-compose ps

# Container names
pm_postgres   # PostgreSQL 15 database
pm_backend    # Node.js Express API (port 3000)
pm_frontend   # Nginx serving React app (port 80)

# View logs
docker-compose logs backend --tail=50
docker logs pm_frontend --tail=50
docker-compose logs postgres --tail=50
```

## Important URLs
- **Application:** http://107.173.91.179
- **API:** http://107.173.91.179/api
- **Repository:** https://github.com/kedhead/project-manager

## Key Features Usage

### Custom Task Colors
1. Click on any task to open the detail modal
2. Scroll to "Timeline Bar Color" field
3. Click the color picker to choose a color
4. Click "Clear Color" to reset to auto-assigned gradient
5. Save the task - color persists across sessions

### Parent Tasks
- Tasks with subtasks automatically display in **bold** text
- Parent task bars show a **dark slate gradient** instead of random colors
- Parent tasks can be manually edited (auto-scheduling is disabled)

### Auto-Calculated Duration
- Set Start Date and End Date
- Duration field auto-fills (read-only)
- Calculated as: (End Date - Start Date) + 1 day

## Troubleshooting

### Tasks not loading
```bash
# Check backend logs for errors
docker-compose logs backend --tail=100

# Restart backend
docker-compose restart backend
```

### Colors not appearing
```bash
# Verify database has color column
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "\d tasks" | grep color

# Check if colors are in database
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "SELECT id, title, color FROM tasks LIMIT 10;"

# Run fix script
./check-and-fix-color.sh
```

### Frontend shows old version
```bash
# Hard refresh browser (Ctrl+Shift+R)
# Or clear browser cache and refresh

# Re-deploy frontend
cd ~/project-manager
git pull origin main
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
docker restart pm_frontend
```

### Rate limit errors (429)
Current limit: 1000 requests per 15 minutes per IP
```bash
# Check current setting
docker exec pm_backend grep -A 2 rateLimit /app/dist/config/index.js

# Increase if needed - edit backend/src/config/index.ts
# Then rebuild and deploy backend
```

## Known Issues & Limitations
- DHTMLX Gantt free version has limited features
- Custom colors require `setProperty` with `'important'` flag to override CSS
- Large projects (100+ tasks) may have performance issues with Gantt rendering
- Parent task colors always use dark slate gradient (cannot be customized)

## Development Workflow

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev        # Runs on localhost:5173

# Backend
cd backend
npm install
npm run dev        # Runs on localhost:3000

# Database
docker-compose up postgres  # Or use local PostgreSQL
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build      # Output: frontend/dist/

# Backend
cd backend
npm run build      # Output: backend/dist/
```

### Committing Changes
```bash
# Build first
cd frontend && npm run build && cd ..
cd backend && npm run build && cd ..

# Commit (dist folders are force-added)
git add -f frontend/dist/ backend/dist/
git add <other changed files>
git commit -m "Description of changes"
git push origin main
```

## Backup Recommendations
```bash
# Database backup
docker exec pm_postgres pg_dump -U pm_user project_manager > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i pm_postgres psql -U pm_user -d project_manager < backup_YYYYMMDD.sql

# Full project backup
cd ~/project-manager
tar -czf project-manager-backup-$(date +%Y%m%d).tar.gz .
```

## Next Steps / Future Enhancements
- [ ] Upgrade to DHTMLX Gantt Pro for better customization
- [ ] Add color presets/palette for quick selection
- [ ] Implement task templates with predefined colors
- [ ] Add bulk color updates for multiple tasks
- [ ] Create color legend/key showing what colors mean
- [ ] Add dark mode support
- [ ] Optimize Gantt rendering for large projects

## Support & Resources
- DHTMLX Gantt Docs: https://docs.dhtmlx.com/gantt/
- PostgreSQL Docs: https://www.postgresql.org/docs/15/
- React Docs: https://react.dev/
- Express Docs: https://expressjs.com/

---

**Last Updated:** October 10, 2025
**Status:** ✅ Fully functional with custom task colors working
**VPS IP:** 107.173.91.179
**Git Commit:** 3d6e7f0

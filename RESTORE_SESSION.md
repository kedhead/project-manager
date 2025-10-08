# Session Restore Guide

## How to Resume Development

### 1. Check Current Status
Open `PROJECT_TIMELINE.md` and look at:
- **Current Status** (top of file)
- **Last checkpoint completed**
- **Next phase to work on**

### 2. Verify Existing Work
Run this command to see what files exist:
```bash
tree -L 3 -I 'node_modules'
```

Or on Windows:
```bash
dir /s /b
```

### 3. Tell Claude Where We Are
Say something like:
> "We're resuming at Phase X. Last thing completed was [describe]. Please continue."

### 4. Quick Status Command
```bash
git status
git log --oneline -5
```

---

## Phase Checklist (Quick Reference)

- [ ] Phase 1: Database Foundation
- [ ] Phase 2: Backend API Foundation
- [ ] Phase 3: Authentication System
- [ ] Phase 4: Projects API
- [ ] Phase 5: Tasks API
- [ ] Phase 6: Permissions & Roles
- [ ] Phase 7: Comments & Activity Logs
- [ ] Phase 8: File Upload System
- [ ] Phase 9: Frontend Foundation
- [ ] Phase 10: Authentication UI
- [ ] Phase 11: Projects UI
- [ ] Phase 12: Gantt Chart Implementation
- [ ] Phase 13: Task Management UI
- [ ] Phase 14: Comments UI
- [ ] Phase 15: File Upload UI
- [ ] Phase 16: Activity Log UI
- [ ] Phase 17: Permissions UI
- [ ] Phase 18: Real-time Collaboration
- [ ] Phase 19: Email Notifications
- [ ] Phase 20: Export Functionality
- [ ] Phase 21: Docker Containerization
- [ ] Phase 22: Deployment to VPS
- [ ] Phase 23: Testing & Bug Fixes
- [ ] Phase 24: Polish & Documentation

---

## Key Files to Check for Progress

### Database (Phase 1)
- `database/schema.sql`
- `database/migrations/`
- `docker-compose.yml`

### Backend (Phases 2-8)
- `backend/package.json`
- `backend/src/server.ts`
- `backend/src/routes/`
- `backend/src/controllers/`

### Frontend (Phases 9-17)
- `frontend/package.json`
- `frontend/src/App.tsx`
- `frontend/src/pages/`
- `frontend/src/components/`

### Real-time (Phase 18)
- `backend/src/sockets/`
- `frontend/src/hooks/useSocket.ts`

### Email (Phase 19)
- `backend/src/services/email.service.ts`

### Export (Phase 20)
- `backend/src/services/export.service.ts`

### Docker (Phase 21)
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `nginx/nginx.conf`

---

## Git Commit Strategy

After each phase, commit with:
```bash
git add .
git commit -m "Phase X: [Description] - CHECKPOINT"
```

Example:
```bash
git commit -m "Phase 1: Database schema and migrations - CHECKPOINT"
```

This makes it easy to see progress in git log.

---

## Testing as We Go

After major phases, test with:
```bash
# Backend tests
cd backend
npm test

# Check if backend runs
npm run dev

# Frontend tests
cd frontend
npm test

# Check if frontend runs
npm run dev
```

---

## Docker Testing

After Phase 21, test full stack:
```bash
docker-compose up --build
```

Check:
- [ ] Frontend accessible at http://localhost
- [ ] Backend API at http://localhost/api
- [ ] Database connected
- [ ] File uploads working
- [ ] WebSockets connected

---

## Deployment Checklist (Phase 22)

- [ ] Environment variables configured
- [ ] Docker installed on VPS
- [ ] Files transferred to VPS
- [ ] Docker-compose up running
- [ ] All services healthy
- [ ] Domain pointed (if applicable)
- [ ] SSL configured (if applicable)

---

## Emergency Troubleshooting

### "I don't know where we are"
1. Open PROJECT_TIMELINE.md
2. Check which phases are marked complete
3. Look at the last checkpoint notes
4. Check existing files: `ls -la backend/ frontend/ database/`

### "Something broke"
1. Check git log to see last working commit
2. Review the last checkpoint in timeline
3. Tell Claude: "We need to debug Phase X, here's the error: [paste error]"

### "I need to change something we already built"
1. Tell Claude which phase/feature needs changes
2. Reference the specific file and line if possible
3. Claude will update and note it in timeline

---

## Cost Management Tips

- **Save frequently**: After each phase, save PROJECT_TIMELINE.md updates
- **Commit to git**: Push code to GitHub/GitLab after major phases
- **Take breaks**: After completing 3-4 phases, take a break
- **Review before continuing**: Always read the last checkpoint notes

---

## Next Session Template

**Copy/paste this when resuming:**

```
Hi Claude! We're resuming the Project Manager app development.

Current Status: [Phase number]
Last completed: [What was finished]
Files created: [List key files]
What works: [What you tested successfully]

Please continue with: [Next phase name]
```

---

## Notes Section
Use this space for your own notes:

-
-
-


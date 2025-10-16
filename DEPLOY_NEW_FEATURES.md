# Deploy New Features to VPS - Step by Step

**VPS IP:** 107.173.91.179
**Date:** October 16, 2025
**Features:** Excel-like Task Addition + Auto-Cascade Dependencies

---

## 🚨 IMPORTANT: Backup First!

Before making any changes, create a backup of your database:

```bash
# SSH into your VPS
ssh root@107.173.91.179

# Navigate to project directory
cd ~/project-manager

# Create database backup
docker exec pm_postgres pg_dump -U pm_user project_manager > backup_before_new_features_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_*.sql
```

✅ **Backup created!** You can restore with this command if needed:
```bash
docker exec -i pm_postgres psql -U pm_user -d project_manager < backup_before_new_features_YYYYMMDD_HHMMSS.sql
```

---

## 📥 Step 1: Pull Latest Code from GitHub

```bash
cd ~/project-manager
git pull origin main
```

**Expected output:**
```
remote: Enumerating objects: 15, done.
remote: Counting objects: 100% (15/15), done.
...
From https://github.com/kedhead/project-manager
   0c61078..26dbfac  main       -> origin/main
Updating 0c61078..26dbfac
Fast-forward
 NEW_FEATURES_2025-10-16.md                     | 450 +++++++++++++++++++++++++
 database/migrations/004_add_auto_scheduling.sql |   9 +
 backend/src/controllers/projects.controller.ts  |   6 +-
 backend/src/services/projects.service.ts        |  17 +-
 frontend/src/api/projects.ts                    |   3 +
 frontend/src/components/GanttChart.tsx          |  94 ++++-
 frontend/src/pages/ProjectView.tsx              |   1 +
 7 files changed, 515 insertions(+), 11 deletions(-)
```

---

## 🗄️ Step 2: Apply Database Migration

```bash
# Apply the new migration
docker exec -i pm_postgres psql -U pm_user -d project_manager < database/migrations/004_add_auto_scheduling.sql
```

**Expected output:**
```
ALTER TABLE
COMMENT
CREATE INDEX
```

**Verify migration was applied:**
```bash
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "\d projects" | grep auto_scheduling
```

**Expected output:**
```
 auto_scheduling     | boolean                  |           | not null | false
```

✅ **Migration applied successfully!**

---

## 🔨 Step 3: Build Backend

```bash
cd ~/project-manager/backend
npm run build
```

**Expected output:**
```
> backend@1.0.0 build
> tsc

# Should complete without errors
```

**Verify build output:**
```bash
ls -lh dist/
```

You should see compiled JavaScript files in the `dist/` directory.

---

## 🎨 Step 4: Build Frontend

```bash
cd ~/project-manager/frontend
npm run build
```

**Expected output:**
```
vite v5.x.x building for production...
✓ xxxx modules transformed.
dist/index.html                   x.xx kB │ gzip: x.xx kB
dist/assets/index-xxxxxxxx.css   xx.xx kB │ gzip: xx.xx kB
dist/assets/index-xxxxxxxx.js   xxx.xx kB │ gzip: xx.xx kB
✓ built in xxxms
```

**Verify build output:**
```bash
ls -lh dist/
```

You should see `index.html` and an `assets/` directory.

---

## 🚀 Step 5: Deploy Backend

```bash
cd ~/project-manager

# Copy new backend files to container
docker cp backend/dist/. pm_backend:/app/dist/

# Restart backend to load new code
docker-compose restart backend

# Wait a few seconds for backend to start
sleep 5

# Check backend logs for errors
docker-compose logs backend --tail=50
```

**What to look for in logs:**
- ✅ `Server is running on port 3000`
- ✅ `Connected to PostgreSQL database`
- ❌ Any errors (red text)

**If you see errors:**
```bash
# View full logs
docker-compose logs backend --tail=200

# Check if backend is running
docker-compose ps
```

---

## 🌐 Step 6: Deploy Frontend

```bash
cd ~/project-manager

# Clear old frontend files
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"

# Copy new frontend files to container
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/

# Restart frontend
docker restart pm_frontend

# Wait for frontend to start
sleep 3

# Check frontend is running
docker ps | grep pm_frontend
```

**Expected output:**
```
pm_frontend   Up X seconds   80/tcp, 0.0.0.0:80->80/tcp
```

---

## ✅ Step 7: Verify Deployment

### 7.1 Check All Containers are Running
```bash
docker-compose ps
```

**Expected output:**
```
NAME          STATUS    PORTS
pm_backend    Up        0.0.0.0:3000->3000/tcp
pm_frontend   Up        0.0.0.0:80->80/tcp
pm_postgres   Up        5432/tcp
```

### 7.2 Check Backend Health
```bash
curl http://localhost:3000/api/health
```

**Expected output:**
```json
{"status":"success","message":"Server is running"}
```

### 7.3 Check Frontend is Accessible
```bash
curl -I http://107.173.91.179
```

**Expected output:**
```
HTTP/1.1 200 OK
Server: nginx
Content-Type: text/html
...
```

### 7.4 Test New Features (from your browser)
1. Go to `http://107.173.91.179`
2. Login to your account
3. Open any project
4. Go to Gantt Chart view
5. Look for the new toolbar at the top:
   - ✅ "➕ Add Task" button
   - ✅ "🔄 Recalculate" button
   - ✅ Status indicator (auto-scheduling enabled/disabled)
6. Press `Ctrl+Enter` - a new task should appear!

---

## 🎯 Step 8: Enable Auto-Scheduling for a Project (Optional)

By default, auto-scheduling is **disabled** for all projects. To enable it for a specific project:

```bash
# Find your project ID first
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "SELECT id, name FROM projects WHERE deleted_at IS NULL;"

# Enable auto-scheduling for a project (replace 1 with your project ID)
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "UPDATE projects SET auto_scheduling = true WHERE id = 1;"

# Verify it was enabled
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "SELECT id, name, auto_scheduling FROM projects WHERE id = 1;"
```

**Expected output:**
```
 id | name         | auto_scheduling
----+--------------+-----------------
  1 | My Project   | t
```

Now when you open that project's Gantt chart, you'll see:
- ✅ "● Auto-scheduling enabled" (green indicator)
- ✅ Recalculate button is enabled (not grayed out)
- ✅ When you change a task's dates, dependent tasks automatically shift!

---

## 🧪 Step 9: Test the New Features

### Test 1: Add Task Button
1. Open a project's Gantt chart
2. Click "➕ Add Task" button
3. ✅ A new task should appear
4. ✅ Task should be selected (highlighted)
5. ✅ You can edit the name inline

### Test 2: Keyboard Shortcut
1. Press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
2. ✅ A new task should appear immediately
3. ✅ Works from anywhere on the page

### Test 3: Auto-Cascade (if enabled)
1. Enable auto-scheduling for a project (see Step 8)
2. Create Task A: Jan 1 - Jan 5
3. Create Task B: Jan 6 - Jan 10
4. Add dependency: Task B depends on Task A (Finish-to-Start)
5. Drag Task A's end date to Jan 8
6. ✅ Task B should automatically shift to Jan 9 - Jan 13!

### Test 4: Recalculate Button
1. With auto-scheduling enabled
2. Click "🔄 Recalculate" button
3. ✅ Dependencies should recalculate
4. ✅ Toast notification: "Dependencies recalculated"

---

## 🐛 Troubleshooting

### Issue: "Add Task" button doesn't appear
**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. Clear browser cache
3. Check frontend logs: `docker logs pm_frontend --tail=50`

### Issue: Ctrl+Enter doesn't work
**Solution:**
1. Make sure you're on the Gantt Chart view
2. Check browser console for JavaScript errors (F12)
3. Verify frontend was deployed correctly

### Issue: Backend errors in logs
**Solution:**
```bash
# View full backend logs
docker-compose logs backend --tail=200

# Restart backend
docker-compose restart backend

# If still failing, check database connection
docker exec -i pm_postgres psql -U pm_user -d project_manager -c "SELECT version();"
```

### Issue: Auto-scheduling not working
**Solution:**
1. Verify project has auto_scheduling enabled:
   ```bash
   docker exec -i pm_postgres psql -U pm_user -d project_manager -c "SELECT id, name, auto_scheduling FROM projects;"
   ```
2. Check that tasks have proper dependencies
3. Try clicking "🔄 Recalculate" button manually

### Issue: Frontend shows old version
**Solution:**
```bash
# Re-deploy frontend
cd ~/project-manager
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
docker restart pm_frontend

# Hard refresh browser
# Ctrl+Shift+R or Cmd+Shift+R
```

---

## 🔄 Rollback Instructions (If Needed)

If something goes wrong, you can rollback:

### Rollback Database:
```bash
# Restore from backup
docker exec -i pm_postgres psql -U pm_user -d project_manager < backup_before_new_features_YYYYMMDD_HHMMSS.sql
```

### Rollback Code:
```bash
cd ~/project-manager
git reset --hard 0c61078  # Previous commit
docker-compose restart backend
docker exec pm_frontend sh -c "rm -rf /usr/share/nginx/html/*"
docker cp frontend/dist/. pm_frontend:/usr/share/nginx/html/
docker restart pm_frontend
```

---

## 📊 Deployment Checklist

Use this checklist to track your progress:

- [ ] Step 1: Backup database ✅
- [ ] Step 2: Pull latest code from GitHub
- [ ] Step 3: Apply database migration
- [ ] Step 4: Verify migration applied
- [ ] Step 5: Build backend
- [ ] Step 6: Build frontend
- [ ] Step 7: Deploy backend to container
- [ ] Step 8: Restart backend
- [ ] Step 9: Check backend logs
- [ ] Step 10: Deploy frontend to container
- [ ] Step 11: Restart frontend
- [ ] Step 12: Verify all containers running
- [ ] Step 13: Test backend health endpoint
- [ ] Step 14: Test frontend in browser
- [ ] Step 15: Verify "Add Task" button appears
- [ ] Step 16: Test Ctrl+Enter keyboard shortcut
- [ ] Step 17: (Optional) Enable auto-scheduling for a project
- [ ] Step 18: (Optional) Test auto-cascade feature

---

## 🎉 Success!

If all steps completed successfully, you should now have:

✅ "Add Task" button in Gantt toolbar
✅ Ctrl+Enter keyboard shortcut working
✅ Auto-scheduling toggle stored in database
✅ Recalculate button in toolbar
✅ Automatic dependency cascading (when enabled)

**Your Project Manager is now more powerful and easier to use!**

---

## 📝 Notes

- Auto-scheduling defaults to **disabled** for existing projects
- You must manually enable it per project (via database for now)
- Future update will add UI toggle for this setting
- All changes are backward compatible - no data loss

---

## 🆘 Need Help?

If you encounter issues:

1. **Check logs:**
   ```bash
   docker-compose logs backend --tail=100
   docker logs pm_frontend --tail=100
   docker-compose logs postgres --tail=100
   ```

2. **Check container status:**
   ```bash
   docker-compose ps
   docker stats --no-stream
   ```

3. **Verify database:**
   ```bash
   docker exec -i pm_postgres psql -U pm_user -d project_manager -c "\d projects"
   ```

4. **Full restart:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

**Deployment Guide Created:** October 16, 2025
**Target VPS:** 107.173.91.179
**Estimated Time:** 10-15 minutes

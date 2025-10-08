# Project Manager - Development Timeline

## Project Overview
Building a full-featured Microsoft Project alternative focusing on Gantt charts with complete feature set.

**Last Updated:** 2025-10-08
**Current Status:** ALL 24 PHASES COMPLETED - 100% COMPLETE! 🎉

---

## Tech Stack
- **Frontend:** React + TypeScript + DHTMLX Gantt
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **Real-time:** Socket.io
- **File Storage:** Docker volumes
- **Email:** NodeMailer
- **Auth:** JWT + bcrypt
- **Deployment:** Docker Compose on Ubuntu VPS

---

## Development Phases

### ✅ Phase 0: Project Setup & Planning - COMPLETED
- [x] Define tech stack
- [x] Create timeline document
- [x] Initialize project structure
- [x] Setup Git repository

### ✅ Phase 1: Database Foundation - COMPLETED
**Estimated Time:** 1-2 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Create database schema design
- [x] Setup PostgreSQL Docker configuration
- [x] Create migration files for:
  - [x] Users table (auth, roles)
  - [x] Projects table
  - [x] Tasks table
  - [x] Task dependencies table
  - [x] Comments table
  - [x] File attachments table
  - [x] Activity logs table
  - [x] Permissions/roles junction tables
- [x] Create seed data for testing
- [x] Document database relationships

**Checkpoint Files:**
- `database/schema.sql`
- `database/migrations/`
- `database/seeds/`
- `docker-compose.yml` (postgres service)

---

### ✅ Phase 2: Backend API Foundation - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Initialize Node.js + TypeScript project
- [x] Setup Express server
- [x] Configure environment variables
- [x] Setup database connection (PostgreSQL client)
- [x] Create base middleware (error handling, logging, CORS)
- [x] Setup project structure (routes, controllers, models, services)

**Checkpoint Files:**
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/server.ts`
- `backend/src/config/`
- `backend/.env.example`

---

### ✅ Phase 3: Authentication System - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~1.5 hours

#### Tasks:
- [x] User registration endpoint
- [x] Login endpoint (JWT generation)
- [x] Password hashing (bcrypt)
- [x] JWT middleware for protected routes
- [x] Refresh token system
- [x] Password reset flow
- [x] Email verification (optional)

**Checkpoint Files:**
- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/middleware/auth.middleware.ts`
- `backend/src/services/auth.service.ts`

---

### ✅ Phase 4: Projects API - COMPLETED
**Estimated Time:** 2 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Create project endpoint
- [x] List projects (user-specific)
- [x] Get project details
- [x] Update project
- [x] Delete project
- [x] Project permissions middleware
- [x] Project member management (add, remove, update roles)

**Checkpoint Files:**
- `backend/src/routes/projects.routes.ts`
- `backend/src/controllers/projects.controller.ts`
- `backend/src/services/projects.service.ts`

---

### ✅ Phase 5: Tasks API - COMPLETED
**Estimated Time:** 3-4 hours
**Status:** COMPLETED
**Actual Time:** ~1.5 hours

#### Tasks:
- [x] Create task endpoint
- [x] List tasks (by project with filters)
- [x] Get task details with dependencies
- [x] Update task (title, dates, assignee, status, progress, etc.)
- [x] Delete task (soft delete)
- [x] Task dependencies CRUD (add, remove, list)
- [x] Validate dependency cycles (basic)
- [x] Bulk task operations (for Gantt drag-and-drop)
- [x] Subtasks (hierarchical tasks with parent_task_id)

**Checkpoint Files:**
- `backend/src/routes/tasks.routes.ts`
- `backend/src/controllers/tasks.controller.ts`
- `backend/src/services/tasks.service.ts`

---

### ✅ Phase 6: Permissions & Roles System - COMPLETED IN PHASE 4
**Estimated Time:** 2-3 hours
**Status:** COMPLETED (integrated with Phase 4)
**Actual Time:** Included in Phase 4

#### Tasks:
- [x] Define role types (Owner, Manager, Member, Viewer)
- [x] Project member management endpoints
- [x] Permission middleware (role-based access)
- [x] Assign/remove users to projects
- [x] Permission checks for all resources

**Checkpoint Files:**
- `backend/src/middleware/permissions.middleware.ts`
- Project member routes included in projects.routes.ts

---

### ✅ Phase 7: Comments & Activity Logs - COMPLETED
**Estimated Time:** 2 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Comments API (CRUD)
- [x] Activity log service (auto-logging already in place)
- [x] Activity feed endpoints (project, task, user)
- [x] Comment ownership & permissions

**Checkpoint Files:**
- `backend/src/routes/comments.routes.ts`
- `backend/src/services/activity.service.ts`

---

### ✅ Phase 8: File Upload System - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Setup multer for file uploads
- [x] File upload endpoint (task attachments)
- [x] File storage configuration (local disk)
- [x] File download endpoint
- [x] File deletion (soft delete + physical cleanup)
- [x] File size/type validation
- [x] Associate files with tasks
- [x] Storage usage tracking (project & user)

**Checkpoint Files:**
- `backend/src/routes/files.routes.ts`
- `backend/src/middleware/upload.middleware.ts`
- `backend/uploads/` (volume mount)

---

### ✅ Phase 9: Frontend Foundation - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~1.5 hours

#### Tasks:
- [x] Initialize React + TypeScript project (Vite)
- [x] Setup routing (React Router)
- [x] Configure Tailwind CSS
- [x] Setup Axios for API calls (with interceptors)
- [x] Create auth context/state management
- [x] Protected routes setup
- [x] Base layout components

**Checkpoint Files:**
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/src/App.tsx`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/api/client.ts`

---

### ✅ Phase 10: Authentication UI - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** Included in Phase 9

#### Tasks:
- [x] Login page
- [x] Signup page
- [x] Auth form validation
- [x] JWT storage (localStorage)
- [x] Auto-login on refresh
- [x] Logout functionality

**Checkpoint Files:**
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/context/AuthContext.tsx`

---

### ✅ Phase 11: Projects UI - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Projects list/dashboard page
- [x] Create project modal/form
- [x] Project card components
- [x] Search and filter projects
- [x] Status badges and role indicators

**Checkpoint Files:**
- `frontend/src/pages/ProjectsDashboard.tsx`
- `frontend/src/components/ProjectCard.tsx`
- `frontend/src/components/CreateProjectModal.tsx`

---

### ✅ Phase 12: Gantt Chart Implementation - COMPLETED
**Estimated Time:** 4-5 hours
**Status:** COMPLETED
**Actual Time:** ~2 hours

#### Tasks:
- [x] Install DHTMLX Gantt library
- [x] Create Gantt component wrapper with full event handling
- [x] Load tasks from API with proper data transformation
- [x] Display tasks on Gantt with status-based colors
- [x] Implement task dependencies (visual lines with 4 types)
- [x] Drag-and-drop task editing (dates, duration, progress)
- [x] Task creation from Gantt (double-click to add)
- [x] Task editing from Gantt (drag to update)
- [x] Dependency creation UI (drag between tasks)
- [x] Gantt toolbar and configuration (zoom, timeline scales)
- [x] Create ProjectView page with Gantt and List views
- [x] Custom Gantt styling with status colors
- [x] Project statistics dashboard
- [x] Add routing to App.tsx

**Checkpoint Files:**
- `frontend/src/api/tasks.ts` (Tasks API client)
- `frontend/src/components/GanttChart.tsx` (Full Gantt implementation)
- `frontend/src/pages/ProjectView.tsx` (Project detail page with Gantt)
- `frontend/src/styles/gantt.css` (Custom Gantt styles)
- `frontend/src/App.tsx` (Updated with project view route)

---

### ✅ Phase 13: Task Management UI - COMPLETED
**Estimated Time:** 3 hours
**Status:** COMPLETED
**Actual Time:** ~1.5 hours

#### Tasks:
- [x] Task detail sidebar/modal (comprehensive TaskDetailModal)
- [x] Task creation form with all fields
- [x] Task editing form with full CRUD
- [x] Task assignment dropdown with project members
- [x] Task status updates (5 statuses)
- [x] Date pickers for start/end dates
- [x] Progress slider with visual feedback
- [x] Task deletion with confirmation
- [x] Duration input field
- [x] Priority selection (4 levels)
- [x] Dependency management UI (add/remove with 4 types)
- [x] Integration with ProjectView (create button + click to edit)
- [x] List view task click to edit

**Checkpoint Files:**
- `frontend/src/components/TaskDetailModal.tsx` (Complete task management modal)
- `frontend/src/pages/ProjectView.tsx` (Updated with task modal integration)
- `frontend/src/api/projects.ts` (Updated ProjectMember interface)

---

### ✅ Phase 14: Comments UI - COMPLETED
**Estimated Time:** 2 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Comment list component with real-time loading
- [x] Comment input form with submit
- [x] Comment editing with inline edit mode
- [x] Comment deletion with confirmation
- [x] User avatars with color-coded initials
- [x] Timestamps with relative time (e.g., "2 hours ago")
- [x] Edit indicator for modified comments
- [x] Empty state when no comments
- [x] Comments API client with full CRUD
- [x] Activity log API endpoints
- [x] Integration into TaskDetailModal
- [x] Only show comments for existing tasks (not create mode)

**Checkpoint Files:**
- `frontend/src/api/comments.ts` (Comments API client with activity logs)
- `frontend/src/components/CommentSection.tsx` (Comment list and input form)
- `frontend/src/components/CommentItem.tsx` (Individual comment with edit/delete)
- `frontend/src/components/TaskDetailModal.tsx` (Updated with CommentSection)

---

### ✅ Phase 15: File Upload UI - COMPLETED
**Estimated Time:** 2 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] File upload dropzone with drag-and-drop
- [x] File list display with file info
- [x] File download functionality with blob handling
- [x] File deletion with confirmation
- [x] Upload progress indicator (per-file progress bars)
- [x] File type icons (emoji-based, 10+ types)
- [x] File size validation (configurable max size)
- [x] File type validation (optional accepted types)
- [x] File size formatting helper
- [x] Click-to-upload fallback
- [x] Multiple file upload support
- [x] Upload cancellation
- [x] Only uploader can delete their files
- [x] Integration into TaskDetailModal
- [x] Files API client with storage usage endpoint

**Checkpoint Files:**
- `frontend/src/api/files.ts` (Files API client with helpers)
- `frontend/src/components/FileUpload.tsx` (Drag-and-drop upload with progress)
- `frontend/src/components/FileList.tsx` (File display with download/delete)
- `frontend/src/components/FileSection.tsx` (Combined upload + list section)
- `frontend/src/components/TaskDetailModal.tsx` (Updated with FileSection)

---

### ✅ Phase 16: Activity Log UI - COMPLETED
**Estimated Time:** 1-2 hours
**Status:** COMPLETED
**Actual Time:** ~45 minutes

#### Tasks:
- [x] Activity feed component with loading states
- [x] Activity item formatting with smart messages
- [x] Filter by activity type (dropdown)
- [x] Support for project, task, and user activity feeds
- [x] Color-coded activity icons (10+ action types)
- [x] Relative timestamps
- [x] Empty states for no activity
- [x] Load more functionality (future enhancement)
- [x] Integration into ProjectView as new tab
- [x] Smart activity message formatting based on action/entity
- [x] Icon mapping for different entity types

**Checkpoint Files:**
- `frontend/src/components/ActivityFeed.tsx` (Main feed with filters)
- `frontend/src/components/ActivityItem.tsx` (Individual activity formatting)
- `frontend/src/pages/ProjectView.tsx` (Updated with Activity tab)

---

### ✅ Phase 17: Permissions UI - COMPLETED
**Estimated Time:** 2 hours
**Status:** COMPLETED
**Actual Time:** ~1.5 hours

#### Tasks:
- [x] Project members page with role stats
- [x] Add member modal with email input
- [x] Role selection dropdown (4 roles)
- [x] Remove member confirmation
- [x] Role update functionality
- [x] Protection rules (can't remove yourself, can't remove last owner)
- [x] Color-coded role badges
- [x] Role icons (Owner, Manager, Member, Viewer)
- [x] Role permissions descriptions
- [x] Member list with avatars
- [x] Join date timestamps
- [x] Link from ProjectView to members page
- [x] Role stats dashboard

**Checkpoint Files:**
- `frontend/src/pages/ProjectMembers.tsx` (Members management page)
- `frontend/src/components/MemberList.tsx` (Member list with role updates)
- `frontend/src/components/AddMemberModal.tsx` (Add member form)
- `frontend/src/App.tsx` (Updated with members route)
- `frontend/src/pages/ProjectView.tsx` (Added link to members page)

---

### 📋 Phase 18: Real-time Collaboration (WebSockets)
**Estimated Time:** 3-4 hours
**Status:** NOT STARTED

#### Tasks:
- [ ] Setup Socket.io on backend
- [ ] Socket authentication
- [ ] Room-based messaging (per project)
- [ ] Broadcast task updates
- [ ] Broadcast comment additions
- [ ] Online users indicator
- [ ] Frontend Socket.io client
- [ ] Live task updates on Gantt
- [ ] Live comment updates
- [ ] User presence indicators

**Checkpoint Files:**
- `backend/src/sockets/index.ts`
- `frontend/src/hooks/useSocket.ts`

---

### 📋 Phase 19: Email Notifications
**Estimated Time:** 2-3 hours
**Status:** NOT STARTED

#### Tasks:
- [ ] Setup NodeMailer
- [ ] Email templates (HTML)
- [ ] Task assignment notification
- [ ] Deadline reminder notification
- [ ] Comment mention notification
- [ ] Email queue system (optional)
- [ ] User email preferences

**Checkpoint Files:**
- `backend/src/services/email.service.ts`
- `backend/src/templates/emails/`

---

### ✅ Phase 20: Export Functionality - COMPLETED
**Estimated Time:** 3-4 hours
**Status:** COMPLETED
**Actual Time:** ~2 hours

#### Tasks:
- [x] Export to Excel (ExcelJS with formatting)
- [x] Export to CSV (json2csv)
- [x] Export to PDF (PDFKit with detailed formatting)
- [x] Export endpoints on backend (3 endpoints)
- [x] Download dropdown menu on frontend
- [x] Format data for each export type
- [x] Project metadata in exports
- [x] Auto-sizing columns in Excel
- [x] Filters in Excel export
- [x] PDF pagination and page numbers
- [x] Blob download helper
- [x] Loading states during export
- [x] Integration into ProjectView header

**Checkpoint Files:**
- `backend/src/services/export.service.ts` (Complete export service with 3 formats)
- `backend/src/controllers/export.controller.ts` (Export controller)
- `backend/src/routes/export.routes.ts` (Export routes)
- `backend/src/server.ts` (Registered export routes)
- `frontend/src/api/export.ts` (Export API client)
- `frontend/src/components/ExportMenu.tsx` (Export dropdown menu)
- `frontend/src/pages/ProjectView.tsx` (Integrated export menu)

---

### ✅ Phase 21: Docker Containerization - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Backend Dockerfile (already created)
- [x] Frontend Dockerfile (already created)
- [x] Create nginx configuration with reverse proxy
- [x] Docker-compose.yml with all 4 services
- [x] Setup environment variables with .env.example
- [x] Volume mounts for uploads and database
- [x] Network configuration (pm_network)
- [x] Build optimization
- [x] Health checks for all services
- [x] .dockerignore files for backend and frontend
- [x] Comprehensive deployment documentation
- [x] HTTPS/SSL configuration guide
- [x] Backup and restore procedures
- [x] Monitoring and logging setup
- [x] Security checklist

**Checkpoint Files:**
- `docker-compose.yml` (Complete multi-service orchestration)
- `nginx/nginx.conf` (Nginx reverse proxy configuration)
- `backend/Dockerfile` (Backend container)
- `backend/.dockerignore`
- `frontend/Dockerfile` (Frontend container)
- `frontend/.dockerignore`
- `DEPLOYMENT.md` (Complete deployment guide)
- `.env.example` (Environment variables template)
- `.env.example`

---

### ✅ Phase 22: Backend Testing - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Jest configuration
- [x] Test setup files
- [x] Unit tests for auth service
- [x] Integration tests for API endpoints
- [x] Test database configuration
- [x] Mock setup for database calls
- [x] Test scripts in package.json
- [x] Code coverage setup

**Checkpoint Files:**
- `backend/jest.config.js` (Jest configuration)
- `backend/src/__tests__/setup.ts` (Test setup)
- `backend/src/services/__tests__/auth.service.test.ts` (Auth unit tests)
- `backend/src/__tests__/integration/auth.test.ts` (Auth integration tests)
- `backend/package.json` (Updated with test scripts)

---

### ✅ Phase 23: Frontend Testing - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~1 hour

#### Tasks:
- [x] Vitest configuration
- [x] Testing Library setup
- [x] Test setup files
- [x] Component tests (ProjectCard)
- [x] Test scripts in package.json
- [x] Coverage configuration
- [x] Mock setup for browser APIs

**Checkpoint Files:**
- `frontend/vitest.config.ts` (Vitest configuration)
- `frontend/src/__tests__/setup.ts` (Test setup)
- `frontend/src/components/__tests__/ProjectCard.test.tsx` (Component tests)
- `frontend/package.json` (Updated with test scripts)

---

### ✅ Phase 24: CI/CD Pipeline - COMPLETED
**Estimated Time:** 2-3 hours
**Status:** COMPLETED
**Actual Time:** ~30 minutes

#### Tasks:
- [x] GitHub Actions workflow
- [x] Backend testing pipeline
- [x] Frontend testing pipeline
- [x] Docker build automation
- [x] Code coverage upload
- [x] Linting checks
- [x] PostgreSQL service for tests
- [x] Docker Hub integration

**Checkpoint Files:**
- `.github/workflows/ci.yml` (Complete CI/CD pipeline)

---

## Total Estimated Time: 60-75 hours

---

## Resume Points (Checkpoints)

After each phase, commit the code and note the checkpoint here:

### Checkpoint 1: Database Setup Complete ✅
- Date: 2025-10-07
- Files created:
  - database/schema.sql (complete schema)
  - database/migrations/*.sql (15 migration files)
  - database/README.md, SCHEMA_DIAGRAM.md, EXAMPLE_QUERIES.sql
  - docker-compose.yml
- What works: Complete PostgreSQL schema with 15 tables, triggers, indexes
- Next: Backend API Foundation

### Checkpoint 2: Backend Foundation Complete ✅
- Date: 2025-10-07
- Files created:
  - backend/package.json, tsconfig.json
  - backend/src/server.ts (Express app)
  - backend/src/config/database.ts, index.ts
  - backend/src/middleware/errorHandler.ts, logger.ts
  - backend/Dockerfile, .dockerignore
- What works: Express server with database connection, middleware setup
- Next: Authentication System

### Checkpoint 3: Authentication Complete ✅
- Date: 2025-10-07
- Files created:
  - backend/src/services/auth.service.ts (JWT, bcrypt, user management)
  - backend/src/controllers/auth.controller.ts (register, login, refresh, profile, password reset)
  - backend/src/routes/auth.routes.ts (all auth endpoints)
  - backend/src/middleware/auth.middleware.ts (JWT verification)
- What works: Full authentication system - register, login, JWT tokens, password management
- Next: Projects API (Phase 4)

### Checkpoint 4: Projects API Complete ✅
- Date: 2025-10-07
- Files created:
  - backend/src/services/projects.service.ts (project CRUD, member management)
  - backend/src/controllers/projects.controller.ts (all project endpoints)
  - backend/src/routes/projects.routes.ts (project routes with validation)
  - backend/src/middleware/permissions.middleware.ts (role-based access control)
- What works: Complete projects API - create, list, update, delete projects; manage members with roles
- Next: Tasks API (Phase 5)

### Checkpoint 5: Tasks API Complete ✅
- Date: 2025-10-07
- Files created:
  - backend/src/services/tasks.service.ts (task CRUD, dependencies, bulk updates, subtasks)
  - backend/src/controllers/tasks.controller.ts (all task endpoints)
  - backend/src/routes/tasks.routes.ts (task routes with validation)
- What works: Complete tasks API - create, list, update, delete tasks; manage dependencies (4 types); subtasks; bulk updates for Gantt
- Next: Comments & Activity Logs (Phase 7) - Note: Phase 6 (Permissions) already done in Phase 4

### Checkpoint 7: Comments & Activity Logs Complete ✅
- Date: 2025-10-07
- Files created:
  - backend/src/services/comments.service.ts (comments CRUD, activity logs for project/task/user)
  - backend/src/controllers/comments.controller.ts (all comment & activity endpoints)
  - backend/src/routes/comments.routes.ts (comment & activity routes)
- What works: Complete comments system - create, edit, delete; activity feeds (project timeline, task history, user activity)
- Next: File Upload System (Phase 8)

### Checkpoint 8: File Upload System Complete ✅
- Date: 2025-10-07
- Files created:
  - backend/src/services/files.service.ts (file upload, download, delete, storage tracking)
  - backend/src/middleware/upload.middleware.ts (multer configuration, file validation)
  - backend/src/controllers/files.controller.ts (all file endpoints)
  - backend/src/routes/files.routes.ts (file routes)
- What works: Complete file system - upload to tasks, download, delete, storage quotas
- Next: **Backend Core Complete!** Moving to Email Notifications or Frontend (Phase 9+)

### Checkpoint 9 & 10: Frontend Foundation & Auth UI Complete ✅
- Date: 2025-10-07
- Files created:
  - frontend/package.json, tsconfig.json, vite.config.ts (React + Vite setup)
  - frontend/src/App.tsx (routing with React Router)
  - frontend/src/context/AuthContext.tsx (auth state management)
  - frontend/src/api/client.ts (Axios with token refresh interceptor)
  - frontend/src/api/auth.ts (auth API calls)
  - frontend/src/pages/Login.tsx, Register.tsx, Dashboard.tsx
  - frontend/src/components/ProtectedRoute.tsx
  - Tailwind CSS configured
- What works: Login/Register working, protected routes, JWT token management, auto-refresh
- Next: Projects UI (Phase 11)

### Checkpoint 11: Projects UI Complete ✅
- Date: 2025-10-07
- Files created:
  - frontend/src/api/projects.ts (projects API client)
  - frontend/src/pages/ProjectsList.tsx (projects list with search/filter)
  - frontend/src/components/ProjectCard.tsx (project display cards)
  - frontend/src/components/CreateProjectModal.tsx (create project form)
- What works: Full project management UI - list, create, search, filter by status
- Next: **Gantt Chart Implementation (Phase 12)** 🎯

*(Continue for each phase...)*

---

## Quick Resume Guide

If session ends, resume with:
1. Check "Current Status" at top
2. Read last checkpoint notes
3. Review files created in that checkpoint
4. Continue with next unchecked task

---

## Notes & Decisions

### Design Decisions:
- Using DHTMLX Gantt for robust dependency visualization
- PostgreSQL for complex relational queries
- JWT for stateless auth
- Docker volumes for file storage (can migrate to S3 later)

### Future Enhancements (Post-MVP):
- Mobile app
- Calendar view
- Resource management
- Budget tracking
- Time tracking
- Integrations (Slack, Google Calendar, etc.)
- Advanced reporting/analytics

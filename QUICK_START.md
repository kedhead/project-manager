# Quick Start Guide

## For First Time Setup

### 1. Install Dependencies

```bash
cd K:\AI-Projects\Project-Manager\backend
npm install
```

### 2. Setup Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values (use a text editor)
# Minimum required:
# - DB_PASSWORD
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - JWT_REFRESH_SECRET (generate another)
```

### 3. Start Database

```bash
# Make sure Docker is running, then:
docker-compose up postgres -d

# Check it's running:
docker-compose ps
```

### 4. Initialize Database

```bash
# Option 1: Using psql
psql -U pm_user -h localhost -d project_manager -f database/schema.sql

# Option 2: Using Docker exec
docker exec -i pm_postgres psql -U pm_user -d project_manager < database/schema.sql
```

### 5. Start Backend

```bash
cd backend
npm run dev
```

### 6. Test It

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## For Resuming Development

### Quick Check Status

```bash
# Check what's running
docker-compose ps

# Check backend is ready
cd backend && npm run dev

# View logs
docker-compose logs -f postgres
```

### Resume Work

1. Open `SESSION_SUMMARY.md` - See what's been completed
2. Open `PROJECT_TIMELINE.md` - Find current phase
3. Continue from current phase in timeline

---

## Common Commands

### Database

```bash
# Start database only
docker-compose up postgres -d

# Stop database
docker-compose stop postgres

# Database logs
docker-compose logs postgres

# Connect to database
docker exec -it pm_postgres psql -U pm_user -d project_manager

# Reset database (CAUTION: Deletes all data)
docker-compose down -v
docker-compose up postgres -d
# Then re-run schema.sql
```

### Backend

```bash
cd backend

# Development mode (auto-reload)
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start

# Run tests (when implemented)
npm test

# Lint code
npm run lint
```

### Docker (Full Stack - Later)

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Rebuild containers
docker-compose up --build

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

---

## Testing Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","firstName":"John","lastName":"Doe"}'

# Login (save the accessToken from response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get profile (use your accessToken)
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Using Postman/Insomnia

1. Import this base URL: `http://localhost:3000`
2. Create requests for each endpoint
3. For protected routes, add header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`

---

## Troubleshooting

### Database connection fails

```bash
# Check if postgres is running
docker-compose ps

# Check logs for errors
docker-compose logs postgres

# Verify .env has correct DB credentials
cat backend/.env

# Test connection manually
docker exec -it pm_postgres psql -U pm_user -d project_manager -c "SELECT NOW();"
```

### Backend won't start

```bash
# Check for errors in console
cd backend
npm run dev

# Common issues:
# - Missing .env file? Copy from .env.example
# - Database not running? docker-compose up postgres -d
# - Port 3000 in use? Change PORT in .env
# - Missing dependencies? npm install
```

### Port conflicts

```bash
# Check what's using port 3000
# Windows:
netstat -ano | findstr :3000

# Change port in backend/.env:
PORT=3001
```

---

## File Locations

### Important Files:
- **SESSION_SUMMARY.md** - What's been built so far
- **PROJECT_TIMELINE.md** - Full development roadmap
- **RESTORE_SESSION.md** - How to resume after break
- **database/README.md** - Database documentation
- **backend/.env.example** - Environment variables template

### Code Structure:
- `database/` - Schema, migrations, docs
- `backend/src/` - All source code
  - `config/` - Environment & database setup
  - `controllers/` - Request handlers
  - `middleware/` - Auth, errors, logging
  - `routes/` - API endpoints
  - `services/` - Business logic
  - `server.ts` - Main app

---

## Development Workflow

### Making Changes:

1. **Read current phase** in PROJECT_TIMELINE.md
2. **Create new files** in appropriate directories
3. **Update server.ts** if adding new routes
4. **Test locally** with curl or Postman
5. **Update timeline** when phase is complete
6. **Commit to git** (optional but recommended)

### Adding New API Endpoints:

1. Create service in `backend/src/services/`
2. Create controller in `backend/src/controllers/`
3. Create routes in `backend/src/routes/`
4. Import and use in `backend/src/server.ts`
5. Test endpoints

---

## Current Status (As of 2025-10-07)

✅ **Completed:**
- Database schema (Phase 1)
- Backend foundation (Phase 2)
- Authentication system (Phase 3)

🚧 **Next Up:**
- Projects API (Phase 4)

📋 **Total Progress:** 3/24 phases (12.5%)

---

## Getting Help

1. Check **SESSION_SUMMARY.md** for detailed progress
2. Check **PROJECT_TIMELINE.md** for phase details
3. Check **RESTORE_SESSION.md** for resume instructions
4. Check **database/README.md** for database help
5. Check error logs: `docker-compose logs` or backend console

---

## Before Stopping Work

### Checklist:
- [ ] Update SESSION_SUMMARY.md with progress
- [ ] Update PROJECT_TIMELINE.md phase status
- [ ] Commit code to git (optional)
- [ ] Note what phase you're on
- [ ] Stop services: `docker-compose down`

### Quick Stop:
```bash
# Stop everything
docker-compose down

# Or just stop backend and leave database running
# (Ctrl+C in backend terminal)
```

---

**Ready to build! Phases 0-3 are complete. Continue with Phase 4: Projects API.**

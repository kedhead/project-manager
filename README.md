# Project Manager - Full-Featured Gantt Chart Application

A complete project management solution similar to Microsoft Project, featuring interactive Gantt charts, real-time collaboration, and comprehensive project tracking.

## Features

✅ **User Authentication** - Secure login/signup with JWT
✅ **Multi-Project Support** - Manage unlimited projects
✅ **Interactive Gantt Charts** - Visual timeline with drag-and-drop
✅ **Task Dependencies** - Four dependency types (FS, SS, FF, SF)
✅ **File Attachments** - Upload documents to tasks
✅ **Comments & Activity Logs** - Track all changes and discussions
✅ **Email Notifications** - Task assignments and deadline reminders
✅ **Role-Based Permissions** - Owners, Managers, Members, Viewers
✅ **Real-Time Collaboration** - See changes live via WebSockets
✅ **Advanced Exports** - Excel, CSV, PDF generation

## Tech Stack

- **Frontend:** React + TypeScript + DHTMLX Gantt + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 15
- **Real-time:** Socket.io
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Node.js 18+ (for local development)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd Project-Manager
```

2. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start with Docker:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Frontend: http://localhost
- Backend API: http://localhost/api
- Direct Frontend (dev): http://localhost:5173
- Direct Backend (dev): http://localhost:3000

### Development Mode

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Database:**
```bash
# Initialize database manually
createdb project_manager
psql -U postgres -d project_manager -f database/schema.sql
```

## Project Structure

```
Project-Manager/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation, etc.
│   │   ├── models/       # Database models
│   │   ├── sockets/      # WebSocket handlers
│   │   └── server.ts     # Entry point
│   ├── uploads/          # File storage
│   ├── Dockerfile
│   └── package.json
│
├── frontend/             # React + TypeScript
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom hooks
│   │   ├── context/      # State management
│   │   ├── api/          # API client
│   │   └── App.tsx       # Main app
│   ├── Dockerfile
│   └── package.json
│
├── database/             # PostgreSQL schema
│   ├── schema.sql        # Complete schema
│   ├── migrations/       # Individual migrations
│   ├── README.md         # Database documentation
│   └── EXAMPLE_QUERIES.sql
│
├── nginx/                # Reverse proxy config
│   └── nginx.conf
│
├── docker-compose.yml    # Container orchestration
├── .env.example          # Environment template
├── PROJECT_TIMELINE.md   # Development roadmap
└── RESTORE_SESSION.md    # Resume guide

```

## Database Schema

The application uses PostgreSQL with 15 tables:

- **users** - Authentication and profiles
- **projects** - Project metadata
- **project_members** - Role-based access control
- **tasks** - Task details with scheduling
- **task_dependencies** - Gantt chart dependencies
- **comments** - Task discussions
- **file_attachments** - Document uploads
- **activity_logs** - Audit trail
- **notifications** - In-app and email alerts
- **sessions** - Real-time collaboration
- **task_watchers** - Task subscriptions
- **tags** - Categorization

See `database/README.md` for detailed schema documentation.

## API Documentation

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/projects/:id/tasks` - List project tasks
- `POST /api/projects/:id/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/dependencies` - Add dependency

### (More endpoints to be documented as built)

## Deployment

### To Ubuntu VPS

1. **Transfer files to VPS:**
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@your-vps-ip:/opt/project-manager/
```

2. **SSH into VPS:**
```bash
ssh user@your-vps-ip
cd /opt/project-manager
```

3. **Setup environment:**
```bash
cp .env.example .env
nano .env  # Edit with production values
```

4. **Start containers:**
```bash
docker-compose up -d
```

5. **Check status:**
```bash
docker-compose ps
docker-compose logs -f
```

### SSL/HTTPS (Optional)

Use Let's Encrypt with Certbot:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
# Update nginx config with SSL certificates
```

## Configuration

### Email Notifications

Update `.env` with SMTP settings:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

For Gmail, enable 2FA and create an App Password.

### File Storage

Files are stored in Docker volumes by default. For cloud storage (S3, Azure):
1. Update `backend/src/config/storage.ts`
2. Add cloud credentials to `.env`

## Development Timeline

See `PROJECT_TIMELINE.md` for the complete development roadmap (24 phases, ~60-75 hours).

Current progress tracked in the timeline document.

## Resuming Development

If development is interrupted, see `RESTORE_SESSION.md` for instructions on resuming from the last checkpoint.

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration
```

## Troubleshooting

### Database connection issues
```bash
docker-compose logs postgres
docker-compose restart postgres
```

### Backend not starting
```bash
docker-compose logs backend
# Check .env configuration
```

### Port conflicts
```bash
# Change ports in docker-compose.yml
ports:
  - "8080:80"  # Use 8080 instead of 80
```

## Contributing

This is a private project. For bugs or feature requests, contact the development team.

## License

Proprietary - All rights reserved

## Support

For issues or questions, refer to:
- `PROJECT_TIMELINE.md` for development status
- `database/README.md` for database documentation
- `RESTORE_SESSION.md` for resume instructions

---

**Built with ❤️ using modern web technologies**

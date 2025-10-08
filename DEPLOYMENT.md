# Deployment Guide - Project Manager

Complete guide for deploying the Project Manager application to production.

## Prerequisites

- Ubuntu VPS (20.04 or later)
- Docker and Docker Compose installed
- Domain name (optional, for HTTPS)
- At least 2GB RAM, 20GB disk space

## Quick Start with Docker Compose

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Project-Manager
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
# Database
DB_PASSWORD=your_strong_database_password_here

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_very_long_random_secret_key_here
JWT_REFRESH_SECRET=your_very_long_refresh_secret_key_here

# Email (optional, for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Project Manager <noreply@yourcompany.com>"

# Application URL
APP_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
```

### 3. Build and Start Services

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- Application: http://localhost (or your domain)
- API: http://localhost/api
- Health Check: http://localhost/health

## Services Overview

The application consists of 4 services:

1. **PostgreSQL Database** (port 5432)
   - Stores all application data
   - Auto-initializes with schema on first run
   - Persistent data via Docker volume

2. **Backend API** (port 3000)
   - Node.js + Express + TypeScript
   - RESTful API endpoints
   - File uploads handling
   - Authentication & permissions

3. **Frontend** (port 5173)
   - React + TypeScript + Vite
   - Gantt chart interface
   - Real-time updates

4. **Nginx** (ports 80/443)
   - Reverse proxy
   - Load balancing
   - Static file serving
   - HTTPS termination

## Production Configuration

### Enable HTTPS

1. **Install Certbot** (for Let's Encrypt SSL)

```bash
sudo apt update
sudo apt install certbot
```

2. **Get SSL Certificate**

```bash
sudo certbot certonly --standalone -d your-domain.com
```

3. **Update nginx.conf**

Uncomment the HTTPS server block in `nginx/nginx.conf` and update:
- `server_name` with your domain
- SSL certificate paths

4. **Copy certificates to nginx/ssl**

```bash
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

5. **Restart nginx**

```bash
docker-compose restart nginx
```

### Environment Variables

#### Backend Environment Variables

```env
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=project_manager
DB_USER=pm_user
DB_PASSWORD=<strong-password>
JWT_SECRET=<generate-random-string>
JWT_REFRESH_SECRET=<generate-random-string>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<app-password>
UPLOADS_DIR=/app/uploads
```

#### Frontend Environment Variables

```env
VITE_API_URL=https://your-domain.com/api
```

### Generate Strong Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate refresh secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Database Management

### Backup Database

```bash
docker-compose exec postgres pg_dump -U pm_user project_manager > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U pm_user project_manager < backup.sql
```

### Access Database Console

```bash
docker-compose exec postgres psql -U pm_user -d project_manager
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
docker-compose logs -f postgres
```

### Health Checks

```bash
# Backend health
curl http://localhost/health

# Check all containers
docker-compose ps
```

### Resource Usage

```bash
docker stats
```

## Scaling and Performance

### Horizontal Scaling

To scale the backend:

```bash
docker-compose up -d --scale backend=3
```

Update nginx upstream configuration to load balance across instances.

### Database Performance

For production, consider:
- Increase PostgreSQL `shared_buffers`
- Enable query caching
- Add database indexes (already included in schema)
- Regular VACUUM operations

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove unused images
docker image prune -a
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>
```

### Database connection errors

1. Check if PostgreSQL is healthy:
```bash
docker-compose ps postgres
```

2. Verify credentials in .env match docker-compose.yml

3. Check network connectivity:
```bash
docker-compose exec backend ping postgres
```

### Port already in use

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :3000

# Kill process or change port in docker-compose.yml
```

### File upload errors

Check permissions on uploads directory:
```bash
docker-compose exec backend ls -la /app/uploads
```

## Security Checklist

- [ ] Strong database password set
- [ ] JWT secrets are random and secure
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured (UFW or iptables)
- [ ] Regular backups scheduled
- [ ] Keep Docker images updated
- [ ] Monitor logs for suspicious activity
- [ ] Rate limiting enabled (already configured)
- [ ] CORS properly configured
- [ ] Security headers enabled (already configured in nginx)

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation in `/docs`
- Check GitHub issues

## License

See LICENSE file for details.

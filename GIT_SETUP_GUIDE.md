# Git Setup & Deployment Guide

Follow these steps to push your project to GitHub and deploy to your VPS.

## Step 1: Initialize Git Locally

Open PowerShell or Command Prompt and navigate to your project:

```bash
cd K:\AI-Projects\Project-Manager

# Initialize Git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Complete Project Manager application with Gantt charts"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com
2. Click the **+** icon → **New repository**
3. Repository name: `project-manager` (or your preferred name)
4. Description: "Full-featured Project Management application with Gantt charts"
5. **Important:** Do NOT initialize with README (we already have one)
6. Choose visibility: **Private** (recommended) or Public
7. Click **Create repository**

## Step 3: Connect to GitHub

Copy the commands GitHub shows you, or use these:

```bash
# Add GitHub as remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/project-manager.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**If prompted for credentials:**
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Create token at: https://github.com/settings/tokens
  - Select: `repo` scope
  - Copy and save the token (you won't see it again!)

## Step 4: Verify Upload

1. Go to your GitHub repository URL
2. You should see all your files
3. Check that `.env` is NOT there (it should be gitignored)

## Step 5: Deploy to VPS

### 5a. Connect to VPS

```bash
ssh your-username@your-vps-ip
```

### 5b. Install Prerequisites (if not already installed)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Install Git (usually pre-installed)
sudo apt install git -y

# Logout and login again for Docker group to take effect
exit
```

### 5c. Clone Repository on VPS

```bash
# Connect again
ssh your-username@your-vps-ip

# Clone your repository
git clone https://github.com/YOUR-USERNAME/project-manager.git

# Navigate to project
cd project-manager
```

### 5d. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit with your values
nano .env
```

**Important environment variables to set:**
```env
# Generate strong secrets (run these on your local machine):
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

DB_PASSWORD=your_very_strong_password_here
JWT_SECRET=your_generated_jwt_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here

# Optional: Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application URL (update with your domain or IP)
APP_URL=http://your-vps-ip
VITE_API_URL=http://your-vps-ip/api
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 5e. Start the Application

```bash
# Build and start all services
docker-compose build
docker-compose up -d

# Check status
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

### 5f. Access Your Application

Open browser and go to:
- http://your-vps-ip

You should see the Project Manager login page!

## Step 6: Test the Application

1. Click **Register** and create an account
2. Login with your credentials
3. Create a test project
4. Add some tasks
5. Try the Gantt chart
6. Test file uploads, comments, etc.

## Troubleshooting

### Can't access the application?

```bash
# Check if containers are running
docker-compose ps

# Check logs for errors
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Check firewall (allow port 80)
sudo ufw allow 80
sudo ufw status
```

### Database connection errors?

```bash
# Restart services
docker-compose restart

# Check PostgreSQL
docker-compose exec postgres psql -U pm_user -d project_manager -c "\dt"
```

### Need to update after changes?

```bash
# On VPS
cd project-manager
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

## Optional: Setup HTTPS/SSL

See `DEPLOYMENT.md` for detailed HTTPS setup instructions with Let's Encrypt.

Quick steps:
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate (replace your-domain.com)
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Uncomment HTTPS section in nginx/nginx.conf
nano nginx/nginx.conf

# Restart nginx
docker-compose restart nginx
```

## Backup Strategy

```bash
# Backup database
docker-compose exec postgres pg_dump -U pm_user project_manager > backup_$(date +%Y%m%d).sql

# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Schedule automatic backups (crontab)
crontab -e
# Add: 0 2 * * * cd /path/to/project-manager && docker-compose exec postgres pg_dump -U pm_user project_manager > backup_$(date +\%Y\%m\%d).sql
```

## Need Help?

- Check `DEPLOYMENT.md` for detailed deployment guide
- Check `PROJECT_STATUS.md` for feature documentation
- GitHub Issues: https://github.com/YOUR-USERNAME/project-manager/issues

---

## Summary Checklist

- [ ] Git initialized locally
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] VPS has Docker installed
- [ ] Repository cloned on VPS
- [ ] .env file configured
- [ ] docker-compose up -d executed
- [ ] Application accessible in browser
- [ ] Test account created
- [ ] All features tested
- [ ] Backups configured (optional)
- [ ] HTTPS configured (optional)

**You're done! 🎉**

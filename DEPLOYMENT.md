# OpenRift Deployment Guide

Complete guide for deploying OpenRift to production on your VPS.

## Prerequisites

- VPS with Ubuntu (yours: 72.62.151.89)
- Docker and Docker Compose installed ✅
- GitHub repository with main/dev branches ✅
- Domain name (optional, but recommended for SSL)

## Initial VPS Setup

### 1. Clone Repository on VPS

```bash
# SSH into your VPS
ssh root@72.62.151.89

# Navigate to web directory
cd /var/www/openrift

# Clone your repository
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git .

# Set up main branch
git checkout main
```

### 2. Create Environment File

```bash
# Create .env file
nano .env
```

Add the following (replace with your actual values):

```env
SECRET_KEY=your-actual-secret-key-here
CORS_ORIGINS=http://72.62.151.89,https://yourdomain.com
VITE_API_URL=http://72.62.151.89:8000
ENVIRONMENT=production
```

To generate a secure SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Make Deploy Script Executable

```bash
chmod +x deploy.sh
```

### 4. Initial Deployment

```bash
./deploy.sh
```

This will:
- Build Docker containers
- Start backend (port 8000) and frontend (port 80)
- Run health checks
- Clean up old images

## GitHub Actions Setup (Auto-Deploy)

### 1. Generate SSH Key for GitHub Actions

On your VPS:
```bash
# Generate SSH key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Add public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Display private key (copy this for GitHub)
cat ~/.ssh/github-actions
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

- **VPS_HOST**: `72.62.151.89`
- **VPS_USERNAME**: `root`
- **VPS_SSH_KEY**: Paste the entire private key from `~/.ssh/github-actions`
- **SECRET_KEY**: Your secret key from .env
- **CORS_ORIGINS**: `http://72.62.151.89,https://yourdomain.com`
- **VITE_API_URL**: `http://72.62.151.89:8000`

### 3. Test Auto-Deploy

Now when you push to main branch:
```bash
git add .
git commit -m "Test auto-deploy"
git push origin main
```

GitHub Actions will automatically:
1. SSH into your VPS
2. Pull latest code
3. Rebuild containers
4. Deploy the application

## Development Workflow

### Work on Features (dev branch)

```bash
# Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# Make changes, commit
git add .
git commit -m "Add my feature"
git push origin feature/my-feature

# Create pull request to dev on GitHub
```

### Deploy to Production (main branch)

```bash
# Merge dev into main
git checkout main
git pull origin main
git merge dev
git push origin main

# GitHub Actions will auto-deploy! 🚀
```

## Useful Commands

### View Container Logs

```bash
# All containers
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

### Restart Containers

```bash
docker compose restart
```

### Stop Everything

```bash
docker compose down
```

### Update Application (Manual)

```bash
cd /var/www/openrift
./deploy.sh
```

### Database Operations

```bash
# Access backend container
docker compose exec backend bash

# Reset database (inside container)
python reset_database.py

# Make user admin (inside container)
python make_admin.py username_or_email
```

## SSL/HTTPS Setup (Recommended)

### 1. Point Domain to VPS

In your domain registrar, add an A record:
- Type: A
- Name: @ (or subdomain)
- Value: 72.62.151.89
- TTL: 3600

### 2. Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### 3. Get SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com
```

### 4. Update CORS_ORIGINS

Edit `.env` file:
```env
CORS_ORIGINS=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

Restart containers:
```bash
docker compose down
docker compose up -d
```

## Monitoring

### Check Application Status

```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Disk usage
docker system df
```

### Health Endpoints

- Backend: `http://72.62.151.89:8000/health`
- Frontend: `http://72.62.151.89`
- API Docs: `http://72.62.151.89:8000/docs`

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker compose logs backend

# Common issues:
# - Missing .env file
# - Invalid SECRET_KEY
# - Database locked (restart container)
```

### Frontend Shows Error

```bash
# Check nginx logs
docker compose logs frontend

# Verify API URL in browser console
# Should match VITE_API_URL in .env
```

### Database Issues

```bash
# Access backend container
docker compose exec backend bash

# Check database file
ls -lh data/openrift.db

# If corrupted, restore from backup or reset
python reset_database.py
```

### Port Conflicts

```bash
# Check what's using port 80
sudo lsof -i :80

# Check what's using port 8000
sudo lsof -i :8000

# Stop conflicting service or change ports in docker-compose.yml
```

## Backup Strategy

### Database Backup

```bash
# Create backup
docker compose exec backend bash -c "cp data/openrift.db data/openrift-backup-$(date +%Y%m%d).db"

# Download backup to local machine
scp root@72.62.151.89:/var/www/openrift/backend/data/openrift-backup-*.db ./backups/
```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * cd /var/www/openrift && docker compose exec -T backend bash -c "cp data/openrift.db data/openrift-backup-\$(date +\%Y\%m\%d).db"
```

## Performance Optimization

### Enable Gzip (Already configured in nginx.conf)
✅ Already enabled for text/css/js/json

### Database Optimization

```bash
# Vacuum database (inside backend container)
sqlite3 data/openrift.db "VACUUM;"
```

### Docker Cleanup

```bash
# Remove unused images/containers
docker system prune -a

# Remove old volumes (CAUTION: This deletes data!)
docker volume prune
```

## Security Checklist

- ✅ SECRET_KEY is random and secure
- ✅ .env files are in .gitignore
- ✅ Rate limiting enabled (5 req/min on auth)
- ✅ CORS configured properly
- ✅ Security headers in nginx
- ⏳ SSL/HTTPS (recommended)
- ⏳ Firewall configured (recommended)
- ⏳ Fail2ban for SSH protection (recommended)

## Support

For issues:
1. Check logs: `docker compose logs -f`
2. Verify environment variables in `.env`
3. Check GitHub Actions workflow status
4. Review this guide for common solutions

---

**Current Status:**
- VPS IP: 72.62.151.89
- Frontend: http://72.62.151.89
- Backend: http://72.62.151.89:8000
- Auto-deploy: Enabled on push to main

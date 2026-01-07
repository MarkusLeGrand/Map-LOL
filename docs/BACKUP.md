# 🔒 OpenRift Backup & Maintenance Guide

## Automatic Tasks

The following tasks run automatically via cron:
- **Database Backups:** Daily at 2:00 AM
- **Analytics Cleanup:** Daily at 3:00 AM (deletes old unsaved files)

### Setup (One-time, on VPS)

```bash
# Make scripts executable
chmod +x backend/backup_db.sh backend/restore_db.sh

# Create backup directory
sudo mkdir -p /var/backups/openrift
sudo chown -R $USER:$USER /var/backups/openrift

# Add cron job for daily backups at 2 AM
crontab -e

# Add these lines:
# Database backup at 2 AM
0 2 * * * cd /var/www/openrift/Map-LOL && docker compose exec -T backend /app/backup_db.sh >> /var/log/openrift-backup.log 2>&1
# Analytics cleanup at 3 AM
0 3 * * * cd /var/www/openrift/Map-LOL && docker compose exec -T backend python /app/cleanup_analytics.py >> /var/log/openrift-cleanup.log 2>&1
```

## Manual Backup

```bash
# On VPS
cd /var/www/openrift/Map-LOL
docker compose exec backend /app/backup_db.sh
```

## Restore Database

```bash
# On VPS
cd /var/www/openrift/Map-LOL
docker compose exec backend /app/restore_db.sh
```

Follow the interactive prompts to select a backup and restore.

## Backup Location

- **Path:** `/var/backups/openrift/`
- **Format:** `openrift_backup_YYYYMMDD_HHMMSS.db.gz`
- **Retention:** 7 days (automatic cleanup)

## Download Backup to Local Machine

```bash
# From your PC
scp root@72.62.151.89:/var/backups/openrift/openrift_backup_*.db.gz ./
```

## Backup Schedule

- Daily at 2:00 AM (server time)
- Compressed with gzip
- Old backups deleted after 7 days

## Emergency Restore

If database is corrupted and you need to restore immediately:

```bash
# 1. Stop containers
docker compose down

# 2. Restore from backup
docker compose run --rm backend /app/restore_db.sh

# 3. Restart containers
docker compose up -d
```

---

## 🗑️ Analytics Cleanup

### What It Does

Automatically deletes old analytics JSON files to prevent disk space issues.

**Logic:**
- Files referenced in database (saved by users) → **KEPT**
- Files NOT saved + older than 7 days → **DELETED**
- Export charts older than 7 days → **DELETED**

### Why This Matters

- Each analytics file: 5-50MB
- Without cleanup: 100 users × 10 uploads = **500MB-5GB wasted**
- VPS disk space is limited (20-40GB typical)
- Prevents "disk full" errors that crash the site

### Manual Cleanup

```bash
# Run cleanup manually
cd /var/www/openrift/Map-LOL
docker compose exec backend python /app/cleanup_analytics.py
```

### Check Disk Usage

```bash
# Check disk space on VPS
df -h

# Check uploads folder size
du -sh /var/www/openrift/Map-LOL/backend/uploads
```

### Configuration

Edit `backend/cleanup_analytics.py`:
```python
RETENTION_DAYS = 7  # Change to keep files longer/shorter
```


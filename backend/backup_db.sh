#!/bin/bash

# OpenRift Database Backup Script
# Backs up SQLite database with timestamp

# Configuration
BACKUP_DIR="/var/backups/openrift"
DB_PATH="/app/data/openrift.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/openrift_backup_$TIMESTAMP.db"
DAYS_TO_KEEP=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup: $BACKUP_FILE"
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Compress backup
gzip "$BACKUP_FILE"
echo "Backup compressed: ${BACKUP_FILE}.gz"

# Delete old backups (keep only last 7 days)
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "openrift_backup_*.db.gz" -mtime +$DAYS_TO_KEEP -delete

# Show backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "Backup complete! Size: $BACKUP_SIZE"

# List recent backups
echo "Recent backups:"
ls -lht "$BACKUP_DIR"/openrift_backup_*.db.gz | head -5

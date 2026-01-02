#!/bin/bash

# OpenRift Database Restore Script
# Restores database from backup

BACKUP_DIR="/var/backups/openrift"
DB_PATH="/app/data/openrift.db"

# List available backups
echo "Available backups:"
ls -lht "$BACKUP_DIR"/openrift_backup_*.db.gz | nl

# Prompt for backup selection
read -p "Enter backup number to restore (or 'q' to quit): " selection

if [ "$selection" = "q" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Get selected backup file
BACKUP_FILE=$(ls -t "$BACKUP_DIR"/openrift_backup_*.db.gz | sed -n "${selection}p")

if [ -z "$BACKUP_FILE" ]; then
    echo "Invalid selection!"
    exit 1
fi

echo "Selected backup: $BACKUP_FILE"
read -p "Are you sure you want to restore? This will OVERWRITE current database! (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create backup of current database before restore
CURRENT_BACKUP="/var/backups/openrift/pre_restore_backup_$(date +"%Y%m%d_%H%M%S").db"
echo "Creating backup of current database..."
cp "$DB_PATH" "$CURRENT_BACKUP"
echo "Current database backed up to: $CURRENT_BACKUP"

# Decompress and restore
echo "Restoring database..."
gunzip -c "$BACKUP_FILE" > "$DB_PATH"

echo "✅ Database restored successfully!"
echo "If something went wrong, you can restore from: $CURRENT_BACKUP"

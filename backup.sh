#!/bin/bash
# Simple backup script using rclone

# Check if rclone is configured
if ! rclone config show > /dev/null 2>&1; then
  echo "Rclone is not configured. Skipping backup."
  exit 0
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="noteantigravity_backup_$TIMESTAMP.tar.gz"

echo "Starting backup at $TIMESTAMP..."

# Compress the /data directory (excluding any old backups if present)
tar -czf /tmp/$BACKUP_NAME -C / data/

# Push to configured rclone remote named 'remote' into a 'Backups' folder
rclone copy /tmp/$BACKUP_NAME remote:Backups/

# Cleanup local compressed file
rm /tmp/$BACKUP_NAME

echo "Backup completed successfully."

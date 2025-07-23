#!/bin/bash

# Database backup script for YogaStudio
# Creates timestamped backups of PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/root/yogastudio/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="yogadb_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Starting database backup..."

# Create backup using docker exec
docker exec yogastudio-db-1 pg_dump -U yogauser -d yogadb > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress the backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo "Backup completed: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# Keep only last 7 backups
find ${BACKUP_DIR} -name "yogadb_backup_*.sql.gz" -type f -mtime +7 -delete

echo "Old backups cleaned up (keeping last 7 days)"

# Display backup size and file count
echo "Backup directory status:"
ls -lh ${BACKUP_DIR}/
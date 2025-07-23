#!/bin/bash

# Database restore script for YogaStudio
# Restores PostgreSQL database from backup

set -e

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la /root/yogastudio/backups/
    exit 1
fi

BACKUP_FILE=$1
TEMP_SQL_FILE="/tmp/restore_$(date +%s).sql"

echo "Starting database restore from: ${BACKUP_FILE}"

# Decompress backup if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_SQL_FILE"
else
    cp "$BACKUP_FILE" "$TEMP_SQL_FILE"
fi

# Stop backend to prevent connections during restore
echo "Stopping backend service..."
docker-compose stop backend

# Restore database
echo "Restoring database..."
docker exec -i yogastudio-db-1 psql -U yogauser -d yogadb < "$TEMP_SQL_FILE"

# Start backend
echo "Starting backend service..."
docker-compose start backend

# Cleanup temp file
rm "$TEMP_SQL_FILE"

echo "Database restore completed successfully!"

# Verify restore
echo "Verifying restore..."
docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as asanas FROM asanas;"
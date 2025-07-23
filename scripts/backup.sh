#!/bin/bash

# Yoga AI Backup Script
set -e

BACKUP_DIR="/root/yogastudio/backups"
DATE=$(date +"%Y%m%d_%H%M%S")

echo "💾 Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "🗄️ Backing up database..."
docker-compose exec -T db pg_dump -U yogauser yogadb > "$BACKUP_DIR/database_$DATE.sql"

# Backup user data (if any persistent volumes)
echo "📁 Backing up volumes..."
docker run --rm -v yogastudio_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_data_$DATE.tar.gz /data

# Backup configuration files
echo "⚙️ Backing up configuration..."
tar czf "$BACKUP_DIR/config_$DATE.tar.gz" docker-compose.yml Caddyfile .env

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed successfully!"
echo "📍 Backup location: $BACKUP_DIR"
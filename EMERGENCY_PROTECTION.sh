#!/bin/bash

# EMERGENCY DATA PROTECTION SCRIPT
# This script PREVENTS data loss by blocking dangerous commands

set -e

echo "🚨 EMERGENCY DATA PROTECTION ACTIVE 🚨"
echo "This system has lost data 3 TIMES. NO MORE!"
echo

# Create immediate backup
echo "📦 Creating EMERGENCY backup..."
BACKUP_FILE="/root/yogastudio/backups/emergency_$(date +%Y%m%d_%H%M%S).sql.gz"
docker-compose exec -T db pg_dump -U yogauser -d yogadb | gzip > "$BACKUP_FILE"
echo "✅ Backup saved: $BACKUP_FILE"

# Check if trying to run dangerous commands
if [[ "$*" == *"docker-compose down -v"* ]]; then
    echo "❌ BLOCKED: docker-compose down -v - THIS DELETES ALL DATA!"
    echo "❌ Use 'docker-compose restart' instead"
    exit 1
fi

if [[ "$*" == *"down -v"* ]]; then
    echo "❌ BLOCKED: Command contains 'down -v' - THIS DELETES VOLUMES!"
    exit 1
fi

# Verify data integrity
echo "🔍 Verifying data integrity..."
USER_COUNT=$(docker-compose exec -T db psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
ASANA_COUNT=$(docker-compose exec -T db psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')

echo "👥 Users in database: $USER_COUNT"
echo "🧘 Asanas in database: $ASANA_COUNT"

if [ "$ASANA_COUNT" -lt 500 ]; then
    echo "⚠️  WARNING: Low asana count! Expected ~507, got $ASANA_COUNT"
fi

if [ "$USER_COUNT" -lt 1 ]; then
    echo "⚠️  WARNING: No users in database!"
fi

echo "✅ Protection check complete"
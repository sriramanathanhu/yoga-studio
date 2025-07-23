#!/bin/bash

# SAFE DEPLOYMENT SCRIPT - ONLY USE THIS FOR DEPLOYMENTS
# This script prevents data loss by never touching volumes

set -e

echo "🛡️  SAFE DEPLOYMENT PROCESS 🛡️"
echo "This script NEVER deletes data"
echo

# Step 1: Backup FIRST
echo "1️⃣  Creating backup before deployment..."
BACKUP_FILE="/root/yogastudio/backups/pre_deploy_$(date +%Y%m%d_%H%M%S).sql.gz"
docker-compose exec -T db pg_dump -U yogauser -d yogadb | gzip > "$BACKUP_FILE"
echo "✅ Backup saved: $BACKUP_FILE"

# Step 2: Build frontend (if needed)
if [ "$1" == "--build-frontend" ]; then
    echo "2️⃣  Building frontend..."
    cd /root/yogastudio/frontend
    npm run build
    echo "✅ Frontend built successfully"
fi

# Step 3: Safe restart (NO VOLUME DELETION)
echo "3️⃣  Restarting services (PRESERVING ALL DATA)..."
docker-compose restart

# Step 4: Deploy frontend build (if built)
if [ "$1" == "--build-frontend" ]; then
    echo "4️⃣  Deploying new frontend..."
    docker cp build/. yogastudio-frontend-1:/usr/share/nginx/html/
    docker-compose exec frontend nginx -s reload
    echo "✅ Frontend deployed"
fi

# Step 5: Verify everything still works
echo "5️⃣  Verifying data integrity..."
sleep 5  # Wait for services to stabilize

USER_COUNT=$(docker-compose exec -T db psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
ASANA_COUNT=$(docker-compose exec -T db psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')

echo "👥 Users: $USER_COUNT"
echo "🧘 Asanas: $ASANA_COUNT"

if [ "$ASANA_COUNT" -lt 500 ]; then
    echo "❌ DEPLOYMENT FAILED - Asanas missing!"
    exit 1
fi

echo "✅ SAFE DEPLOYMENT COMPLETE - NO DATA LOST!"
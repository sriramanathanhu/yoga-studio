#!/bin/bash

# Safe deployment script that preserves user data
# This script should be used for all production deployments

set -e

echo "🚀 Starting safe deployment process..."

# Step 1: Create backup
echo "📦 Creating database backup..."
./scripts/backup_database.sh

# Step 2: Stop services gracefully
echo "⏹️  Stopping services..."
docker-compose stop

# Step 3: Rebuild containers (but keep volumes)
echo "🔨 Rebuilding containers..."
docker-compose build --no-cache

# Step 4: Start database first and wait for health
echo "🗄️  Starting database..."
docker-compose up -d db redis

# Wait for database to be healthy
echo "⏳ Waiting for database to be ready..."
timeout=60
while ! docker-compose ps db | grep -q "healthy" && [ $timeout -gt 0 ]; do
    sleep 2
    timeout=$((timeout-2))
    echo "Waiting... ${timeout}s remaining"
done

if [ $timeout -le 0 ]; then
    echo "❌ Database failed to become healthy"
    exit 1
fi

echo "✅ Database is healthy"

# Step 5: Run database initialization (preserves existing data)
echo "🔧 Running database initialization..."
docker-compose run --rm db-init

# Step 5.5: Apply any pending migrations
echo "🔄 Applying database migrations..."
./scripts/migrate_database.sh

# Step 6: Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Step 7: Verify deployment
echo "✅ Verifying deployment..."
sleep 10

# Check service health
echo "Service status:"
docker-compose ps

# Check data integrity
echo "Data verification:"
docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as asanas FROM asanas;"

echo "🎉 Safe deployment completed successfully!"
echo "📊 Application available at: https://yogastudio.ecitizen.media"
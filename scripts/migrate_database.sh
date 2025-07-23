#!/bin/bash

# Database migration script for YogaStudio
# Handles schema migrations while preserving user data

set -e

# Configuration
BACKUP_DIR="/root/yogastudio/backups"
MIGRATION_DIR="/root/yogastudio/backend/app/database/migrations"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔄 Starting database migration process..."

# Step 1: Create pre-migration backup
echo "📦 Creating pre-migration backup..."
./scripts/backup_database.sh

# Step 2: Check for pending migrations
echo "🔍 Checking for pending migrations..."
if [ ! -d "$MIGRATION_DIR" ]; then
    echo "No migrations directory found, creating..."
    mkdir -p "$MIGRATION_DIR"
    echo "ℹ️  No migrations to apply"
    exit 0
fi

# List available migration files
MIGRATION_FILES=$(find "$MIGRATION_DIR" -name "*.sql" -type f | sort)

if [ -z "$MIGRATION_FILES" ]; then
    echo "ℹ️  No migration files found"
    exit 0
fi

echo "Found migration files:"
echo "$MIGRATION_FILES"

# Step 3: Apply migrations in order
echo "🚀 Applying migrations..."

for migration_file in $MIGRATION_FILES; do
    migration_name=$(basename "$migration_file")
    echo "Applying migration: $migration_name"
    
    # Check if migration was already applied
    migration_applied=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'schema_migrations'
        );
    " | tr -d ' ')
    
    if [ "$migration_applied" = "t" ]; then
        # Check if this specific migration was applied
        already_applied=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "
            SELECT EXISTS (
                SELECT 1 FROM schema_migrations 
                WHERE migration_name = '$migration_name'
            );
        " | tr -d ' ')
        
        if [ "$already_applied" = "t" ]; then
            echo "⏭️  Migration $migration_name already applied, skipping"
            continue
        fi
    else
        # Create schema_migrations table if it doesn't exist
        echo "Creating schema_migrations table..."
        docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        "
    fi
    
    # Apply the migration
    echo "Executing migration: $migration_name"
    if docker exec -i yogastudio-db-1 psql -U yogauser -d yogadb < "$migration_file"; then
        # Record successful migration
        docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "
            INSERT INTO schema_migrations (migration_name) 
            VALUES ('$migration_name')
            ON CONFLICT (migration_name) DO NOTHING;
        "
        echo "✅ Migration $migration_name completed successfully"
    else
        echo "❌ Migration $migration_name failed"
        echo "🔄 Rolling back to pre-migration backup..."
        
        # Find the most recent backup
        LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/yogadb_backup_*.sql.gz | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            ./scripts/restore_database.sh "$LATEST_BACKUP"
            echo "💾 Database restored from backup"
        fi
        exit 1
    fi
done

# Step 4: Verify database integrity
echo "🔍 Verifying database integrity..."
docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "
    SELECT 
        COUNT(*) as users,
        (SELECT COUNT(*) FROM asanas) as asanas,
        (SELECT COUNT(*) FROM schema_migrations) as migrations_applied
    FROM users;
"

# Step 5: Create post-migration backup
echo "📦 Creating post-migration backup..."
POST_MIGRATION_BACKUP="${BACKUP_DIR}/yogadb_post_migration_${TIMESTAMP}.sql"
docker exec yogastudio-db-1 pg_dump -U yogauser -d yogadb > "$POST_MIGRATION_BACKUP"
gzip "$POST_MIGRATION_BACKUP"

echo "🎉 Database migration completed successfully!"
echo "📊 Post-migration backup: ${POST_MIGRATION_BACKUP}.gz"
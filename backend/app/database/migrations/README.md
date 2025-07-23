# Database Migrations

This directory contains SQL migration files for the YogaStudio database schema.

## Migration Naming Convention

Migration files should follow this naming pattern:
```
YYYYMMDD_HHMMSS_description.sql
```

Example: `20240119_143000_add_user_preferences_table.sql`

## Migration File Structure

Each migration file should:
1. Be idempotent (safe to run multiple times)
2. Include both UP and DOWN operations when possible
3. Use transactions for atomic operations
4. Include comments explaining the changes

Example migration file:
```sql
-- Migration: Add user preferences table
-- Date: 2024-01-19
-- Description: Add table to store user yoga preferences and goals

BEGIN;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_difficulty VARCHAR(20) DEFAULT 'beginner',
    session_duration INTEGER DEFAULT 30,
    preferred_time VARCHAR(20) DEFAULT 'morning',
    focus_areas TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

COMMIT;
```

## Running Migrations

To apply all pending migrations:
```bash
./scripts/migrate_database.sh
```

The migration script will:
1. Create a backup before applying migrations
2. Apply migrations in chronological order
3. Track applied migrations in `schema_migrations` table
4. Rollback on failure
5. Create a post-migration backup

## Migration Best Practices

1. **Always backup before migrations**: The script does this automatically
2. **Test migrations on development first**: Never apply untested migrations to production
3. **Make migrations reversible**: Include rollback instructions in comments
4. **Keep migrations small**: One logical change per migration
5. **Use transactions**: Wrap DDL operations in BEGIN/COMMIT blocks
6. **Be careful with data migrations**: Preserve existing user data
7. **Document breaking changes**: Include migration notes in commit messages

## Emergency Rollback

If a migration fails, the script will automatically restore from the pre-migration backup.

Manual rollback:
```bash
# List available backups
ls -la /root/yogastudio/backups/

# Restore from specific backup
./scripts/restore_database.sh /root/yogastudio/backups/yogadb_backup_YYYYMMDD_HHMMSS.sql.gz
```

## Schema Migrations Table

The `schema_migrations` table tracks applied migrations:
```sql
CREATE TABLE schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

This prevents duplicate migration application and provides an audit trail.
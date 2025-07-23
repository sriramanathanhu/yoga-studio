"""
Database performance optimization - Add indexes for frequently queried columns
"""
from sqlalchemy import text
import sys
sys.path.append('/app')
from app.database.database import engine

def add_performance_indexes():
    """Add database indexes for better query performance"""
    
    indexes_to_create = [
        # Asanas table indexes
        "CREATE INDEX IF NOT EXISTS idx_asanas_difficulty_level ON asanas(difficulty_level);",
        "CREATE INDEX IF NOT EXISTS idx_asanas_sequence_stage ON asanas(sequence_stage);", 
        "CREATE INDEX IF NOT EXISTS idx_asanas_time_minutes ON asanas(time_minutes);",
        "CREATE INDEX IF NOT EXISTS idx_asanas_goal_tags_gin ON asanas USING GIN(goal_tags jsonb_ops);",  # JSONB index for goal_tags
        
        # Routines table indexes  
        "CREATE INDEX IF NOT EXISTS idx_routines_user_id_created ON routines(user_id, created_at DESC);",  # Composite index
        "CREATE INDEX IF NOT EXISTS idx_routines_difficulty_level ON routines(difficulty_level);",
        "CREATE INDEX IF NOT EXISTS idx_routines_is_completed ON routines(is_completed);",
        "CREATE INDEX IF NOT EXISTS idx_routines_completed_at ON routines(completed_at) WHERE completed_at IS NOT NULL;",  # Partial index
        
        # Feedback table indexes
        "CREATE INDEX IF NOT EXISTS idx_feedback_user_id_created ON feedback(user_id, created_at DESC);",  # Composite index
        "CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);",
        "CREATE INDEX IF NOT EXISTS idx_feedback_difficulty_feedback ON feedback(difficulty_feedback);",
        
        # Users table indexes (if needed for profile queries)
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",  # Already exists but ensuring
    ]
    
    print("Adding performance indexes to database...")
    
    with engine.connect() as connection:
        for index_sql in indexes_to_create:
            try:
                with connection.begin():  # Start a new transaction for each index
                    connection.execute(text(index_sql))
                    print(f"✅ Created index: {index_sql.split('idx_')[1].split(' ')[0] if 'idx_' in index_sql else 'index'}")
            except Exception as e:
                print(f"⚠️  Index creation skipped (may already exist): {e}")
    
    print("✅ Database index optimization complete!")

if __name__ == "__main__":
    add_performance_indexes()
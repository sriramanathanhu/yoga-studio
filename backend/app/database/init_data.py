import csv
import json
import os
from sqlalchemy.orm import Session
from ..database.database import SessionLocal, engine
from ..models.asana import Asana
from ..models.user import User, UserProfile
from ..models.routine import Routine, Feedback
from ..database.database import Base

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def load_asanas_from_csv(csv_file_path: str):
    """Load yoga asanas from CSV file into database"""
    db = SessionLocal()
    
    try:
        # Only clear asanas if database is empty (first run)
        existing_count = db.query(Asana).count()
        if existing_count == 0:
            print("Loading asanas for first time...")
        else:
            print(f"Database already has {existing_count} asanas, skipping reload to preserve data")
            return
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                # Parse JSON fields
                goal_tags = json.loads(row['goal_tags']) if row['goal_tags'] else []
                
                asana = Asana(
                    english_name=row['english_name'],
                    sanskrit_name=row['sanskrit_name'],
                    description=row['description'],
                    goal_tags=goal_tags,
                    difficulty_level=row['difficulty_level'],
                    time_minutes=int(row['time_minutes']) if row['time_minutes'] else None,
                    contraindications=row['contraindications'],
                    sequence_stage=row['sequence_stage'],
                    technique_instructions=row['technique_instructions'],
                    alignment_cues=row['alignment_cues'],
                    breathing_pattern=row['breathing_pattern'],
                    benefits=row['benefits']
                )
                
                db.add(asana)
        
        db.commit()
        print(f"Successfully loaded {db.query(Asana).count()} asanas from CSV")
        
    except Exception as e:
        print(f"Error loading asanas: {e}")
        db.rollback()
    finally:
        db.close()

def init_database():
    """Initialize database with tables and sample data"""
    print("Creating database tables...")
    create_tables()
    
    # Check if this is a fresh database or existing one
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        asana_count = db.query(Asana).count()
        
        print(f"Current database state: {user_count} users, {asana_count} asanas")
        
        if asana_count == 0:
            print("Loading yoga asanas...")
            csv_path = "/app/data/sample_asanas.csv"
            # Try alternative path if mounted data directory doesn't work
            if not os.path.exists(csv_path):
                csv_path = "/root/yogastudio/data/sample_asanas.csv"
            load_asanas_from_csv(csv_path)
        else:
            print("Asanas already loaded, preserving existing data")
            
        if user_count > 0:
            print(f"Preserving {user_count} existing user accounts")
        else:
            print("No existing users found")
            
    except Exception as e:
        print(f"Error checking database state: {e}")
    finally:
        db.close()
    
    print("Database initialization complete!")

if __name__ == "__main__":
    init_database()
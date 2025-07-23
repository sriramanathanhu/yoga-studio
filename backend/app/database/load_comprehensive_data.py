import csv
import json
import re
from sqlalchemy.orm import Session
from ..database.database import SessionLocal, engine
from ..models.asana import Asana
from ..database.database import Base

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def clean_text(text):
    """Clean and normalize text data"""
    if not text or text.strip() == '':
        return None
    # Remove extra whitespace and normalize
    cleaned = re.sub(r'\s+', ' ', str(text).strip())
    return cleaned if cleaned else None

def parse_goal_tags(goal_tags_str):
    """Parse goal tags from string format"""
    if not goal_tags_str or goal_tags_str.strip() == '':
        return []
    
    # Try to parse as JSON first
    try:
        if goal_tags_str.startswith('[') and goal_tags_str.endswith(']'):
            return json.loads(goal_tags_str)
    except:
        pass
    
    # Split by common delimiters
    tags = re.split(r'[,;|]+', goal_tags_str)
    return [tag.strip().lower() for tag in tags if tag.strip()]

def normalize_difficulty_level(level_str):
    """Normalize difficulty level"""
    if not level_str:
        return 'beginner'
    
    level = level_str.lower().strip()
    if 'beginner' in level or 'easy' in level or 'basic' in level:
        return 'beginner'
    elif 'intermediate' in level or 'medium' in level:
        return 'intermediate'
    elif 'advanced' in level or 'expert' in level or 'hard' in level:
        return 'advanced'
    else:
        return 'beginner'

def load_yoga_data_file_1(csv_file_path: str, db: Session):
    """Load yoga data from file 1 format"""
    loaded_count = 0
    
    with open(csv_file_path, 'r', encoding='utf-8', errors='ignore') as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)  # Skip header row
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                if len(row) < 26:  # Ensure minimum required columns
                    continue
                
                # Map columns based on file 1 structure
                sanskrit_name = clean_text(row[1])  # Asana Sanskrit Name
                english_name = clean_text(row[2])   # English Name
                technique = clean_text(row[4])      # Technique
                pranayama = clean_text(row[8])      # Pranayama
                bandha = clean_text(row[9])         # Bandha  
                mudra = clean_text(row[10])         # Mudra
                visualization = clean_text(row[11]) # Visualization
                drishti = clean_text(row[12])       # Gaze (Drishti)
                japa = clean_text(row[13])          # Japa
                benefits = clean_text(row[14])      # Benefits
                pramana_source = clean_text(row[15]) # Pramana Source
                sanskrit_verse = clean_text(row[16]) # Sanskrit Verse
                verse_translation = clean_text(row[17]) # Translation
                image_url = clean_text(row[18])     # Asana Images
                goal_tags = parse_goal_tags(row[21])  # Goal Tags
                level = normalize_difficulty_level(row[22])  # Level
                
                # Parse time minutes
                try:
                    time_minutes = int(float(row[23])) if row[23] and row[23].strip() else 30
                except:
                    time_minutes = 30
                
                contraindications = clean_text(row[24])  # Contraindications
                sequence_stage = clean_text(row[25])     # Sequence Stage
                
                # Skip if no name or technique
                if not sanskrit_name and not english_name:
                    continue
                
                # Create asana object with all sacred elements
                asana = Asana(
                    english_name=english_name or sanskrit_name,
                    sanskrit_name=sanskrit_name,
                    description=technique,
                    goal_tags=goal_tags,
                    difficulty_level=level,
                    time_minutes=time_minutes,
                    contraindications=contraindications,
                    sequence_stage=sequence_stage or 'general',
                    technique_instructions=technique,
                    benefits=benefits,
                    image_url=image_url,
                    
                    # Sacred elements from CSV
                    breathing_pattern=pranayama,
                    bandha=bandha,
                    mudra=mudra,
                    visualization=visualization,
                    drishti=drishti,
                    sanskrit_mantra=japa,  # Use japa as sanskrit_mantra
                    
                    # Sanskrit Verse fields - the key new additions!
                    sanskrit_verse=sanskrit_verse,
                    verse_translation=verse_translation,
                    pramana_source=pramana_source
                )
                
                db.add(asana)
                loaded_count += 1
                
            except Exception as e:
                print(f"Error processing row {row_num} in file 1: {e}")
                continue
    
    return loaded_count

def load_yoga_data_file_2(csv_file_path: str, db: Session):
    """Load yoga data from file 2 format"""
    loaded_count = 0
    
    with open(csv_file_path, 'r', encoding='utf-8', errors='ignore') as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)  # Skip header row
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                if len(row) < 34:  # Ensure minimum required columns
                    continue
                
                # Map columns based on file 2 structure
                sanskrit_name = clean_text(row[1])  # Asana Sanskrit Name
                english_name_from_col2 = clean_text(row[2])  # Combined name
                technique = clean_text(row[4])      # Technique
                benefits = clean_text(row[15])      # Benefits in Paragraph
                image_url = clean_text(row[19])     # Asana Images
                goal_tags = parse_goal_tags(row[29])  # Goal Tags
                level = normalize_difficulty_level(row[30])  # Level
                
                # Extract English name from combined field if available
                english_name = None
                if english_name_from_col2:
                    # Try to extract English name from "Asana Number - X: Sanskrit Name" format
                    match = re.search(r':\s*(.+)$', english_name_from_col2)
                    if match:
                        english_name = match.group(1).strip()
                
                # Parse time minutes
                try:
                    time_minutes = int(float(row[31])) if row[31] and row[31].strip() else 30
                except:
                    time_minutes = 30
                
                contraindications = clean_text(row[32])  # Contraindications
                sequence_stage = clean_text(row[33])     # Sequence Stage
                
                # Skip if no name or technique
                if not sanskrit_name and not english_name:
                    continue
                
                # Create asana object
                asana = Asana(
                    english_name=english_name or sanskrit_name,
                    sanskrit_name=sanskrit_name,
                    description=technique,
                    goal_tags=goal_tags,
                    difficulty_level=level,
                    time_minutes=time_minutes,
                    contraindications=contraindications,
                    sequence_stage=sequence_stage or 'general',
                    technique_instructions=technique,
                    benefits=benefits,
                    image_url=image_url
                )
                
                db.add(asana)
                loaded_count += 1
                
            except Exception as e:
                print(f"Error processing row {row_num} in file 2: {e}")
                continue
    
    return loaded_count

def load_yoga_data_file_3(csv_file_path: str, db: Session):
    """Load yoga data from file 3 format"""
    loaded_count = 0
    
    with open(csv_file_path, 'r', encoding='utf-8', errors='ignore') as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)  # Skip header row
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                if len(row) < 26:  # Ensure minimum required columns
                    continue
                
                # Map columns based on file 3 structure
                sanskrit_name = clean_text(row[1])  # Sanskrit Name
                english_name = clean_text(row[2])   # English Name
                technique = clean_text(row[3])      # Technique
                benefits = clean_text(row[13])      # Benefits
                image_url = clean_text(row[18])     # Asana Images
                goal_tags = parse_goal_tags(row[21])  # Goal Tags
                level = normalize_difficulty_level(row[22])  # Level
                
                # Parse time minutes
                try:
                    time_minutes = int(float(row[23])) if row[23] and row[23].strip() else 30
                except:
                    time_minutes = 30
                
                contraindications = clean_text(row[24])  # Contraindications
                sequence_stage = clean_text(row[25])     # Sequence Stage
                
                # Skip if no name or technique
                if not sanskrit_name and not english_name:
                    continue
                
                # Create asana object
                asana = Asana(
                    english_name=english_name or sanskrit_name,
                    sanskrit_name=sanskrit_name,
                    description=technique,
                    goal_tags=goal_tags,
                    difficulty_level=level,
                    time_minutes=time_minutes,
                    contraindications=contraindications,
                    sequence_stage=sequence_stage or 'general',
                    technique_instructions=technique,
                    benefits=benefits,
                    image_url=image_url
                )
                
                db.add(asana)
                loaded_count += 1
                
            except Exception as e:
                print(f"Error processing row {row_num} in file 3: {e}")
                continue
    
    return loaded_count

def load_comprehensive_yoga_data():
    """Load all yoga asana data from the three CSV files"""
    db = SessionLocal()
    
    try:
        print("Creating database tables...")
        create_tables()
        
        # Clear existing asanas
        print("Clearing existing asana data...")
        db.query(Asana).delete()
        db.commit()
        
        total_loaded = 0
        
        # Load from file 1
        print("Loading data from yoga_data_1.csv...")
        count1 = load_yoga_data_file_1("/app/data/yoga_data_1.csv", db)
        print(f"Loaded {count1} asanas from file 1")
        total_loaded += count1
        
        # Load from file 2
        print("Loading data from yoga_data_2.csv...")
        count2 = load_yoga_data_file_2("/app/data/yoga_data_2.csv", db)
        print(f"Loaded {count2} asanas from file 2")
        total_loaded += count2
        
        # Load from file 3
        print("Loading data from yoga_data_3.csv...")
        count3 = load_yoga_data_file_3("/app/data/yoga_data_3.csv", db)
        print(f"Loaded {count3} asanas from file 3")
        total_loaded += count3
        
        # Commit all changes
        db.commit()
        
        # Verify total count
        final_count = db.query(Asana).count()
        print(f"\nSuccessfully loaded {total_loaded} asanas total")
        print(f"Database now contains {final_count} asanas")
        
        # Show sample data
        print("\nSample loaded asanas:")
        sample_asanas = db.query(Asana).limit(5).all()
        for asana in sample_asanas:
            print(f"  - {asana.english_name} ({asana.sanskrit_name}) - {asana.difficulty_level}")
        
        return total_loaded
        
    except Exception as e:
        print(f"Error loading comprehensive yoga data: {e}")
        db.rollback()
        return 0
    finally:
        db.close()

if __name__ == "__main__":
    load_comprehensive_yoga_data()
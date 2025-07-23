from sqlalchemy import Column, Integer, String, Text, Float, Boolean, Index
from sqlalchemy.dialects.postgresql import JSONB
from ..database.database import Base

class Asana(Base):
    __tablename__ = "asanas"

    id = Column(Integer, primary_key=True, index=True)
    english_name = Column(String, nullable=False, index=True)
    sanskrit_name = Column(String)
    description = Column(Text)
    
    # Core practice fields
    goal_tags = Column(JSONB)  # List of goal strings
    difficulty_level = Column(String, index=True)  # beginner, intermediate, advanced
    time_minutes = Column(Integer, index=True)  # Estimated hold duration (1-2 minutes)
    contraindications = Column(Text)  # Safety warnings
    sequence_stage = Column(String, index=True)  # warm-up, standing, balance, seated, etc.
    
    # 12 Comprehensive Asana Components
    # 1. Asana (Physical posture) - covered by technique_instructions, alignment_cues
    technique_instructions = Column(Text)
    alignment_cues = Column(Text)
    
    # 2. Mudra (Hand gestures)
    mudra = Column(Text)
    
    # 3. Bandha (Energy locks)
    bandha = Column(Text)
    
    # 4. Drishti (Gazing/Focus points)
    drishti = Column(Text)
    
    # 5. Weight (if needed)
    weight_needed = Column(Boolean, default=False)
    weight_description = Column(Text)
    
    # 6. Visualization
    visualization = Column(Text)
    
    # 7, 8, 9. Sanskrit Mantra with transliteration and translation
    sanskrit_mantra = Column(Text)
    mantra_transliteration = Column(Text)
    mantra_translation = Column(Text)
    
    # Sanskrit Verse and Pramana Source (specific to each asana)
    sanskrit_verse = Column(Text)  # From "Sanskrit Verse" column in CSV
    verse_translation = Column(Text)  # From "Translation" column in CSV  
    pramana_source = Column(Text)  # From "Pramana Source" column in CSV
    
    # 10. Rudraksha Jewelery (common for all)
    rudraksha_jewelery = Column(Text, default='Standard rudraksha mala (108 beads)')
    
    # 11. Bhasma (common for all)
    bhasma = Column(Text, default='Vibhuti (sacred ash) applied to forehead')
    
    # 12. Sri Yantra (common for all)
    sriyantra = Column(Text, default='Meditation on Sri Yantra for divine energy')
    
    # Additional: Aushadha (common for all)
    aushadha = Column(Text, default='Tulsi leaves or neem for purification')
    
    # Practice guidance
    breathing_pattern = Column(Text)
    benefits = Column(Text)
    practice_tips = Column(Text)
    
    # Image fields
    image_url = Column(Text)  # Main pose image URL
    thumbnail_url = Column(Text)  # Thumbnail image URL (optional)
    
    # Define indexes
    __table_args__ = (
        Index('idx_asanas_goal_tags_gin', goal_tags, postgresql_using='gin'),
    )
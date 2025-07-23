from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class AsanaInRoutine(BaseModel):
    english_name: str
    sanskrit_name: Optional[str] = None
    description: Optional[str] = None
    duration: int = 30  # seconds
    technique_instructions: Optional[str] = None
    alignment_cues: Optional[str] = None
    breathing_pattern: Optional[str] = None
    benefits: Optional[str] = None
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    
    # 12 Comprehensive Asana Components
    # 2. Mudra (Hand gestures)
    mudra: Optional[str] = None
    
    # 3. Bandha (Energy locks)
    bandha: Optional[str] = None
    
    # 4. Drishti (Gazing/Focus points)
    drishti: Optional[str] = None
    
    # 5. Pranayama (Breathing pattern - enhanced)
    pranayama: Optional[str] = None
    
    # 6. Japa/Mantra repetition
    japa: Optional[str] = None
    
    # 7. Weight (if needed)
    weight_needed: Optional[bool] = False
    weight_description: Optional[str] = None
    
    # 6. Visualization
    visualization: Optional[str] = None
    
    # 7, 8, 9. Sanskrit Mantra with transliteration and translation
    sanskrit_mantra: Optional[str] = None
    mantra_transliteration: Optional[str] = None
    mantra_translation: Optional[str] = None
    
    # Sanskrit Verse and Pramana Source (specific to each asana)
    sanskrit_verse: Optional[str] = None
    verse_translation: Optional[str] = None  
    pramana_source: Optional[str] = None
    
    # 10. Rudraksha Jewelery (common for all)
    rudraksha_jewelery: Optional[str] = "Standard rudraksha mala (108 beads)"
    
    # 11. Bhasma (common for all)
    bhasma: Optional[str] = "Vibhuti (sacred ash) applied to forehead"
    
    # 12. Sri Yantra (common for all)
    sriyantra: Optional[str] = "Meditation on Sri Yantra for divine energy"
    
    # Additional: Aushadha (common for all)
    aushadha: Optional[str] = "Tulsi leaves or neem for purification"

class RoutineBase(BaseModel):
    name: str
    poses: List[AsanaInRoutine]
    estimated_duration: int
    difficulty_level: str
    focus_areas: List[str]

class RoutineCreate(RoutineBase):
    pass

class Routine(RoutineBase):
    id: int
    user_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RoutineComplete(BaseModel):
    completed_poses: int
    total_duration: int

class FeedbackBase(BaseModel):
    rating: int
    comment: Optional[str] = None
    difficulty_feedback: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    routine_id: int

class Feedback(FeedbackBase):
    id: int
    user_id: int
    routine_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_sessions: int
    total_minutes: int
    current_streak: int
    avg_rating: Optional[float] = None
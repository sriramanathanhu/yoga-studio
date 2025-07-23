from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.database import get_db
from ..models.asana import Asana
from ..schemas.user import User
from ..routers.auth import get_current_user
from ..core.cache import cache, asanas_list_cache_key, asana_cache_key
from ..core.logging import api_logger

router = APIRouter()

def calculate_dynamic_duration(difficulty_level: str, base_duration: int = None) -> int:
    """Calculate dynamic duration based on difficulty level
    
    Rules:
    - Beginner: 2 minutes (easier poses need more time to build strength)
    - Intermediate/Advanced: 1 minute (experienced practitioners can hold poses effectively)
    """
    if difficulty_level == 'beginner':
        return 2
    elif difficulty_level in ['intermediate', 'advanced']:
        return 1
    else:
        # Default fallback
        return 1

@router.get("/", response_model=List[dict])
def get_asanas(
    skip: int = Query(0, ge=0),
    limit: int = Query(508, ge=1, le=508),  # Support full 508 asana library
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    goals: Optional[str] = Query(None, description="Comma-separated list of goals"),
    sequence_stage: Optional[str] = Query(None),
    db: Session = Depends(get_db)
    # Temporarily removed authentication: current_user: User = Depends(get_current_user)
):
    """Get all asanas with optional filtering"""
    
    # Check cache first (only for non-search queries)
    if not search:
        cache_key = asanas_list_cache_key(difficulty, skip, limit)
        cached_result = cache.get(cache_key)
        if cached_result:
            api_logger.info(f"Cache hit for asanas list: {cache_key}")
            return cached_result
    
    query = db.query(Asana)
    
    # Filter by difficulty if specified
    if difficulty:
        query = query.filter(Asana.difficulty_level == difficulty)
    
    # Filter by sequence stage if specified
    if sequence_stage:
        query = query.filter(Asana.sequence_stage == sequence_stage)
    
    # Filter by goals if specified
    if goals:
        goal_list = [goal.strip() for goal in goals.split(',')]
        for goal in goal_list:
            query = query.filter(Asana.goal_tags.op('?')(goal))
    
    # Search in names and description if specified
    if search:
        search_filter = f"%{search.lower()}%"
        query = query.filter(
            (Asana.english_name.ilike(search_filter)) |
            (Asana.sanskrit_name.ilike(search_filter)) |
            (Asana.description.ilike(search_filter)) |
            (Asana.benefits.ilike(search_filter))
        )
    
    # Order by English name
    query = query.order_by(Asana.english_name)
    
    # Apply pagination
    asanas = query.offset(skip).limit(limit).all()
    
    # Convert to dict format
    result = []
    for asana in asanas:
        # Calculate dynamic duration based on difficulty
        dynamic_duration = calculate_dynamic_duration(asana.difficulty_level, asana.time_minutes)
        
        asana_dict = {
            "id": asana.id,
            "english_name": asana.english_name,
            "sanskrit_name": asana.sanskrit_name,
            "description": asana.description,
            "goal_tags": asana.goal_tags or [],
            "difficulty_level": asana.difficulty_level,
            "time_minutes": dynamic_duration,  # Use dynamic duration
            "original_time_minutes": asana.time_minutes,  # Keep original for reference
            "contraindications": asana.contraindications,
            "sequence_stage": asana.sequence_stage,
            
            # 12 Comprehensive Asana Components
            # 1. Asana (Physical posture)
            "technique_instructions": asana.technique_instructions,
            "alignment_cues": asana.alignment_cues,
            
            # 2. Mudra (Hand gestures)
            "mudra": asana.mudra,
            
            # 3. Bandha (Energy locks)
            "bandha": asana.bandha,
            
            # 4. Drishti (Gazing/Focus points)
            "drishti": asana.drishti,
            
            # 5. Weight (if needed)
            "weight_needed": getattr(asana, 'weight_needed', False),
            "weight_description": getattr(asana, 'weight_description', None),
            
            # 6. Visualization
            "visualization": asana.visualization,
            
            # 7, 8, 9. Sanskrit Mantra with transliteration and translation
            "sanskrit_mantra": getattr(asana, 'sanskrit_mantra', None),
            "mantra_transliteration": getattr(asana, 'mantra_transliteration', None),
            "mantra_translation": getattr(asana, 'mantra_translation', None),
            
            # 10. Rudraksha Jewelery (common for all)
            "rudraksha_jewelery": getattr(asana, 'rudraksha_jewelery', 'Standard rudraksha mala (108 beads)'),
            
            # 11. Bhasma (common for all)
            "bhasma": getattr(asana, 'bhasma', 'Vibhuti (sacred ash) applied to forehead'),
            
            # 12. Sri Yantra (common for all)
            "sriyantra": getattr(asana, 'sriyantra', 'Meditation on Sri Yantra for divine energy'),
            
            # Additional: Aushadha (common for all)
            "aushadha": getattr(asana, 'aushadha', 'Tulsi leaves or neem for purification'),
            
            # Practice guidance
            "breathing_pattern": asana.breathing_pattern,
            "benefits": asana.benefits,
            "practice_tips": asana.practice_tips,
            
            # Image fields
            "image_url": asana.image_url,
            "thumbnail_url": asana.thumbnail_url
        }
        result.append(asana_dict)
    
    # Cache the result (only for non-search queries)
    if not search:
        cache_key = asanas_list_cache_key(difficulty, skip, limit)
        cache.set(cache_key, result, ttl=1800)  # Cache for 30 minutes
        api_logger.info(f"Cached asanas list: {cache_key}")
    
    return result

@router.get("/{asana_id}", response_model=dict)
def get_asana(
    asana_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific asana by ID"""
    
    # Check cache first
    cache_key = asana_cache_key(asana_id)
    cached_result = cache.get(cache_key)
    if cached_result:
        api_logger.info(f"Cache hit for asana: {cache_key}")
        return cached_result
    
    asana = db.query(Asana).filter(Asana.id == asana_id).first()
    
    if not asana:
        raise HTTPException(status_code=404, detail="Asana not found")
    
    # Calculate dynamic duration based on difficulty
    dynamic_duration = calculate_dynamic_duration(asana.difficulty_level, asana.time_minutes)
    
    result = {
        "id": asana.id,
        "english_name": asana.english_name,
        "sanskrit_name": asana.sanskrit_name,
        "description": asana.description,
        "goal_tags": asana.goal_tags or [],
        "difficulty_level": asana.difficulty_level,
        "time_minutes": dynamic_duration,  # Use dynamic duration
        "original_time_minutes": asana.time_minutes,  # Keep original for reference
        "contraindications": asana.contraindications,
        "sequence_stage": asana.sequence_stage,
        "technique_instructions": asana.technique_instructions,
        "alignment_cues": asana.alignment_cues,
        "breathing_pattern": asana.breathing_pattern,
        "bandha": asana.bandha,
        "mudra": asana.mudra,
        "drishti": asana.drishti,
        "benefits": asana.benefits,
        "practice_tips": asana.practice_tips,
        "visualization": asana.visualization,
        "image_url": asana.image_url,
        "thumbnail_url": asana.thumbnail_url
    }
    
    # Cache the result
    cache.set(cache_key, result, ttl=3600)  # Cache for 1 hour
    api_logger.info(f"Cached asana: {cache_key}")
    
    return result

@router.get("/stats/count")
def get_asana_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total count of asanas and breakdown by difficulty"""
    total_count = db.query(Asana).count()
    
    difficulty_counts = {}
    for difficulty in ['beginner', 'intermediate', 'advanced']:
        count = db.query(Asana).filter(Asana.difficulty_level == difficulty).count()
        difficulty_counts[difficulty] = count
    
    return {
        "total": total_count,
        "by_difficulty": difficulty_counts
    }

@router.get("/routine-suggestions")
def get_routine_suggestions(
    available_time: int = Query(..., description="Available time in minutes"),
    difficulty: str = Query("beginner", description="Preferred difficulty level"),
    db: Session = Depends(get_db)
    # Temporarily removed authentication: current_user: User = Depends(get_current_user)
):
    """Get routine suggestions based on available time and difficulty"""
    
    # Basic time allocation: 10% warm-up, 70% main poses, 20% cool-down
    warmup_time = int(available_time * 0.1)
    main_time = int(available_time * 0.7)
    cooldown_time = int(available_time * 0.2)
    
    # Get poses by sequence stage
    warmup_poses = db.query(Asana).filter(
        Asana.sequence_stage == 'warm-up',
        Asana.difficulty_level == difficulty
    ).limit(2).all()
    
    standing_poses = db.query(Asana).filter(
        Asana.sequence_stage == 'standing',
        Asana.difficulty_level == difficulty
    ).limit(4).all()
    
    cooldown_poses = db.query(Asana).filter(
        Asana.sequence_stage == 'cool-down',
        Asana.difficulty_level == difficulty
    ).limit(2).all()
    
    # Calculate total asanas and duration
    all_poses = warmup_poses + standing_poses + cooldown_poses
    total_asanas = len(all_poses)
    
    # Calculate dynamic durations
    total_duration = 0
    routine_poses = []
    
    for pose in all_poses:
        dynamic_duration = calculate_dynamic_duration(pose.difficulty_level, pose.time_minutes)
        total_duration += dynamic_duration
        
        routine_poses.append({
            "id": pose.id,
            "english_name": pose.english_name,
            "sanskrit_name": pose.sanskrit_name,
            "duration_minutes": dynamic_duration,
            "sequence_stage": pose.sequence_stage,
            "difficulty_level": pose.difficulty_level
        })
    
    return {
        "available_time": available_time,
        "suggested_duration": total_duration,
        "total_asanas": total_asanas,
        "time_breakdown": {
            "warmup_time": warmup_time,
            "main_time": main_time, 
            "cooldown_time": cooldown_time
        },
        "routine_poses": routine_poses,
        "recommendation": f"Perfect {difficulty} routine with {total_asanas} poses for {total_duration} minutes"
    }
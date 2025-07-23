from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, cast, String
from typing import List
from datetime import datetime, timedelta
import random
from ..database.database import get_db
from ..models.user import User, UserProfile
from ..models.routine import Routine, Feedback
from ..models.asana import Asana
from ..schemas.routine import (
    RoutineCreate, Routine as RoutineSchema, RoutineComplete,
    FeedbackCreate, Feedback as FeedbackSchema, DashboardStats,
    AsanaInRoutine
)
from ..routers.auth import get_current_user

router = APIRouter(prefix="/routines", tags=["routines"])

def calculate_dynamic_duration(difficulty_level: str) -> int:
    """Calculate dynamic duration based on difficulty level following user requirements
    
    Rules:
    - Beginner: 2 minutes (easier poses need more time to build strength)
    - Intermediate/Advanced: 1 minute (experienced practitioners can hold poses effectively)
    """
    if difficulty_level == 'beginner':
        return 2
    elif difficulty_level in ['intermediate', 'advanced']:
        return 1
    else:
        return 1

def generate_personalized_routine(db: Session, user_profile: UserProfile) -> List[AsanaInRoutine]:
    """Generate a personalized yoga routine based on user profile and predefined goals"""
    
    # Get user preferences
    goals = user_profile.goals or ['flexibility']
    fitness_level = user_profile.fitness_level or 'beginner'
    time_preference = user_profile.time_preference or 30
    limitations = user_profile.physical_limitations or ''
    
    print(f"Generating routine for: goals={goals}, level={fitness_level}, time={time_preference}")
    
    # Step 1: Build a balanced routine with proper sequence
    routine_structure = {
        'warm-up': {'duration_percent': 0.15, 'poses': []},
        'standing': {'duration_percent': 0.30, 'poses': []}, 
        'seated': {'duration_percent': 0.25, 'poses': []},
        'prone': {'duration_percent': 0.15, 'poses': []},
        'supine': {'duration_percent': 0.10, 'poses': []},
        'relaxation': {'duration_percent': 0.05, 'poses': []}
    }
    
    # Step 2: Calculate pose duration based on difficulty level
    pose_duration_minutes = calculate_dynamic_duration(fitness_level)
    
    # Step 3: Calculate total number of asanas based on available time and goals
    total_asanas_needed = max(time_preference // pose_duration_minutes, 5)
    
    print(f"Target: {total_asanas_needed} asanas, {pose_duration_minutes} min each")
    
    # Step 4: Get asanas for each sequence stage
    selected_asanas = []
    
    for stage, config in routine_structure.items():
        # Calculate how many poses needed for this stage
        stage_poses_needed = max(int(total_asanas_needed * config['duration_percent']), 1)
        
        # Query asanas for this stage
        stage_query = db.query(Asana).filter(Asana.sequence_stage == stage)
        
        # Apply difficulty filter
        stage_query = stage_query.filter(Asana.difficulty_level == fitness_level)
        
        # Apply goal filters - at least one goal should match
        if goals:
            goal_conditions = []
            for goal in goals:
                goal_conditions.append(Asana.goal_tags.op('?')(goal))
            if goal_conditions:
                from sqlalchemy import or_
                stage_query = stage_query.filter(or_(*goal_conditions))
        
        stage_asanas = stage_query.all()
        
        # If no specific asanas found, try broader search
        if not stage_asanas:
            stage_query = db.query(Asana).filter(Asana.sequence_stage == stage)
            stage_asanas = stage_query.limit(stage_poses_needed * 2).all()
        
        # Select poses for this stage
        if stage_asanas:
            available_count = min(stage_poses_needed, len(stage_asanas))
            stage_selected = random.sample(stage_asanas, available_count)
            selected_asanas.extend(stage_selected)
            
            print(f"Stage {stage}: selected {len(stage_selected)} of {len(stage_asanas)} available")
    
    # Step 5: If we don't have enough poses, add more from available pool
    if len(selected_asanas) < total_asanas_needed:
        # Get additional poses from the general pool
        all_suitable_query = db.query(Asana).filter(Asana.difficulty_level == fitness_level)
        
        if goals:
            goal_conditions = []
            for goal in goals:
                goal_conditions.append(Asana.goal_tags.op('?')(goal))
            if goal_conditions:
                from sqlalchemy import or_
                all_suitable_query = all_suitable_query.filter(or_(*goal_conditions))
        
        # Exclude already selected poses
        selected_ids = [asana.id for asana in selected_asanas]
        additional_asanas = all_suitable_query.filter(~Asana.id.in_(selected_ids)).limit(
            total_asanas_needed - len(selected_asanas)
        ).all()
        
        selected_asanas.extend(additional_asanas)
        print(f"Added {len(additional_asanas)} additional poses")
    
    # If still no asanas, create sample ones
    if not selected_asanas:
        return create_sample_routine(time_preference)
    
    print(f"Final selection: {len(selected_asanas)} asanas")
    
    # Step 6: Convert to routine format with proper duration
    routine_poses = []
    for asana in selected_asanas:
        # Use dynamic duration calculation
        dynamic_duration_minutes = calculate_dynamic_duration(asana.difficulty_level)
        pose_duration_seconds = dynamic_duration_minutes * 60
        
        routine_poses.append(AsanaInRoutine(
            english_name=asana.english_name,
            sanskrit_name=asana.sanskrit_name,
            description=asana.description,
            duration=pose_duration_seconds,
            technique_instructions=asana.technique_instructions,
            alignment_cues=asana.alignment_cues,
            breathing_pattern=asana.breathing_pattern,
            benefits=asana.benefits,
            image_url=asana.image_url,
            thumbnail_url=asana.thumbnail_url,
            
            # Sacred Nithyananda Yoga Components
            mudra=getattr(asana, 'mudra', None),
            bandha=getattr(asana, 'bandha', None),
            drishti=getattr(asana, 'drishti', None),
            pranayama=getattr(asana, 'breathing_pattern', None),  # Map breathing_pattern to pranayama
            japa=getattr(asana, 'sanskrit_mantra', None),  # Use sanskrit_mantra as japa
            weight_needed=getattr(asana, 'weight_needed', False),
            weight_description=getattr(asana, 'weight_description', None),
            visualization=getattr(asana, 'visualization', None),
            sanskrit_mantra=getattr(asana, 'sanskrit_mantra', None),
            mantra_transliteration=getattr(asana, 'mantra_transliteration', None),
            mantra_translation=getattr(asana, 'mantra_translation', None),
            
            # Sanskrit Verse and Pramana Source
            sanskrit_verse=getattr(asana, 'sanskrit_verse', None),
            verse_translation=getattr(asana, 'verse_translation', None),
            pramana_source=getattr(asana, 'pramana_source', None),
            
            # Sacred Traditional Elements - Enhanced for Nithyananda Yoga
            rudraksha_jewelery=getattr(asana, 'rudraksha_jewelery', "Wear Rudraksha mala (108 beads) during practice for spiritual protection and energy"),
            bhasma=getattr(asana, 'bhasma', "Apply Vibhuti (sacred ash) to forehead before practice - essential for spiritual purification"),
            sriyantra=getattr(asana, 'sriyantra', "Place Sri Yantra nearby and meditate on it for divine cosmic energy connection"),
            aushadha=getattr(asana, 'aushadha', "Prepare sandalwood + turmeric paste (Aushadha) for spiritual healing and purification")
        ))
    
    return routine_poses

def create_sample_routine(time_preference: int) -> List[AsanaInRoutine]:
    """Create a sample routine when no asanas are available in database"""
    
    sample_poses = [
        AsanaInRoutine(
            english_name="Mountain Pose",
            sanskrit_name="Tadasana",
            description="Standing tall with feet together, arms at sides",
            duration=30,
            technique_instructions="Stand with feet together, arms at your sides. Engage your thighs and lift your kneecaps.",
            alignment_cues="Keep your spine long, shoulders relaxed, and weight evenly distributed",
            breathing_pattern="Breathe deeply and evenly",
            benefits="Improves posture, strengthens legs, increases awareness"
        ),
        AsanaInRoutine(
            english_name="Downward Facing Dog",
            sanskrit_name="Adho Mukha Svanasana",
            description="Inverted V-shape pose strengthening arms and legs",
            duration=60,
            technique_instructions="From tabletop, tuck toes under and lift hips up and back",
            alignment_cues="Press hands firmly into mat, lengthen spine, keep ears between arms",
            breathing_pattern="Breathe steadily through nose",
            benefits="Strengthens arms and legs, stretches spine, energizes body"
        ),
        AsanaInRoutine(
            english_name="Warrior I",
            sanskrit_name="Virabhadrasana I",
            description="Standing pose with one leg forward, arms reaching up",
            duration=45,
            technique_instructions="Step one foot forward, bend front knee, raise arms overhead",
            alignment_cues="Square hips forward, keep front knee over ankle, lift through crown",
            breathing_pattern="Deep, powerful breaths",
            benefits="Strengthens legs, opens hips, builds confidence"
        ),
        AsanaInRoutine(
            english_name="Child's Pose",
            sanskrit_name="Balasana",
            description="Resting pose with knees apart, sitting back on heels",
            duration=60,
            technique_instructions="Kneel on mat, sit back on heels, fold forward with arms extended",
            alignment_cues="Relax shoulders, let forehead rest on mat, breathe into back body",
            breathing_pattern="Slow, calming breaths",
            benefits="Relaxes nervous system, stretches back, calms mind"
        )
    ]
    
    # Select poses based on time preference
    num_poses = min(max(int(time_preference / 8), 3), len(sample_poses))
    return sample_poses[:num_poses]

@router.post("/generate", response_model=RoutineSchema)
def generate_routine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get user's profile or create default one
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        # Create default profile if none exists
        profile = UserProfile(
            user_id=current_user.id,
            goals=['flexibility'],
            fitness_level='beginner',
            time_preference=30
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Generate poses
    poses = generate_personalized_routine(db, profile)
    
    # Calculate total duration
    total_duration = sum(pose.duration for pose in poses) // 60  # Convert to minutes
    
    # Create routine
    routine = Routine(
        user_id=current_user.id,
        name=f"Personalized Practice - {datetime.now().strftime('%Y-%m-%d')}",
        poses=[pose.dict() for pose in poses],
        estimated_duration=total_duration,
        difficulty_level=profile.fitness_level or 'beginner',
        focus_areas=profile.goals or ['flexibility']
    )
    
    db.add(routine)
    db.commit()
    db.refresh(routine)
    
    return routine

@router.post("/{routine_id}/complete")
def complete_routine(
    routine_id: int,
    completion_data: RoutineComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    routine = db.query(Routine).filter(
        and_(Routine.id == routine_id, Routine.user_id == current_user.id)
    ).first()
    
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    routine.is_completed = True
    routine.completed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Routine completed successfully"}

@router.get("/recent")
def get_recent_routines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    routines = db.query(Routine).filter(
        and_(Routine.user_id == current_user.id, Routine.is_completed == True)
    ).order_by(Routine.completed_at.desc()).limit(5).all()
    
    recent_routines = []
    for routine in routines:
        feedback = db.query(Feedback).filter(Feedback.routine_id == routine.id).first()
        recent_routines.append({
            "name": routine.name,
            "duration": routine.estimated_duration,
            "date": routine.completed_at.isoformat() if routine.completed_at else routine.created_at.isoformat(),
            "rating": feedback.rating if feedback else None
        })
    
    return recent_routines

@router.post("/feedback", response_model=FeedbackSchema)
def submit_feedback(
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify routine belongs to user
    routine = db.query(Routine).filter(
        and_(Routine.id == feedback_data.routine_id, Routine.user_id == current_user.id)
    ).first()
    
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Check if feedback already exists
    existing_feedback = db.query(Feedback).filter(
        and_(Feedback.routine_id == feedback_data.routine_id, Feedback.user_id == current_user.id)
    ).first()
    
    if existing_feedback:
        # Update existing feedback
        existing_feedback.rating = feedback_data.rating
        existing_feedback.comment = feedback_data.comment
        existing_feedback.difficulty_feedback = feedback_data.difficulty_feedback
        db.commit()
        db.refresh(existing_feedback)
        return existing_feedback
    else:
        # Create new feedback
        feedback = Feedback(
            user_id=current_user.id,
            routine_id=feedback_data.routine_id,
            rating=feedback_data.rating,
            comment=feedback_data.comment,
            difficulty_feedback=feedback_data.difficulty_feedback
        )
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback
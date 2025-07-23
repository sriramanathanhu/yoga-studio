from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models.user import User, UserProfile
from ..schemas.user import UserProfileCreate, UserProfile as UserProfileSchema
from ..routers.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

@router.post("/setup", response_model=UserProfileSchema)
def setup_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if profile already exists
    existing_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if existing_profile:
        # Update existing profile
        existing_profile.goals = profile_data.goals
        existing_profile.fitness_level = profile_data.fitness_level
        existing_profile.physical_limitations = profile_data.physical_limitations
        existing_profile.time_preference = profile_data.time_preference
        db.commit()
        db.refresh(existing_profile)
        return existing_profile
    else:
        # Create new profile
        db_profile = UserProfile(
            user_id=current_user.id,
            goals=profile_data.goals,
            fitness_level=profile_data.fitness_level,
            physical_limitations=profile_data.physical_limitations,
            time_preference=profile_data.time_preference
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile

@router.get("/", response_model=UserProfileSchema)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        # Create a default profile if none exists
        profile = UserProfile(
            user_id=current_user.id,
            goals=['flexibility'],
            fitness_level='beginner',
            time_preference=30
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/", response_model=UserProfileSchema)
def update_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.goals = profile_data.goals
    profile.fitness_level = profile_data.fitness_level
    profile.physical_limitations = profile_data.physical_limitations
    profile.time_preference = profile_data.time_preference
    
    db.commit()
    db.refresh(profile)
    return profile
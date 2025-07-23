from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from ..database.database import get_db
from ..models.user import User
from ..models.routine import Routine, Feedback
from ..schemas.routine import DashboardStats
from ..routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Total completed sessions
    total_sessions = db.query(Routine).filter(
        and_(Routine.user_id == current_user.id, Routine.is_completed == True)
    ).count()
    
    # Total minutes practiced
    total_minutes_result = db.query(func.sum(Routine.estimated_duration)).filter(
        and_(Routine.user_id == current_user.id, Routine.is_completed == True)
    ).scalar()
    total_minutes = total_minutes_result or 0
    
    # Calculate current streak
    current_streak = calculate_current_streak(db, current_user.id)
    
    # Average rating
    avg_rating_result = db.query(func.avg(Feedback.rating)).filter(
        Feedback.user_id == current_user.id
    ).scalar()
    avg_rating = float(avg_rating_result) if avg_rating_result else None
    
    return DashboardStats(
        total_sessions=total_sessions,
        total_minutes=total_minutes,
        current_streak=current_streak,
        avg_rating=avg_rating
    )

def calculate_current_streak(db: Session, user_id: int) -> int:
    """Calculate current consecutive days streak"""
    
    # Get all completed routines ordered by completion date
    completed_routines = db.query(Routine).filter(
        and_(Routine.user_id == user_id, Routine.is_completed == True)
    ).order_by(Routine.completed_at.desc()).all()
    
    if not completed_routines:
        return 0
    
    # Get unique practice dates
    practice_dates = set()
    for routine in completed_routines:
        if routine.completed_at:
            practice_dates.add(routine.completed_at.date())
    
    if not practice_dates:
        return 0
    
    # Sort dates in descending order
    sorted_dates = sorted(practice_dates, reverse=True)
    
    # Check if practiced today or yesterday
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    if sorted_dates[0] not in [today, yesterday]:
        return 0
    
    # Calculate consecutive days
    streak = 1
    expected_date = sorted_dates[0] - timedelta(days=1)
    
    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] == expected_date:
            streak += 1
            expected_date -= timedelta(days=1)
        else:
            break
    
    return streak
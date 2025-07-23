from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text, desc, and_, or_
from ..database.database import get_db
from ..models import User, UserProfile, Routine, Feedback, Asana
from ..models.admin import AdminUser, UserActivity, DailyStat, AdminRole, ActivityType
from ..schemas.admin import (
    UserStatsResponse, UserManagementUpdate, DashboardStats, 
    UserGrowthStats, UserEngagementStats, AsanaPopularityStats, 
    RoutineStats, SystemHealthStats, UserFiltersRequest, 
    PaginationRequest, PaginatedResponse, DateRangeRequest,
    AdminUserCreate, AdminUserUpdate, AdminUser as AdminUserSchema
)
from ..core.admin_security import (
    get_current_admin_user, require_user_management, require_admin_management,
    require_analytics, require_super_admin, create_admin_user
)

router = APIRouter(prefix="/admin", tags=["admin"])


# User Management Endpoints
@router.get("/users", response_model=PaginatedResponse)
def get_users(
    pagination: PaginationRequest = Depends(),
    filters: UserFiltersRequest = Depends(),
    current_admin: AdminUser = Depends(require_user_management),
    db: Session = Depends(get_db)
):
    """Get paginated list of users with filtering options"""
    
    # Build base query using the user_stats_view
    query = db.execute(text("SELECT * FROM user_stats_view"))
    
    # Convert to list for filtering (in production, this should be done at DB level)
    all_users = [dict(row._mapping) for row in query]
    
    # Apply filters
    filtered_users = all_users
    
    if filters.is_active is not None:
        filtered_users = [u for u in filtered_users if u['is_active'] == filters.is_active]
    
    if filters.user_status:
        filtered_users = [u for u in filtered_users if u['user_status'] == filters.user_status]
    
    if filters.created_after:
        filtered_users = [u for u in filtered_users if u['created_at'] >= filters.created_after]
    
    if filters.created_before:
        filtered_users = [u for u in filtered_users if u['created_at'] <= filters.created_before]
    
    if filters.has_completed_routines is not None:
        if filters.has_completed_routines:
            filtered_users = [u for u in filtered_users if u['completed_routines'] > 0]
        else:
            filtered_users = [u for u in filtered_users if u['completed_routines'] == 0]
    
    if filters.min_login_count:
        filtered_users = [u for u in filtered_users if u['login_count'] >= filters.min_login_count]
    
    # Calculate pagination
    total = len(filtered_users)
    total_pages = (total + pagination.page_size - 1) // pagination.page_size
    start_idx = (pagination.page - 1) * pagination.page_size
    end_idx = start_idx + pagination.page_size
    
    # Get page items
    page_items = filtered_users[start_idx:end_idx]
    
    return {
        "items": page_items,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": total_pages
    }


@router.get("/users/{user_id}", response_model=UserStatsResponse)
def get_user_details(
    user_id: int,
    current_admin: AdminUser = Depends(require_user_management),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific user"""
    result = db.execute(
        text("SELECT * FROM user_stats_view WHERE id = :user_id"),
        {"user_id": user_id}
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return dict(result._mapping)


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_update: UserManagementUpdate,
    current_admin: AdminUser = Depends(require_user_management),
    db: Session = Depends(get_db)
):
    """Update user information (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    # Log admin activity
    activity = UserActivity(
        user_id=current_admin.id,  # Log admin activity
        activity_type="admin_user_update",
        activity_data={
            "target_user_id": user_id,
            "updates": update_data,
            "admin_id": current_admin.id
        }
    )
    db.add(activity)
    db.commit()
    
    return {"message": "User updated successfully", "user": user}


@router.get("/users/{user_id}/activity")
def get_user_activity(
    user_id: int,
    days: int = Query(30, description="Number of days to look back"),
    current_admin: AdminUser = Depends(require_user_management),
    db: Session = Depends(get_db)
):
    """Get user activity history"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    activities = db.query(UserActivity).filter(
        UserActivity.user_id == user_id,
        UserActivity.created_at >= start_date
    ).order_by(desc(UserActivity.created_at)).limit(100).all()
    
    return {"activities": activities}


# Analytics Endpoints
@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_admin: AdminUser = Depends(require_analytics),
    db: Session = Depends(get_db)
):
    """Get key dashboard statistics"""
    today = date.today()
    
    # Get today's stats from daily_stats table
    today_stats = db.query(DailyStat).filter(DailyStat.stat_date == today).first()
    
    # If no stats for today, calculate them
    if not today_stats:
        today_stats = DailyStat(
            stat_date=today,
            total_users=db.query(User).count(),
            new_users=db.query(User).filter(func.date(User.created_at) == today).count(),
            active_users=db.query(User).filter(func.date(User.last_login_at) == today).count(),
            total_sessions=0,  # Would need session tracking
            total_routines_completed=db.query(Routine).filter(
                Routine.is_completed == True,
                func.date(Routine.completed_at) == today
            ).count(),
            avg_session_duration_minutes=0,
            popular_asanas=[]
        )
        db.add(today_stats)
        db.commit()
    
    return {
        "total_users": today_stats.total_users,
        "new_users_today": today_stats.new_users,
        "active_users_today": today_stats.active_users,
        "total_sessions_today": today_stats.total_sessions,
        "total_routines_completed_today": today_stats.total_routines_completed,
        "avg_session_duration": float(today_stats.avg_session_duration_minutes),
        "popular_asanas": today_stats.popular_asanas or []
    }


@router.get("/analytics/user-growth")
def get_user_growth_stats(
    date_range: DateRangeRequest = Depends(),
    current_admin: AdminUser = Depends(require_analytics),
    db: Session = Depends(get_db)
):
    """Get user growth statistics over time"""
    stats = db.query(DailyStat).filter(
        DailyStat.stat_date >= date_range.start_date,
        DailyStat.stat_date <= date_range.end_date
    ).order_by(DailyStat.stat_date).all()
    
    return {"growth_data": stats}


@router.get("/analytics/user-engagement", response_model=UserEngagementStats)
def get_user_engagement_stats(
    current_admin: AdminUser = Depends(require_analytics),
    db: Session = Depends(get_db)
):
    """Get user engagement statistics"""
    total_users = db.query(User).filter(User.is_active == True).count()
    
    # Calculate user status distribution
    active_users = db.query(User).filter(
        User.is_active == True,
        User.last_activity_at > datetime.utcnow() - timedelta(days=7)
    ).count()
    
    inactive_users = db.query(User).filter(
        User.is_active == True,
        User.last_activity_at > datetime.utcnow() - timedelta(days=30),
        User.last_activity_at <= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    dormant_users = total_users - active_users - inactive_users
    
    # Calculate average routines per user
    routine_stats = db.query(
        func.avg(func.coalesce(func.count(Routine.id), 0))
    ).select_from(User).outerjoin(Routine).first()
    
    avg_routines = float(routine_stats[0]) if routine_stats[0] else 0
    
    # Calculate completion rate
    total_routines = db.query(Routine).count()
    completed_routines = db.query(Routine).filter(Routine.is_completed == True).count()
    completion_rate = (completed_routines / total_routines * 100) if total_routines > 0 else 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "dormant_users": dormant_users,
        "avg_routines_per_user": avg_routines,
        "avg_completion_rate": completion_rate
    }


@router.get("/analytics/popular-asanas")
def get_popular_asanas(
    limit: int = Query(10, description="Number of top asanas to return"),
    days: int = Query(30, description="Number of days to analyze"),
    current_admin: AdminUser = Depends(require_analytics),
    db: Session = Depends(get_db)
):
    """Get most popular asanas based on routine usage"""
    # This would require tracking asana usage in routines
    # For now, return mock data structure
    return {"popular_asanas": []}


@router.get("/analytics/routine-stats", response_model=RoutineStats)
def get_routine_stats(
    current_admin: AdminUser = Depends(require_analytics),
    db: Session = Depends(get_db)
):
    """Get routine completion and difficulty statistics"""
    total_routines = db.query(Routine).count()
    completed_routines = db.query(Routine).filter(Routine.is_completed == True).count()
    
    completion_rate = (completed_routines / total_routines * 100) if total_routines > 0 else 0
    
    # Average duration
    avg_duration = db.query(func.avg(Routine.estimated_duration)).scalar() or 0
    
    # Difficulty distribution
    difficulty_dist = db.query(
        Routine.difficulty_level,
        func.count(Routine.id)
    ).group_by(Routine.difficulty_level).all()
    
    difficulty_distribution = {level: count for level, count in difficulty_dist}
    
    return {
        "total_routines": total_routines,
        "completed_routines": completed_routines,
        "completion_rate": completion_rate,
        "avg_duration": float(avg_duration),
        "difficulty_distribution": difficulty_distribution
    }


# Admin Management Endpoints (Super Admin Only)
@router.post("/admins", response_model=AdminUserSchema)
def create_admin(
    admin_data: AdminUserCreate,
    current_admin: AdminUser = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new admin user (Super Admin only)"""
    # Check if admin with email already exists
    existing_admin = db.query(AdminUser).filter(AdminUser.email == admin_data.email).first()
    if existing_admin:
        raise HTTPException(
            status_code=400,
            detail="Admin user with this email already exists"
        )
    
    new_admin = create_admin_user(
        db=db,
        email=admin_data.email,
        name=admin_data.name,
        password=admin_data.password,
        role=admin_data.role,
        created_by_admin_id=current_admin.id
    )
    
    return new_admin


@router.get("/admins", response_model=List[AdminUserSchema])
def get_admins(
    current_admin: AdminUser = Depends(require_admin_management),
    db: Session = Depends(get_db)
):
    """Get list of all admin users"""
    admins = db.query(AdminUser).all()
    return admins


@router.put("/admins/{admin_id}")
def update_admin(
    admin_id: int,
    admin_update: AdminUserUpdate,
    current_admin: AdminUser = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Update admin user (Super Admin only)"""
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Prevent self-deactivation
    if admin_id == current_admin.id and admin_update.is_active is False:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )
    
    update_data = admin_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(admin, field, value)
    
    db.commit()
    db.refresh(admin)
    
    return {"message": "Admin user updated successfully", "admin": admin}
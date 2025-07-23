from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, validator
from ..models.admin import AdminRole


# Admin User Schemas
class AdminUserBase(BaseModel):
    email: EmailStr
    name: str
    role: AdminRole


class AdminUserCreate(AdminUserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None


class AdminUser(AdminUserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login_at: Optional[datetime]
    created_by_admin_id: Optional[int]

    class Config:
        from_attributes = True


class AdminUserLogin(BaseModel):
    email: EmailStr
    password: str


class AdminToken(BaseModel):
    access_token: str
    token_type: str
    admin: AdminUser


# User Activity Schemas
class UserActivityBase(BaseModel):
    activity_type: str
    activity_data: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class UserActivityCreate(UserActivityBase):
    user_id: int


class UserActivity(UserActivityBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# User Management Schemas
class UserStatsResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime]
    login_count: int
    last_activity_at: Optional[datetime]
    total_routines: int
    completed_routines: int
    avg_rating: float
    user_status: str  # active, inactive, dormant

    class Config:
        from_attributes = True


class UserManagementUpdate(BaseModel):
    is_active: Optional[bool] = None
    name: Optional[str] = None


# Analytics Schemas
class DashboardStats(BaseModel):
    total_users: int
    new_users_today: int
    active_users_today: int
    total_sessions_today: int
    total_routines_completed_today: int
    avg_session_duration: float
    popular_asanas: List[Dict[str, Any]]


class UserGrowthStats(BaseModel):
    date: date
    total_users: int
    new_users: int
    active_users: int


class UserEngagementStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    dormant_users: int
    avg_routines_per_user: float
    avg_completion_rate: float


class AsanaPopularityStats(BaseModel):
    asana_id: int
    sanskrit_name: str
    english_name: str
    usage_count: int
    avg_rating: float


class RoutineStats(BaseModel):
    total_routines: int
    completed_routines: int
    completion_rate: float
    avg_duration: float
    difficulty_distribution: Dict[str, int]


class SystemHealthStats(BaseModel):
    database_status: str
    total_users: int
    active_sessions: int
    error_rate: float
    avg_response_time: float


# Daily Stats Schema
class DailyStatsResponse(BaseModel):
    id: int
    stat_date: date
    total_users: int
    new_users: int
    active_users: int
    total_sessions: int
    total_routines_completed: int
    avg_session_duration_minutes: float
    popular_asanas: Optional[List[Dict[str, Any]]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Filter and Pagination Schemas
class UserFiltersRequest(BaseModel):
    is_active: Optional[bool] = None
    user_status: Optional[str] = None  # active, inactive, dormant
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    has_completed_routines: Optional[bool] = None
    min_login_count: Optional[int] = None


class PaginationRequest(BaseModel):
    page: int = 1
    page_size: int = 50
    
    @validator('page')
    def validate_page(cls, v):
        if v < 1:
            raise ValueError('Page must be greater than 0')
        return v
    
    @validator('page_size')
    def validate_page_size(cls, v):
        if v < 1 or v > 100:
            raise ValueError('Page size must be between 1 and 100')
        return v


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class DateRangeRequest(BaseModel):
    start_date: date
    end_date: date
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('End date must be after start date')
        return v


# Admin Activity Log Schema
class AdminActivityLog(BaseModel):
    admin_id: int
    admin_name: str
    action: str
    target_type: str  # user, admin, system
    target_id: Optional[int]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
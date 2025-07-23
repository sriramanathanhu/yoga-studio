from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Date, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import INET, JSONB
from ..database.database import Base


class AdminRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    MODERATOR = "moderator"
    ANALYST = "analyst"


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default=AdminRole.ANALYST)
    is_active = Column(Boolean, default=True, index=True)
    created_by_admin_id = Column(Integer, ForeignKey("admin_users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))

    # Relationships
    created_by = relationship("AdminUser", remote_side=[id])

    def has_permission(self, permission: str) -> bool:
        """Check if admin user has specific permission based on role"""
        permissions = {
            AdminRole.SUPER_ADMIN: [
                "user_management", "admin_management", "system_settings", 
                "analytics", "content_management", "all_permissions"
            ],
            AdminRole.MODERATOR: [
                "user_management", "content_management", "analytics"
            ],
            AdminRole.ANALYST: [
                "analytics", "view_users"
            ]
        }
        
        user_permissions = permissions.get(self.role, [])
        return permission in user_permissions or "all_permissions" in user_permissions

    def can_manage_user(self, target_admin_id: int = None) -> bool:
        """Check if admin can manage another admin user"""
        if self.role == AdminRole.SUPER_ADMIN:
            return True
        if self.role == AdminRole.MODERATOR and target_admin_id:
            # Moderators can only manage analysts they created
            return self.created_by_admin_id == self.id
        return False


class UserActivity(Base):
    __tablename__ = "user_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False, index=True)
    activity_data = Column(JSONB)  # Additional activity-specific data
    ip_address = Column(INET)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    ip_address = Column(INET)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    last_accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    user = relationship("User")


class DailyStat(Base):
    __tablename__ = "daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    stat_date = Column(Date, unique=True, nullable=False, index=True)
    total_users = Column(Integer, default=0)
    new_users = Column(Integer, default=0)
    active_users = Column(Integer, default=0)  # Users who logged in on this day
    total_sessions = Column(Integer, default=0)
    total_routines_completed = Column(Integer, default=0)
    avg_session_duration_minutes = Column(DECIMAL(10, 2), default=0)
    popular_asanas = Column(JSONB)  # Top 10 asanas used this day
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Activity type constants for consistency
class ActivityType:
    LOGIN = "login"
    LOGOUT = "logout"
    PRACTICE_START = "practice_start"
    PRACTICE_COMPLETE = "practice_complete"
    ROUTINE_CREATE = "routine_create"
    ROUTINE_COMPLETE = "routine_complete"
    ASANA_VIEW = "asana_view"
    PROFILE_UPDATE = "profile_update"
    FEEDBACK_SUBMIT = "feedback_submit"
    PASSWORD_CHANGE = "password_change"
    ACCOUNT_DEACTIVATE = "account_deactivate"
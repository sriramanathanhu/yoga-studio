from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status, Depends, Request, Cookie
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models.admin import AdminUser, AdminRole
from .security import verify_password, get_password_hash, create_access_token, verify_token

# Admin-specific JWT token configuration
ADMIN_TOKEN_PREFIX = "admin_"
ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

security = HTTPBearer()


def get_admin_by_email(db: Session, email: str) -> Optional[AdminUser]:
    """Get admin user by email"""
    return db.query(AdminUser).filter(AdminUser.email == email, AdminUser.is_active == True).first()


def authenticate_admin(db: Session, email: str, password: str) -> Optional[AdminUser]:
    """Authenticate admin user with email and password"""
    admin = get_admin_by_email(db, email)
    if not admin:
        return None
    if not verify_password(password, admin.hashed_password):
        return None
    return admin


def create_admin_user(db: Session, email: str, name: str, password: str, role: AdminRole, created_by_admin_id: int) -> AdminUser:
    """Create a new admin user"""
    hashed_password = get_password_hash(password)
    admin_user = AdminUser(
        email=email,
        name=name,
        hashed_password=hashed_password,
        role=role,
        created_by_admin_id=created_by_admin_id
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return admin_user


def create_admin_access_token(admin_email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create access token specifically for admin users"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add admin prefix to distinguish from regular user tokens
    to_encode = {"sub": f"{ADMIN_TOKEN_PREFIX}{admin_email}", "exp": expire, "type": "admin"}
    return create_access_token(data=to_encode, expires_delta=expires_delta)


def verify_admin_token(token: str) -> Optional[str]:
    """Verify admin token and return admin email"""
    try:
        email = verify_token(token)
        if email and email.startswith(ADMIN_TOKEN_PREFIX):
            return email[len(ADMIN_TOKEN_PREFIX):]  # Remove admin prefix
        return None
    except Exception:
        return None


def get_admin_token_from_cookie_or_header(
    request: Request,
    admin_access_token: Optional[str] = Cookie(None)
) -> Optional[str]:
    """Extract admin token from httpOnly cookie or Authorization header"""
    # Try cookie first (more secure)
    if admin_access_token:
        return admin_access_token
    
    # Manual fallback: try to extract from request.cookies directly
    manual_token = request.cookies.get("admin_access_token")
    if manual_token:
        return manual_token
    
    # Try Authorization header as fallback
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        header_token = auth_header.split(" ")[1]
        return header_token
    
    return None


def get_current_admin_user(
    token: Optional[str] = Depends(get_admin_token_from_cookie_or_header),
    db: Session = Depends(get_db)
) -> AdminUser:
    """Get current authenticated admin user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    admin_email = verify_admin_token(token)
    if admin_email is None:
        raise credentials_exception
    
    admin = get_admin_by_email(db, email=admin_email)
    if admin is None:
        raise credentials_exception
    
    # Update last login time
    admin.last_login_at = datetime.utcnow()
    db.commit()
    
    return admin


def require_admin_permission(permission: str):
    """Decorator to require specific admin permission"""
    def permission_dependency(current_admin: AdminUser = Depends(get_current_admin_user)):
        if not current_admin.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {permission}"
            )
        return current_admin
    return permission_dependency


def require_admin_role(required_role: AdminRole):
    """Decorator to require specific admin role"""
    def role_dependency(current_admin: AdminUser = Depends(get_current_admin_user)):
        if current_admin.role != required_role and current_admin.role != AdminRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient role. Required: {required_role}"
            )
        return current_admin
    return role_dependency


# Convenience dependencies for common permissions
require_user_management = require_admin_permission("user_management")
require_admin_management = require_admin_permission("admin_management")
require_analytics = require_admin_permission("analytics")
require_content_management = require_admin_permission("content_management")
require_system_settings = require_admin_permission("system_settings")

# Role-based dependencies
require_super_admin = require_admin_role(AdminRole.SUPER_ADMIN)
require_moderator_or_above = lambda admin: admin.role in [AdminRole.MODERATOR, AdminRole.SUPER_ADMIN]
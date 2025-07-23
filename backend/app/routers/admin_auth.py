from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..database.database import get_db
from ..models.admin import AdminUser, AdminRole
from ..schemas.admin import AdminUserLogin, AdminToken, AdminUser as AdminUserSchema
from ..core.admin_security import (
    authenticate_admin, 
    create_admin_access_token, 
    get_current_admin_user,
    ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES
)
from ..core.validation import InputValidator

router = APIRouter(prefix="/admin/auth", tags=["admin-authentication"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=AdminToken)
@limiter.limit("3/minute")
def admin_login(
    request: Request,
    admin_login: AdminUserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """Admin user login with enhanced security"""
    # Validate and sanitize email input
    validated_email = InputValidator.validate_email(admin_login.email)
    
    admin = authenticate_admin(db, validated_email, admin_login.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account is deactivated",
        )
    
    access_token_expires = timedelta(minutes=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_admin_access_token(
        admin_email=admin.email, 
        expires_delta=access_token_expires
    )
    
    # Set httpOnly cookie for admin session
    response.set_cookie(
        key="admin_access_token",
        value=access_token,
        max_age=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=False,  # Allow over HTTP for development
        samesite="lax",
        path="/",
        domain=None
    )
    
    # Update last login time is handled in get_current_admin_user
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": admin
    }


@router.post("/login-form", response_model=AdminToken)
@limiter.limit("3/minute")
def admin_login_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    response: Response = None,
    db: Session = Depends(get_db)
):
    """Admin login using OAuth2 form data (for Swagger UI)"""
    admin = authenticate_admin(db, form_data.username, form_data.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account is deactivated",
        )
    
    access_token_expires = timedelta(minutes=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_admin_access_token(
        admin_email=admin.email,
        expires_delta=access_token_expires
    )
    
    # Set httpOnly cookie for admin session
    if response:
        response.set_cookie(
            key="admin_access_token",
            value=access_token,
            max_age=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            secure=False,  # Allow over HTTP for development
            samesite="lax",
            path="/",
            domain=None
        )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": admin
    }


@router.get("/me", response_model=AdminUserSchema)
def get_current_admin(current_admin: AdminUser = Depends(get_current_admin_user)):
    """Get current admin user information"""
    return current_admin


@router.post("/logout")
def admin_logout(response: Response):
    """Clear the admin httpOnly authentication cookie"""
    response.delete_cookie(
        key="admin_access_token",
        httponly=True,
        secure=False,  # Match login cookie settings
        samesite="lax",
        path="/",
        domain=None
    )
    return {"message": "Admin successfully logged out"}


@router.post("/verify-token")
def verify_admin_token(current_admin: AdminUser = Depends(get_current_admin_user)):
    """Verify admin token validity"""
    return {
        "valid": True,
        "admin_id": current_admin.id,
        "admin_email": current_admin.email,
        "role": current_admin.role
    }
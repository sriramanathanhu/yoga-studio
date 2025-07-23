from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from ..database.database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserLogin, Token, User as UserSchema
from ..core.security import verify_password, get_password_hash, create_access_token, verify_token
from ..core.config import settings
from ..core.validation import validate_user_input, InputValidator

router = APIRouter(prefix="/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
limiter = Limiter(key_func=get_remote_address)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def get_token_from_cookie_or_header(
    request: Request,
    access_token: Optional[str] = Cookie(None)
):
    """Extract token from httpOnly cookie or Authorization header"""
    # Debug: Let's see what we're getting
    print(f"DEBUG: Cookie access_token = {access_token}")
    print(f"DEBUG: All cookies = {request.cookies}")
    
    # Try cookie first (more secure)
    if access_token:
        print(f"DEBUG: Using cookie token")
        return access_token
    
    # Manual fallback: try to extract from request.cookies directly
    manual_token = request.cookies.get("access_token")
    if manual_token:
        print(f"DEBUG: Using manual cookie extraction: {manual_token[:20]}...")
        return manual_token
    
    # Try Authorization header as fallback
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        header_token = auth_header.split(" ")[1]
        print(f"DEBUG: Using header token: {header_token[:20]}...")
        return header_token
        
    print(f"DEBUG: No token found")
    return None

def get_current_user(
    token: Optional[str] = Depends(get_token_from_cookie_or_header), 
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
@limiter.limit("3/minute")
def register(request: Request, user: UserCreate, response: Response, db: Session = Depends(get_db)):
    # Validate and sanitize all inputs
    validated_email, validated_name, validated_password = validate_user_input(
        user.email, user.name, user.password
    )
    
    # Check if email already exists
    db_user = get_user_by_email(db, email=validated_email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create user with validated inputs
    validated_user = UserCreate(
        email=validated_email,
        name=validated_name,
        password=validated_password
    )
    new_user = create_user(db, validated_user)
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    # Set httpOnly cookie with development-friendly settings
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=False,  # Allow over HTTP for development
        samesite="lax",  # More permissive for reverse proxy
        path="/",
        domain=None
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    response: Response = None,
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Set httpOnly cookie with development-friendly settings (match login-json)
    if response:
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=settings.access_token_expire_minutes * 60,
            httponly=True,
            secure=False,  # Allow over HTTP for development
            samesite="lax",  # More permissive for reverse proxy
            path="/",
            domain=None
        )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login-json", response_model=Token)
@limiter.limit("5/minute")
def login_json(request: Request, user_login: UserLogin, response: Response, db: Session = Depends(get_db)):
    # Validate and sanitize email input
    validated_email = InputValidator.validate_email(user_login.email)
    
    user = authenticate_user(db, validated_email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Set httpOnly cookie with development-friendly settings
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=False,  # Allow over HTTP for development
        samesite="lax",  # More permissive for reverse proxy
        path="/",
        domain=None
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(response: Response):
    """Clear the httpOnly authentication cookie"""
    # Delete httpOnly cookie with matching configuration
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=False,  # Match login cookie settings
        samesite="lax",
        path="/",
        domain=None
    )
    return {"message": "Successfully logged out"}
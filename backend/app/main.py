from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .database.database import engine, Base
from .routers import auth, profile, routines, dashboard, asanas, admin_auth
from .routers import admin as admin_router
# Import all models to ensure they're registered before creating tables
from .models import user, asana, routine, admin
from .core.config import settings
from .core.logging import setup_logging, app_logger
from .core.monitoring import RequestMonitoring, ErrorHandler, health_check

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    setup_logging()
    app_logger.info("Yoga AI API starting up")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    app_logger.info("Database tables created/verified")
    
    yield
    
    # Shutdown
    app_logger.info("Yoga AI API shutting down")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Yoga AI API",
    description="AI-personalized yoga and wellness application backend",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS with environment-specific origins
allowed_origins = [
    "https://yogastudio.ecitizen.media",
    "http://localhost:3000",  # For development
    "http://127.0.0.1:3000",  # For development
]

# In development, allow localhost
if settings.environment == "development":
    allowed_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Add monitoring middleware
app.add_middleware(RequestMonitoring)

# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return ErrorHandler.handle_generic_error(exc)

# Include routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(routines.router)
app.include_router(dashboard.router)
app.include_router(asanas.router, prefix="/asanas", tags=["asanas"])

# Admin routers
app.include_router(admin_auth.router)
app.include_router(admin_router.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Yoga AI API", "version": "1.0.0"}

@app.get("/health")
async def health_check_endpoint():
    return await health_check()
"""
Application monitoring and error tracking
"""
import time
import uuid
from typing import Callable, Dict, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging
from .logging import api_logger, app_logger

class RequestMonitoring:
    """Middleware for request monitoring and logging"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Generate request ID
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Extract request info
        request = Request(scope, receive)
        method = request.method
        url = str(request.url)
        user_agent = request.headers.get("user-agent", "")
        
        # Log request start
        api_logger.info(
            f"Request started: {method} {url}",
            extra={
                "request_id": request_id,
                "method": method,
                "endpoint": url,
                "user_agent": user_agent
            }
        )
        
        # Add request ID to scope for downstream use
        scope["request_id"] = request_id
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Calculate duration
                duration = round((time.time() - start_time) * 1000, 2)  # ms
                status_code = message["status"]
                
                # Log request completion
                log_level = logging.INFO if status_code < 400 else logging.ERROR
                api_logger.log(
                    log_level,
                    f"Request completed: {method} {url} - {status_code}",
                    extra={
                        "request_id": request_id,
                        "method": method,
                        "endpoint": url,
                        "status_code": status_code,
                        "duration": duration
                    }
                )
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)

class ErrorHandler:
    """Global error handler for the application"""
    
    @staticmethod
    def handle_validation_error(error) -> JSONResponse:
        """Handle validation errors"""
        app_logger.error(
            f"Validation error: {error}",
            extra={"error_type": "validation"}
        )
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "errors": error.errors() if hasattr(error, 'errors') else str(error)
            }
        )
    
    @staticmethod
    def handle_database_error(error) -> JSONResponse:
        """Handle database errors"""
        app_logger.error(
            f"Database error: {error}",
            extra={"error_type": "database"},
            exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Database error occurred",
                "error_id": str(uuid.uuid4())
            }
        )
    
    @staticmethod
    def handle_authentication_error(error) -> JSONResponse:
        """Handle authentication errors"""
        app_logger.warning(
            f"Authentication error: {error}",
            extra={"error_type": "authentication"}
        )
        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication failed"}
        )
    
    @staticmethod
    def handle_authorization_error(error) -> JSONResponse:
        """Handle authorization errors"""
        app_logger.warning(
            f"Authorization error: {error}",
            extra={"error_type": "authorization"}
        )
        return JSONResponse(
            status_code=403,
            content={"detail": "Insufficient permissions"}
        )
    
    @staticmethod
    def handle_generic_error(error) -> JSONResponse:
        """Handle generic errors"""
        error_id = str(uuid.uuid4())
        app_logger.error(
            f"Unhandled error: {error}",
            extra={
                "error_type": "unhandled",
                "error_id": error_id
            },
            exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error_id": error_id
            }
        )

def log_user_action(user_id: int, action: str, details: Dict[str, Any] = None):
    """Log user actions for audit trail"""
    app_logger.info(
        f"User action: {action}",
        extra={
            "user_id": user_id,
            "action": action,
            "details": details or {}
        }
    )

def log_security_event(event_type: str, details: Dict[str, Any] = None):
    """Log security-related events"""
    app_logger.warning(
        f"Security event: {event_type}",
        extra={
            "event_type": "security",
            "security_event": event_type,
            "details": details or {}
        }
    )

# Health check endpoint
async def health_check():
    """Health check endpoint with monitoring"""
    try:
        # Add any health checks here (database, external services, etc.)
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": "1.0.0"
        }
    except Exception as e:
        app_logger.error(f"Health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "timestamp": time.time(),
            "error": str(e)
        }
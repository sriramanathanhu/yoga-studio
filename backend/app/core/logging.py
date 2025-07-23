"""
Structured logging configuration for Yoga AI application
"""
import logging
import sys
import os
from datetime import datetime
from typing import Dict, Any
import json
from pathlib import Path

class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'endpoint'):
            log_entry["endpoint"] = record.endpoint
        if hasattr(record, 'method'):
            log_entry["method"] = record.method
        if hasattr(record, 'status_code'):
            log_entry["status_code"] = record.status_code
        if hasattr(record, 'duration'):
            log_entry["duration"] = record.duration
            
        return json.dumps(log_entry)

def setup_logging() -> None:
    """Setup structured logging for the application"""
    
    # Create logs directory with proper permissions
    log_dir = Path("/app/logs")
    log_dir.mkdir(exist_ok=True, mode=0o755)
    
    # Ensure we can write to the logs directory
    if not log_dir.is_dir() or not os.access(log_dir, os.W_OK):
        # Fallback to /tmp if logs directory is not writable
        log_dir = Path("/tmp")
        print(f"Warning: Using {log_dir} for logs due to permission issues")
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Remove default handlers
    root_logger.handlers.clear()
    
    # Console handler with structured formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = StructuredFormatter()
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler for application logs
    file_handler = logging.FileHandler(log_dir / "app.log")
    file_handler.setLevel(logging.INFO)
    file_formatter = StructuredFormatter()
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.FileHandler(log_dir / "error.log")
    error_handler.setLevel(logging.ERROR)
    error_formatter = StructuredFormatter()
    error_handler.setFormatter(error_formatter)
    root_logger.addHandler(error_handler)
    
    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(name)

# Application loggers
app_logger = get_logger("yoga_ai.app")
auth_logger = get_logger("yoga_ai.auth")
api_logger = get_logger("yoga_ai.api")
db_logger = get_logger("yoga_ai.database")
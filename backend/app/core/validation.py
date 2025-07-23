"""
Enhanced input validation and sanitization module
Provides secure validation for user inputs to prevent XSS, injection attacks
"""

import re
import bleach
from typing import Optional, Any
from fastapi import HTTPException, status


class InputValidator:
    """Enhanced input validation and sanitization"""
    
    # Allowed HTML tags and attributes for rich text content
    ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li']
    ALLOWED_ATTRIBUTES = {}
    
    # Regex patterns for validation
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    NAME_PATTERN = re.compile(r'^[a-zA-Z\s\-\'\.]{2,50}$')
    PASSWORD_PATTERN = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$')
    
    @classmethod
    def sanitize_html(cls, text: str) -> str:
        """Sanitize HTML content to prevent XSS attacks"""
        if not text:
            return ""
        
        # Clean HTML with bleach
        cleaned = bleach.clean(
            text,
            tags=cls.ALLOWED_TAGS,
            attributes=cls.ALLOWED_ATTRIBUTES,
            strip=True
        )
        
        return cleaned.strip()
    
    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """Sanitize plain text input"""
        if not text:
            return ""
        
        # Remove any HTML tags completely for plain text
        cleaned = bleach.clean(text, tags=[], strip=True)
        
        # Remove excessive whitespace
        cleaned = ' '.join(cleaned.split())
        
        return cleaned.strip()
    
    @classmethod
    def validate_email(cls, email: str) -> str:
        """Validate and sanitize email address"""
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )
        
        # Sanitize and normalize
        email = cls.sanitize_text(email).lower()
        
        # Validate format
        if not cls.EMAIL_PATTERN.match(email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        
        # Length check
        if len(email) > 254:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address too long"
            )
        
        return email
    
    @classmethod
    def validate_name(cls, name: str) -> str:
        """Validate and sanitize user name"""
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name is required"
            )
        
        # Sanitize
        name = cls.sanitize_text(name)
        
        # Validate format
        if not cls.NAME_PATTERN.match(name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name must contain only letters, spaces, hyphens, apostrophes, and periods (2-50 characters)"
            )
        
        return name
    
    @classmethod
    def validate_password(cls, password: str) -> str:
        """Validate password strength"""
        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required"
            )
        
        # Check length
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        if len(password) > 128:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password too long (max 128 characters)"
            )
        
        # Check complexity
        if not cls.PASSWORD_PATTERN.match(password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter, one lowercase letter, and one number"
            )
        
        # Check for common weak passwords
        weak_passwords = [
            'password', '12345678', 'qwerty123', 'admin123',
            'password123', 'letmein123', 'welcome123'
        ]
        
        if password.lower() in weak_passwords:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too common. Please choose a stronger password"
            )
        
        return password
    
    @classmethod
    def validate_text_input(cls, text: str, field_name: str, max_length: int = 1000, allow_html: bool = False) -> str:
        """Validate and sanitize general text input"""
        if not text:
            return ""
        
        # Sanitize based on HTML allowance
        if allow_html:
            text = cls.sanitize_html(text)
        else:
            text = cls.sanitize_text(text)
        
        # Length validation
        if len(text) > max_length:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} exceeds maximum length of {max_length} characters"
            )
        
        return text
    
    @classmethod
    def validate_integer(cls, value: Any, field_name: str, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
        """Validate integer input with optional range checking"""
        try:
            int_val = int(value)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be a valid integer"
            )
        
        if min_val is not None and int_val < min_val:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be at least {min_val}"
            )
        
        if max_val is not None and int_val > max_val:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be at most {max_val}"
            )
        
        return int_val


def validate_user_input(email: str, name: str, password: str) -> tuple[str, str, str]:
    """Convenience function to validate all user registration inputs"""
    validated_email = InputValidator.validate_email(email)
    validated_name = InputValidator.validate_name(name)
    validated_password = InputValidator.validate_password(password)
    
    return validated_email, validated_name, validated_password
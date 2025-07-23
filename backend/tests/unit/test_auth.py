"""
Unit tests for authentication functionality
"""
import pytest
from app.core.security import create_access_token, verify_password, get_password_hash

class TestAuthSecurity:
    """Test authentication security functions"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False
    
    def test_access_token_creation(self):
        """Test JWT token creation"""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
        assert "." in token  # JWT has dots as separators
    
    def test_access_token_with_expiry(self):
        """Test JWT token creation with custom expiry"""
        from datetime import timedelta
        
        data = {"sub": "test@example.com"}
        token = create_access_token(data, expires_delta=timedelta(minutes=15))
        
        assert isinstance(token, str)
        assert len(token) > 0
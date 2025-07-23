"""
Integration tests for authentication API endpoints
"""
import pytest

class TestAuthAPI:
    """Test authentication API endpoints"""
    
    def test_user_registration(self, client, sample_user_data):
        """Test user registration endpoint"""
        response = client.post("/auth/register", json=sample_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user_data["email"]
        assert data["name"] == sample_user_data["name"]
        assert "id" in data
    
    def test_user_registration_duplicate_email(self, client, sample_user_data):
        """Test registration with duplicate email"""
        # Register user first time
        client.post("/auth/register", json=sample_user_data)
        
        # Try to register again with same email
        response = client.post("/auth/register", json=sample_user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
    
    def test_user_login(self, client, sample_user_data):
        """Test user login endpoint"""
        # Register user first
        client.post("/auth/register", json=sample_user_data)
        
        # Login
        login_data = {
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        }
        response = client.post("/auth/login-json", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == sample_user_data["email"]
    
    def test_user_login_invalid_credentials(self, client, sample_user_data):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        response = client.post("/auth/login-json", json=login_data)
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_protected_route_without_token(self, client):
        """Test accessing protected route without token"""
        response = client.get("/auth/me")
        
        assert response.status_code == 401
    
    def test_protected_route_with_token(self, client, sample_user_data):
        """Test accessing protected route with valid token"""
        # Register and login to get token
        client.post("/auth/register", json=sample_user_data)
        login_response = client.post("/auth/login-json", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Access protected route
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user_data["email"]
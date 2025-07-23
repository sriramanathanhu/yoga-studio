"""
Integration tests for asanas API endpoints
"""
import pytest
from app.models.asana import Asana

class TestAsanasAPI:
    """Test asanas API endpoints"""
    
    def test_get_asanas_requires_auth(self, client):
        """Test that asanas endpoint requires authentication"""
        response = client.get("/asanas/")
        assert response.status_code == 401
    
    def test_get_asanas_with_auth(self, client, sample_user_data, test_db, sample_asana_data):
        """Test getting asanas with authentication"""
        # Register and login
        client.post("/auth/register", json=sample_user_data)
        login_response = client.post("/auth/login-json", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Add test asana to database
        asana = Asana(**sample_asana_data)
        test_db.add(asana)
        test_db.commit()
        
        # Get asanas
        response = client.get("/asanas/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["english_name"] == sample_asana_data["english_name"]
    
    def test_get_asanas_pagination(self, client, sample_user_data, test_db):
        """Test asanas pagination"""
        # Register and login
        client.post("/auth/register", json=sample_user_data)
        login_response = client.post("/auth/login-json", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Add multiple test asanas
        for i in range(5):
            asana = Asana(
                english_name=f"Test Pose {i}",
                difficulty_level="beginner",
                goal_tags=["flexibility"]
            )
            test_db.add(asana)
        test_db.commit()
        
        # Test pagination
        response = client.get("/asanas/?skip=0&limit=3", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    def test_get_asanas_filter_by_difficulty(self, client, sample_user_data, test_db):
        """Test filtering asanas by difficulty"""
        # Register and login
        client.post("/auth/register", json=sample_user_data)
        login_response = client.post("/auth/login-json", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Add asanas with different difficulties
        beginner_asana = Asana(english_name="Beginner Pose", difficulty_level="beginner", goal_tags=[])
        advanced_asana = Asana(english_name="Advanced Pose", difficulty_level="advanced", goal_tags=[])
        test_db.add(beginner_asana)
        test_db.add(advanced_asana)
        test_db.commit()
        
        # Filter by difficulty
        response = client.get("/asanas/?difficulty=beginner", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["difficulty_level"] == "beginner"
    
    def test_get_single_asana(self, client, sample_user_data, test_db, sample_asana_data):
        """Test getting a single asana by ID"""
        # Register and login
        client.post("/auth/register", json=sample_user_data)
        login_response = client.post("/auth/login-json", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Add test asana
        asana = Asana(**sample_asana_data)
        test_db.add(asana)
        test_db.commit()
        test_db.refresh(asana)
        
        # Get single asana
        response = client.get(f"/asanas/{asana.id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == asana.id
        assert data["english_name"] == sample_asana_data["english_name"]
    
    def test_get_nonexistent_asana(self, client, sample_user_data):
        """Test getting a non-existent asana"""
        # Register and login
        client.post("/auth/register", json=sample_user_data)
        login_response = client.post("/auth/login-json", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to get non-existent asana
        response = client.get("/asanas/99999", headers=headers)
        
        assert response.status_code == 404
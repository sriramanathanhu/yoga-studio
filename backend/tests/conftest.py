"""
Pytest configuration and fixtures for the Yoga AI application
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import tempfile
import os

from app.main import app
from app.database.database import Base, get_db
from app.core.config import settings

# Test database URL - use SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine"""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    # Cleanup
    try:
        os.remove("./test.db")
    except FileNotFoundError:
        pass

@pytest.fixture(scope="function")
def test_db(test_engine):
    """Create a test database session"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client"""
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }

@pytest.fixture
def sample_asana_data():
    """Sample asana data for testing"""
    return {
        "english_name": "Test Pose",
        "sanskrit_name": "Test Asana",
        "description": "A test yoga pose",
        "goal_tags": ["flexibility", "strength"],
        "difficulty_level": "beginner",
        "time_minutes": 5,
        "sequence_stage": "standing"
    }
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))
    login_count = Column(Integer, default=0)
    last_activity_at = Column(DateTime(timezone=True))

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    routines = relationship("Routine", back_populates="user")
    feedback = relationship("Feedback", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    goals = Column(JSON)  # List of goal strings
    fitness_level = Column(String)  # beginner, intermediate, advanced
    physical_limitations = Column(Text)
    time_preference = Column(Integer, default=30)  # minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="profile")
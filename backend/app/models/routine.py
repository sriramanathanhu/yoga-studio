from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, Float, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.database import Base

class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    poses = Column(JSON)  # List of pose objects
    estimated_duration = Column(Integer)  # minutes
    difficulty_level = Column(String, index=True)
    focus_areas = Column(JSON)  # List of focus area strings
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="routines")
    feedback = relationship("Feedback", back_populates="routine", uselist=False)
    
    # Define composite indexes
    __table_args__ = (
        Index('idx_routines_user_created', user_id, created_at.desc()),
        Index('idx_routines_completed_partial', completed_at, postgresql_where=completed_at.isnot(None)),
    )

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    routine_id = Column(Integer, ForeignKey("routines.id"), index=True, nullable=False)
    rating = Column(Integer, index=True)  # 1-5 stars
    comment = Column(Text)
    difficulty_feedback = Column(String, index=True)  # too_easy, just_right, too_hard
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="feedback")
    routine = relationship("Routine", back_populates="feedback")
    
    # Define composite indexes
    __table_args__ = (
        Index('idx_feedback_user_created', user_id, created_at.desc()),
    )
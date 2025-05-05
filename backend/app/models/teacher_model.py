from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
# from models.models import Profile  # Удаляем импорт
from db import Base

class TeacherSession(Base):
    __tablename__ = "teacher_sessions"
    __table_args__ = {"schema": "teacher"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=True)
    topic = Column(String(255), nullable=True)
    level = Column(String(50), nullable=True)  # beginner, intermediate, advanced
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    selected_document_id = Column(Integer, ForeignKey("documents.documents.id"), nullable=True)
    
    # Если потребуется связь с Profile:
    # user = relationship("Profile")
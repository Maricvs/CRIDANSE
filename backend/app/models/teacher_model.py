from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
# from models.models import Profile  # Удаляем импорт
from db import Base

class TeacherSession(Base):
    __tablename__ = "teacher_sessions"
    __table_args__ = {"schema": "teacher"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    topic = Column(String(255), nullable=True)
    level = Column(String(50), nullable=True)  # beginner, intermediate, advanced
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    selected_document_id = Column(Integer, ForeignKey("documents.documents.id"), nullable=True)

    progress = relationship(
        "TeacherProgress",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # Если потребуется связь с Profile:
    # user = relationship("Profile")


class TeacherProgress(Base):
    __tablename__ = "teacher_progress"
    __table_args__ = {"schema": "teacher"}

    id = Column(Integer, primary_key=True, index=True)
    teacher_session_id = Column(
        Integer,
        ForeignKey("teacher.teacher_sessions.id"),
        nullable=False,
        unique=True,
    )
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    status = Column(String(32), nullable=False, default="active")
    current_objective = Column(String(512), nullable=True)
    completion_estimate = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session = relationship("TeacherSession", back_populates="progress")
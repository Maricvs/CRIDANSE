from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, func, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import TIMESTAMP
from sqlalchemy.sql import func
from db import Base
# Импорт TeacherSession для связи
from app.models.teacher_model import TeacherSession

# Таблица users.profiles
class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = {"schema": "users"}

    id = Column(Integer, primary_key=True, index=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="active", nullable=False)
    oauth_provider = Column(String(50), nullable=False)
    provider_user_id = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    avatar_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 🔧 ДОБАВЛЕНО: связь с сообщениями
    messages = relationship("Message", back_populates="user")
    # 🔧 ДОБАВЛЕНО: связь с документами
    documents = relationship("Document", back_populates="user")
    chat_folders = relationship("ChatFolder", back_populates="user", cascade="all, delete-orphan")

# Таблица chats.messages
class Message(Base):
    __tablename__ = "messages"
    __table_args__ = {"schema": "chats"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    chat_id = Column(Integer, ForeignKey("chats.chats.id"), nullable=False)
    role = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # ✅ ЭТА СТРОКА УЖЕ ЕСТЬ:
    chat = relationship("Chat", back_populates="messages")

    # 🔧 ДОБАВЛЕНО: связь с Profile (user)
    user = relationship("Profile", back_populates="messages")

# Таблица chats.folders
class ChatFolder(Base):
    __tablename__ = "folders"
    __table_args__ = {"schema": "chats"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("Profile", back_populates="chat_folders")
    chats = relationship("Chat", back_populates="folder")

# Таблица chats.chats
class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = {"schema": "chats"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    title = Column(String(255), nullable=False, default="Новый чат")
    is_teacher_chat = Column(Boolean, default=False, nullable=False)
    teacher_session_id = Column(Integer, ForeignKey("teacher.teacher_sessions.id"), nullable=True)
    folder_id = Column(Integer, ForeignKey("chats.folders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="chat", cascade="all, delete")
    teacher_session = relationship("TeacherSession", foreign_keys=[teacher_session_id])
    folder = relationship("ChatFolder", back_populates="chats")

# Таблица documents.documents
class Document(Base):
    __tablename__ = "documents"
    __table_args__ = {"schema": "documents"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String(512), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связь с пользователем
    user = relationship("Profile", back_populates="documents")
    # Связь с чанками
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

# Таблица documents.document_chunks
class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = {"schema": "documents"}

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.documents.id"), nullable=False)
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    embedding = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связь с документом
    document = relationship("Document", back_populates="chunks")

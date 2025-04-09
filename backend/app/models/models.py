from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from db import Base
from datetime import datetime

class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = {"schema": "users"}

    id = Column(Integer, primary_key=True, index=True)
    oauth_provider = Column(String(50), nullable=False)
    provider_user_id = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    avatar_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    documents = relationship("Document", back_populates="user")

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
    file_path = Column(String(255), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связь с пользователем
    user = relationship("Profile", back_populates="documents")
    # Связь с чанками
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = {"schema": "documents"}

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.documents.id"), nullable=False)
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    embedding = Column(Text, nullable=False)  # Храним эмбеддинг как JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связь с документом
    document = relationship("Document", back_populates="chunks") 
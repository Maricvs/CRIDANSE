from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from db import Base

class Document(Base):
    __tablename__ = "documents"
    __table_args__ = {"schema": "documents"}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.profiles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Добавляем связь с чанками
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = {"schema": "documents"}

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.documents.id"), nullable=False)
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    embedding = Column(JSON, nullable=False)  # Храним эмбеддинг как JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Добавляем связь с документом
    document = relationship("Document", back_populates="chunks") 
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from db import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 
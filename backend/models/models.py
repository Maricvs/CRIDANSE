# backend/models/models.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

# Таблица users.profiles
class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = {"schema": "users"}

    id = Column(Integer, primary_key=True, index=True)
    oauth_provider = Column(String(50), nullable=False)
    provider_user_id = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    full_name = Column(String(255))
    avatar_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="user")


# Таблица chats.messages
class Message(Base):
    __tablename__ = "messages"
    __table_args__ = {"schema": "chats"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user / assistant
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("Profile", back_populates="messages")

# Таблица chats.chats
class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = {"schema": "chats"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    title = Column(String(255), nullable=False, default="Новый чат")
    created_at = Column(DateTime, default=datetime.utcnow)

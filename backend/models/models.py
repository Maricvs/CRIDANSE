# backend/models/models.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from sqlalchemy import TIMESTAMP
from sqlalchemy.sql import func

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

    # 🔧 ДОБАВЛЕНО: связь с сообщениями
    messages = relationship("Message", back_populates="user")

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

# Таблица chats.chats
class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = {"schema": "chats"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.profiles.id"), nullable=False)
    title = Column(String(255), nullable=False, default="Новый чат")
    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ ЭТА СТРОКА УЖЕ ЕСТЬ:
    messages = relationship("Message", back_populates="chat", cascade="all, delete")

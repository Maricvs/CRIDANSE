from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db import SessionLocal
from typing import List
from models.models import Message
from fastapi.responses import JSONResponse

router = APIRouter()

class MessageCreate(BaseModel):
    user_id: int
    chat_id: int
    role: str
    message: str


@router.post("/message")
def save_message(msg: MessageCreate):
    db: Session = SessionLocal()
    try:
        new_msg = Message(**msg.dict())
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        return {"message": "Saved", "id": new_msg.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.get("/messages/{user_id}")
def get_user_messages(user_id: int):
    db: Session = SessionLocal()
    try:
        messages = db.query(Message).filter(Message.user_id == user_id).order_by(Message.created_at).all()
        return [
            {
                "id": msg.id,
                "role": msg.role,
                "message": msg.message,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

from models.models import Chat

# Получить все чаты пользователя
@router.get("/{user_id}")
def get_chats(user_id: int):
    db: Session = SessionLocal()
    try:
        chats = db.query(Chat).filter(Chat.user_id == user_id).order_by(Chat.created_at).all()
        return [
            {
                "id": chat.id,
                "title": chat.title,
                "created_at": chat.created_at.isoformat()
            }
            for chat in chats
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Создать новый чат
class ChatCreate(BaseModel):
    user_id: int
    title: str = "Новый чат"

@router.post("/")
def create_chat(chat: ChatCreate):
    db: Session = SessionLocal()
    try:
        new_chat = Chat(user_id=chat.user_id, title=chat.title)
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        return JSONResponse(status_code=201, content={
            "id": new_chat.id,
            "title": new_chat.title,
            "created_at": new_chat.created_at.isoformat()
        })
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

from models.models import Message

@router.get("/messages/by_chat/{chat_id}")
def get_messages_by_chat(chat_id: int):
    db: Session = SessionLocal()
    try:
        messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at).all()
        return [
            {
                "id": msg.id,
                "role": msg.role,
                "message": msg.message,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

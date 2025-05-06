from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db import get_db
from typing import List
from models.models import Message, Chat
from fastapi.responses import JSONResponse
from app.models.teacher_model import TeacherSession
from app.schemas.message_schema import MessageSchema

router = APIRouter()

class MessageCreate(BaseModel):
    user_id: int
    chat_id: int
    role: str
    message: str


@router.post("/message", response_model=MessageSchema)
def save_message(msg: MessageCreate, db: Session = Depends(get_db)):
    try:
        new_msg = Message(**msg.dict())
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        return new_msg
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages/{user_id}")
def get_user_messages(user_id: int, db: Session = Depends(get_db)):
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

from models.models import Chat

# Get all user chats
@router.get("/user/{user_id}")
def get_chats(user_id: int, db: Session = Depends(get_db)):
    try:
        chats = db.query(Chat).filter(Chat.user_id == user_id).all()
        result = []
        for chat in chats:
            last_message = db.query(Message).filter(Message.chat_id == chat.id).order_by(Message.created_at.desc()).first()
            result.append({
                "id": chat.id,
                "title": chat.title,
                "created_at": chat.created_at.isoformat(),
                "updated_at": chat.updated_at.isoformat() if hasattr(chat, 'updated_at') else chat.created_at.isoformat(),
                "last_message_time": last_message.created_at.isoformat() if last_message else None,
                "is_teacher_chat": chat.is_teacher_chat
            })
        return result
    except Exception as e:
       print("❌ error chat build:", str(e))

@router.get("/messages/by_chat/{chat_id}")
def get_messages_by_chat(chat_id: int, db: Session = Depends(get_db)):
    try:
        messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at).all()
        return [
            {
                "id": msg.id,
                "user_id": msg.user_id,
                "role": msg.role,
                "message": msg.message,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Создать новый чат
class ChatCreate(BaseModel):
    user_id: int
    title: str = "New Chat"
    is_teacher_chat: bool = False

@router.post("/user")
def create_chat(chat: ChatCreate, db: Session = Depends(get_db)):
    try:
        teacher_session_id = None
        if chat.is_teacher_chat:
            # Создаем teacher session без topic и level
            session = TeacherSession(
                user_id=chat.user_id
                # topic и level не передаем!
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            teacher_session_id = session.id

        new_chat = Chat(
            user_id=chat.user_id, 
            title=chat.title,
            is_teacher_chat=chat.is_teacher_chat,
            teacher_session_id=teacher_session_id
        )
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        return JSONResponse(status_code=201, content={
            "id": new_chat.id,
            "title": new_chat.title,
            "is_teacher_chat": new_chat.is_teacher_chat,
            "teacher_session_id": new_chat.teacher_session_id,
            "created_at": new_chat.created_at.isoformat()
        })
    except Exception as e:
        db.rollback()
        print(f"Error creating chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/title/{chat_id}")
def rename_chat(chat_id: int, body: dict, db: Session = Depends(get_db)):
    try:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        chat.title = body.get("title", chat.title)
        db.commit()
        return {"message": "Title updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{chat_id}")
def delete_chat(chat_id: int, db: Session = Depends(get_db)):
    try:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        db.delete(chat)
        db.commit()
        return {"message": "Chat deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/last-message/{chat_id}")
def get_last_message_time(chat_id: int, db: Session = Depends(get_db)):
    try:
        last_message = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.desc()).first()
        if not last_message:
            return {"created_at": None}
        return {"created_at": last_message.created_at.isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{chat_id}")
def get_chat(chat_id: int, db: Session = Depends(get_db)):
    try:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {
            "id": chat.id,
            "title": chat.title,
            "is_teacher_chat": chat.is_teacher_chat,
            "teacher_session_id": chat.teacher_session_id,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat() if hasattr(chat, 'updated_at') else chat.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{chat_id}")
def update_chat(chat_id: int, body: dict, db: Session = Depends(get_db)):
    try:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        if "is_teacher_chat" in body:
            chat.is_teacher_chat = body["is_teacher_chat"]
            if not body["is_teacher_chat"]:
                chat.teacher_session_id = None
        if "teacher_session_id" in body:
            chat.teacher_session_id = body["teacher_session_id"]
        db.commit()
        return {"message": "Chat updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

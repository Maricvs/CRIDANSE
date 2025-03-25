from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db import SessionLocal
from typing import List
from models.models import Message

router = APIRouter()

class MessageCreate(BaseModel):
    user_id: int
    role: str
    message:

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

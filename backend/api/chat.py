from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db import SessionLocal
from models.models import Message

router = APIRouter()

class MessageCreate(BaseModel):
    user_id: int
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

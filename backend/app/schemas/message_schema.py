from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageBase(BaseModel):
    user_id: int
    chat_id: int
    role: str  # 'user', 'assistant', 'teacher', 'student'
    message: str

class MessageCreate(MessageBase):
    pass

class MessageSchema(MessageBase):
    id: int
    created_at: datetime
    session_id: Optional[int] = None

    class Config:
        from_attributes = True

class AskGptResponse(BaseModel):
    message: MessageSchema
    new_title: Optional[str] = None 
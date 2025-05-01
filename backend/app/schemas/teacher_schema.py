from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TeacherMessageBase(BaseModel):
    content: str
    role: str

class TeacherMessageCreate(TeacherMessageBase):
    session_id: int

class TeacherMessage(TeacherMessageBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TeacherSessionBase(BaseModel):
    topic: Optional[str] = None
    level: Optional[str] = None
    selected_document_id: Optional[int] = None

class TeacherSessionCreate(TeacherSessionBase):
    user_id: int

class TeacherSession(TeacherSessionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    messages: List[TeacherMessage] = []

    class Config:
        from_attributes = True 
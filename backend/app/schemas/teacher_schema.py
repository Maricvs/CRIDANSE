from pydantic import BaseModel
from datetime import datetime
from typing import List

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
    topic: str
    level: str

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
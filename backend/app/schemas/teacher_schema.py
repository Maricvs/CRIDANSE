from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

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

    class Config:
        from_attributes = True


class TeacherProgressRead(BaseModel):
    """Minimal read model for teacher progress (API response)."""
    status: str
    current_objective: Optional[str] = None
    completion_estimate: Optional[int] = None

    class Config:
        from_attributes = True
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ChatFolderCreate(BaseModel):
    name: str


class ChatFolderSchema(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatFolderAssignBody(BaseModel):
    folder_id: int


class ChatFolderAssignmentResponse(BaseModel):
    id: int
    folder_id: Optional[int] = None

    class Config:
        from_attributes = True

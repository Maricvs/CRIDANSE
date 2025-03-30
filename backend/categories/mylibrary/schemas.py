from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TagBase(BaseModel):
    name: str
    category: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    title: str
    file_path: str
    file_type: str
    language: Optional[str] = None
    content: Optional[str] = None

class DocumentCreate(DocumentBase):
    user_id: int

class Document(DocumentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int
    tags: List[Tag] = []

    class Config:
        from_attributes = True 
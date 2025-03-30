from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class TagBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    color: Optional[str] = None

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    created_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True

class MyDocumentBase(BaseModel):
    title: str
    original_filename: str
    file_path: str
    file_type: str
    file_extension: str
    file_size: int
    file_hash: Optional[str] = None
    language: Optional[str] = None
    content: Optional[str] = None
    content_length: Optional[int] = None
    word_count: Optional[int] = None
    page_count: Optional[int] = None
    processing_status: ProcessingStatus = ProcessingStatus.PENDING
    processing_error: Optional[str] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    keywords: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    summary: Optional[str] = None
    reading_time: Optional[int] = None
    is_archived: bool = False
    is_favorite: bool = False
    last_accessed_at: Optional[datetime] = None
    access_count: int = 0

class MyDocumentCreate(MyDocumentBase):
    user_id: int

class MyDocument(MyDocumentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int
    tags: List[Tag] = []

    class Config:
        from_attributes = True

class MyDocumentUpdate(BaseModel):
    title: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    tags: Optional[List[int]] = None  # Список ID тегов 
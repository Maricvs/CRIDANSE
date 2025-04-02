from pydantic import BaseModel
from typing import List
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    file_type: str

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    file_path: str
    created_at: datetime

    class Config:
        orm_mode = True

class DocumentChunkBase(BaseModel):
    content: str
    chunk_index: int

class DocumentChunkCreate(DocumentChunkBase):
    embedding: List[float]

class DocumentChunk(DocumentChunkBase):
    id: int
    document_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class SearchQuery(BaseModel):
    query: str
    limit: int = 5

class SearchResult(BaseModel):
    document_id: int
    document_title: str
    chunk_id: int
    content: str
    similarity: float 
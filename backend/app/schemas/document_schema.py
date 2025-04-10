from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_type: str

class DocumentCreate(DocumentBase):
    pass

#эти классы были созданы правильно и с определенной целью - 
# разделить валидацию входных и выходных данных, 
# а также защитить системные поля от случайного изменения.
class DocumentUpdate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    user_id: int
    # user_name: Optional[str] = None
    file_name: str
    file_size: int
    file_path: str
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class Config:
    from_attributes = True

class DocumentResponse(Document):
    pass

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
        from_attributes = True

class SearchQuery(BaseModel):
    query: str
    limit: int = 5

class SearchResult(BaseModel):
    document_id: int
    document_title: str
    chunk_id: int
    content: str
    similarity: float 
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import os
from datetime import datetime
from fastapi.responses import FileResponse

from ..db.database import get_db
from models.models import Document, DocumentChunk
from ..schemas.document_schema import DocumentCreate, DocumentResponse, DocumentUpdate
from ..api.auth import get_current_user
from models.models import Profile

router = APIRouter()

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    documents = db.query(Document).filter(
        Document.is_deleted == False
    ).offset(skip).limit(limit).all()
    return documents

@router.get("/documents/stats")
async def get_document_stats(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    total = db.query(Document).filter(Document.is_deleted == False).count()
    total_size = db.query(func.sum(Document.file_size)).filter(
        Document.is_deleted == False
    ).scalar() or 0
    
    return {
        "total": total,
        "total_size": total_size,
        "last_updated": datetime.now().isoformat()
    }

@router.post("/documents", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().timestamp()}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    db_document = Document(
        title=document.title,
        description=document.description,
        file_name=file.filename,
        file_type=document.file_type,
        file_size=len(content),
        file_path=file_path,
        user_id=current_user.id
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    for field, value in document.dict(exclude_unset=True).items():
        setattr(db_document, field, value)
    
    db_document.updated_at = datetime.now()
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    document.is_deleted = True
    document.updated_at = datetime.now()
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(
        document.file_path,
        filename=document.file_name,
        media_type=document.file_type
    )

@router.get("/documents/{document_id}/vectorization", response_model=dict)
async def get_document_vectorization(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """Получить информацию о векторизации документа"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
    
    return {
        "document_id": document.id,
        "title": document.title,
        "total_chunks": len(chunks),
        "chunks": [
            {
                "id": chunk.id,
                "index": chunk.chunk_index,
                "content_preview": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                "embedding_size": len(chunk.embedding) if chunk.embedding else 0,
                "created_at": chunk.created_at
            }
            for chunk in chunks
        ]
    } 
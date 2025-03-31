from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse
from .mylibrary.documents import router as documents_router

router = APIRouter()

# Подключаем роутер документов
router.include_router(documents_router, prefix="/documents", tags=["documents"])

@router.get("/user/{user_id}", response_model=List[DocumentResponse])
async def get_user_documents(user_id: int, db: Session = Depends(get_db)):
    """
    Получить все документы пользователя
    """
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    if not documents:
        return []
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """
    Получить конкретный документ по ID
    """
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document 
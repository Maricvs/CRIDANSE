from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import shutil
from pathlib import Path

from db import get_db
from models.models import Document, Profile
from schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate
from auth import get_current_user

router = APIRouter(prefix="/api/admin/documents", tags=["admin-documents"])

# Конфигурация для загрузки файлов
UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    file_type: Optional[str] = None,
    user_id: Optional[int] = None,
    include_deleted: bool = False
):
    """
    Получение списка документов с фильтрацией и поиском
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    query = db.query(Document)

    if not include_deleted:
        query = query.filter(Document.is_deleted == False)

    if search:
        search = f"%{search}%"
        query = query.filter(
            (Document.title.ilike(search)) |
            (Document.description.ilike(search)) |
            (Document.file_name.ilike(search))
        )

    if file_type:
        query = query.filter(Document.file_type == file_type)

    if user_id:
        query = query.filter(Document.user_id == user_id)

    documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return documents

@router.get("/stats")
async def get_documents_stats(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Получение статистики по документам
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    total_documents = db.query(Document).filter(Document.is_deleted == False).count()
    pdf_count = db.query(Document).filter(Document.file_type == "pdf", Document.is_deleted == False).count()
    doc_count = db.query(Document).filter(Document.file_type.in_(["doc", "docx"]), Document.is_deleted == False).count()
    image_count = db.query(Document).filter(Document.file_type.in_(["jpg", "png", "gif"]), Document.is_deleted == False).count()
    total_size = db.query(func.sum(Document.file_size)).filter(Document.is_deleted == False).scalar() or 0

    return {
        "totalDocuments": total_documents,
        "pdfCount": pdf_count,
        "docCount": doc_count,
        "imageCount": image_count,
        "totalSize": total_size
    }

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Получение информации о конкретном документе
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")

    return document

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = None,
    description: str = None,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Загрузка нового документа
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    # Создаем уникальное имя файла
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = UPLOAD_DIR / unique_filename

    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Создаем запись в БД
    document = Document(
        user_id=current_user.id,
        title=title or file.filename,
        description=description,
        file_name=file.filename,
        file_type=file_ext[1:].lower(),
        file_size=os.path.getsize(file_path),
        file_path=str(file_path)
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Удаление документа (мягкое удаление)
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")

    # Мягкое удаление
    document.is_deleted = True
    document.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Документ успешно удален"}

@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Скачивание документа
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")

    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Файл не найден на сервере")

    return FileResponse(
        document.file_path,
        filename=document.file_name,
        media_type=f"application/{document.file_type}"
    ) 
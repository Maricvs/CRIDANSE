from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime
import uuid
import hashlib

from database import get_db
from . import mydocuments, schemas
from .services import process_document, analyze_content
from .schemas import ProcessingStatus

router = APIRouter()

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def calculate_file_hash(file_path: str) -> str:
    """Вычисляет SHA-256 хеш файла"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

@router.post("/upload", response_model=schemas.MyDocument)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = 1  # TODO: Получать из токена авторизации
):
    # Генерируем уникальное имя файла
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Сохраняем файл
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при сохранении файла: {str(e)}")
    
    # Вычисляем хеш файла
    file_hash = calculate_file_hash(file_path)
    
    # Создаем запись в БД
    db_document = mydocuments.MyDocument(
        title=file.filename,
        original_filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_extension=file_extension,
        file_size=os.path.getsize(file_path),
        file_hash=file_hash,
        user_id=user_id,
        processing_status=ProcessingStatus.PENDING
    )
    
    try:
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        # Асинхронно обрабатываем документ
        await process_document(db_document.id)
        
        return db_document
    except Exception as e:
        # Удаляем файл в случае ошибки
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Ошибка при сохранении в БД: {str(e)}")

@router.get("/documents", response_model=List[schemas.MyDocument])
def get_documents(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    language: Optional[str] = None,
    file_type: Optional[str] = None,
    is_archived: Optional[bool] = None,
    is_favorite: Optional[bool] = None,
    db: Session = Depends(get_db),
    user_id: int = 1  # TODO: Получать из токена авторизации
):
    query = db.query(mydocuments.MyDocument).filter(mydocuments.MyDocument.user_id == user_id)
    
    if search:
        query = query.filter(mydocuments.MyDocument.title.ilike(f"%{search}%"))
    if language:
        query = query.filter(mydocuments.MyDocument.language == language)
    if file_type:
        query = query.filter(mydocuments.MyDocument.file_type == file_type)
    if is_archived is not None:
        query = query.filter(mydocuments.MyDocument.is_archived == is_archived)
    if is_favorite is not None:
        query = query.filter(mydocuments.MyDocument.is_favorite == is_favorite)
    
    documents = query.offset(skip).limit(limit).all()
    return documents

@router.get("/documents/{document_id}", response_model=schemas.MyDocument)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    user_id: int = 1  # TODO: Получать из токена авторизации
):
    document = db.query(mydocuments.MyDocument).filter(
        mydocuments.MyDocument.id == document_id,
        mydocuments.MyDocument.user_id == user_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    # Обновляем статистику доступа
    document.last_accessed_at = datetime.utcnow()
    document.access_count += 1
    db.commit()
    
    return document

@router.patch("/documents/{document_id}", response_model=schemas.MyDocument)
def update_document(
    document_id: int,
    document_update: schemas.MyDocumentUpdate,
    db: Session = Depends(get_db),
    user_id: int = 1  # TODO: Получать из токена авторизации
):
    document = db.query(mydocuments.MyDocument).filter(
        mydocuments.MyDocument.id == document_id,
        mydocuments.MyDocument.user_id == user_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    # Обновляем поля
    for field, value in document_update.dict(exclude_unset=True).items():
        if field == 'tags':
            # Обновляем теги
            document.tags = []
            if value:
                tags = db.query(mydocuments.Tag).filter(mydocuments.Tag.id.in_(value)).all()
                document.tags = tags
        else:
            setattr(document, field, value)
    
    db.commit()
    db.refresh(document)
    return document

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    user_id: int = 1  # TODO: Получать из токена авторизации
):
    document = db.query(mydocuments.MyDocument).filter(
        mydocuments.MyDocument.id == document_id,
        mydocuments.MyDocument.user_id == user_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    # Удаляем файл
    try:
        os.remove(document.file_path)
    except Exception as e:
        print(f"Ошибка при удалении файла: {str(e)}")
    
    # Удаляем запись из БД
    db.delete(document)
    db.commit()
    return {"message": "Документ успешно удален"} 
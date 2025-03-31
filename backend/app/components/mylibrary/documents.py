from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
import os
import uuid
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse

router = APIRouter()

# Конфигурация
UPLOAD_DIR = Path("/var/www/unlim-mind-ai/uploads/documents")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_FILE_TYPES = {'pdf', 'doc', 'docx', 'txt', 'rtf'}

def validate_file(file: UploadFile) -> bool:
    """Проверка файла на соответствие требованиям"""
    # Проверка размера
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE/1024/1024}MB"
        )
    
    # Проверка типа файла
    file_extension = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if file_extension not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_FILE_TYPES)}"
        )
    
    return True

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Загрузка документа
    """
    try:
        # Валидация файла
        validate_file(file)
        
        # Создаем директорию по текущей дате
        current_date = datetime.now()
        year_dir = UPLOAD_DIR / str(current_date.year)
        month_dir = year_dir / f"{current_date.month:02d}"
        
        year_dir.mkdir(exist_ok=True)
        month_dir.mkdir(exist_ok=True)
        
        # Генерируем уникальное имя файла
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = month_dir / unique_filename
        
        # Сохраняем файл
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Создаем запись в БД
        document = Document(
            title=title,
            description=description,
            file_path=str(file_path),
            file_name=file.filename,
            file_type=file.content_type,
            file_size=os.path.getsize(file_path),
            user_id=user_id
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return document
        
    except Exception as e:
        # В случае ошибки удаляем загруженный файл
        if 'file_path' in locals():
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}", response_model=list[DocumentResponse])
async def get_user_documents(user_id: int, db: Session = Depends(get_db)):
    """
    Получить все документы пользователя
    """
    documents = db.query(Document).filter(Document.user_id == user_id).all()
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

@router.delete("/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """
    Удалить документ
    """
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Удаляем физический файл
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Удаляем запись из БД
        db.delete(document)
        db.commit()
        
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
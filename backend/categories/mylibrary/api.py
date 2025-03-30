from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
from datetime import datetime
import uuid

from database import get_db
from . import models, schemas
from .services import process_document, analyze_content

router = APIRouter()

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.Document)
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
    
    # Создаем запись в БД
    db_document = models.Document(
        title=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        user_id=user_id
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

@router.get("/documents", response_model=List[schemas.Document])
def get_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user_id: int = 1  # TODO: Получать из токена авторизации
):
    documents = db.query(models.Document).filter(
        models.Document.user_id == user_id
    ).offset(skip).limit(limit).all()
    return documents

@router.get("/documents/{document_id}", response_model=schemas.Document)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    user_id: int = 1  # TODO: Получать из токена авторизации
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == user_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return document

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    user_id: int = 1  # TODO: Получать из токена авторизации
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == user_id
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
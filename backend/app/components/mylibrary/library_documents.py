from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from pathlib import Path
import os
import uuid
from datetime import datetime
from typing import Optional
import re
from db import Base, get_db
from models.models import Document as DocumentModel
from app.schemas.document_schema import Document as DocumentSchema
from app.utils.cleanup_documents import cleanup_missing_files
from app.components.documents.document_service import process_document_content
from app.services.file_service import save_uploaded_file

router = APIRouter()

# Конфигурация
UPLOAD_DIR = Path("/var/www/uploads/documents")
MAX_FILE_SIZE = 25 * 1024 * 1024  # 10MB
ALLOWED_FILE_TYPES = {'pdf', 'doc', 'docx', 'txt', 'rtf'}

def sanitize_filename(filename: str) -> str:
    """Санитизация имени файла"""
    # Удаляем все небезопасные символы
    filename = re.sub(r'[^a-zA-Z0-9.-]', '_', filename)
    # Удаляем множественные подчеркивания
    filename = re.sub(r'_+', '_', filename)
    return filename

def validate_file(file: UploadFile) -> bool:
    """Проверка файла на соответствие требованиям"""
    # Проверка типа файла
    file_extension = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if file_extension not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_FILE_TYPES)}"
        )
    
    return True

@router.post("/upload", response_model=DocumentSchema)
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
        # Сохраняем файл через единый сервис
        file_path, original_filename, file_size = await save_uploaded_file(file)
        
        # Создаем запись в БД
        document = DocumentModel(
            title=title,
            description=description,
            file_path=file_path,
            file_name=original_filename,
            file_type=file.content_type,
            file_size=file_size,
            user_id=user_id
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Векторизация документа
        try:
            await process_document_content(document.id, db)
            print(f"✅ [INFO] Документ успешно векторизован: id={document.id}, title={document.title}")
        except Exception as process_err:
            print(f"⚠️ [WARNING] Ошибка при векторизации документа: {str(process_err)}")
        
        return document
        
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при загрузке документа: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при загрузке документа"
        )

@router.get("/list/user/{user_id}", response_model=list[DocumentSchema])
async def get_user_documents(user_id: int, db: Session = Depends(get_db)):
    """
    Получить все документы пользователя
    """
    try:
        documents = db.query(DocumentModel).filter(
            DocumentModel.user_id == user_id,
            DocumentModel.is_deleted == False
        ).all()
        
        print(f"📦 [INFO] Найдено {len(documents)} документов для пользователя {user_id}")
        return documents
        
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при получении документов: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при получении списка документов"
        )

@router.get("/single/document/{document_id}", response_model=DocumentSchema)
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """
    Получить конкретный документ по ID
    """
    try:
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Документ не найден"
            )
            
        return document
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при получении документа: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при получении документа"
        )

@router.delete("/remove/document/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """
    Удалить документ (мягкое удаление)
    """
    try:
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Документ не найден"
            )
        
        document.is_deleted = True
        document.updated_at = datetime.now()
        db.commit()
        
        print(f"✅ [INFO] Документ успешно удален: id={document_id}")
        return {"message": "Документ успешно удален"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при удалении документа: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при удалении документа"
        )

@router.post("/cleanup")
async def cleanup_documents(db: Session = Depends(get_db)):
    """
    Очищает записи документов из БД, если соответствующие файлы не найдены
    """
    try:
        deleted_count = cleanup_missing_files(db)
        print(f"✅ [INFO] Удалено {deleted_count} несуществующих документов")
        
        return {
            "status": "success",
            "message": f"Удалено {deleted_count} несуществующих документов"
        }
        
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при очистке документов: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при очистке документов: {str(e)}"
        )
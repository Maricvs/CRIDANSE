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
from ..services.file_service import save_uploaded_file
from ..components.documents.document_service import process_document_content

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
    """
    Получить список документов пользователя
    """
    try:
        documents = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).offset(skip).limit(limit).all()
        
        print(f"📦 [INFO] Найдено {len(documents)} документов для пользователя {current_user.id}")
        return documents
        
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при получении документов: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при получении списка документов"
        )

@router.get("/documents/stats")
async def get_document_stats(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Получить статистику по документам пользователя
    """
    try:
        total = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).count()
        
        total_size = db.query(func.sum(Document.file_size)).filter(
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).scalar() or 0
        
        print(f"📊 [INFO] Статистика документов для пользователя {current_user.id}: {total} документов, {total_size} байт")
        
        return {
            "total": total,
            "total_size": total_size,
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при получении статистики: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при получении статистики документов"
        )

@router.post("/documents", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Создание нового документа
    """
    try:
        # Сохраняем файл через единый сервис
        file_path, original_filename, file_size = await save_uploaded_file(file)
        
        # Создаем документ в БД
        db_document = Document(
            title=document.title,
            description=document.description,
            file_name=original_filename,
            file_type=document.file_type,
            file_size=file_size,
            file_path=file_path,
            user_id=current_user.id
        )
        
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        # Векторизуем документ
        try:
            await process_document_content(db_document.id, db)
            print(f"✅ [INFO] Документ успешно векторизован: id={db_document.id}, title={db_document.title}")
        except Exception as process_err:
            print(f"⚠️ [WARNING] Ошибка при векторизации документа: {str(process_err)}")
        
        return db_document
        
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при создании документа: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при создании документа"
        )

@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Обновление существующего документа
    """
    try:
        # Получаем документ и проверяем права доступа
        db_document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).first()
        
        if not db_document:
            raise HTTPException(
                status_code=404,
                detail="Документ не найден или у вас нет прав на его редактирование"
            )
        
        # Обновляем только разрешенные поля
        for field, value in document.dict(exclude_unset=True).items():
            setattr(db_document, field, value)
        
        db_document.updated_at = datetime.now()
        db.commit()
        db.refresh(db_document)
        
        print(f"✅ [INFO] Документ успешно обновлен: id={db_document.id}")
        return db_document
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при обновлении документа: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при обновлении документа"
        )

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Удаление документа (мягкое удаление)
    """
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Документ не найден или у вас нет прав на его удаление"
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

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Скачивание документа
    """
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Документ не найден или у вас нет прав на его скачивание"
            )
        
        if not os.path.exists(document.file_path):
            raise HTTPException(
                status_code=404,
                detail="Файл не найден на сервере"
            )
        
        print(f"✅ [INFO] Документ успешно скачан: id={document_id}")
        return FileResponse(
            document.file_path,
            filename=document.file_name,
            media_type=document.file_type
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при скачивании документа: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при скачивании документа"
        )

@router.get("/documents/{document_id}/vectorization", response_model=dict)
async def get_document_vectorization(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Получить информацию о векторизации документа
    """
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Документ не найден или у вас нет прав на его просмотр"
            )
        
        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id
        ).all()
        
        print(f"✅ [INFO] Получена информация о векторизации документа: id={document_id}")
        
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
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при получении информации о векторизации: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при получении информации о векторизации"
        ) 
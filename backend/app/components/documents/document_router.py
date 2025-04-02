from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from models.models import Profile
from app.schemas.document_schema import Document, SearchQuery, SearchResult
from app.components.documents.document_service import (
    upload_document,
    get_user_documents,
    delete_document,
    search_relevant_chunks,
    generate_teacher_response
)

# Функция для имитации авторизации (заменить на реальную)
def get_current_user(db: Session = Depends(get_db)):
    # Это заглушка - в реальном приложении здесь должна быть полноценная авторизация
    # Например, через JWT-токен
    user = db.query(Profile).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

router = APIRouter()

@router.post("/documents", response_model=Document)
async def create_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загружает новый документ и создает для него эмбеддинги"""
    return await upload_document(db, current_user, file, title)

@router.get("/documents", response_model=List[Document])
async def read_documents(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает список документов текущего пользователя"""
    return await get_user_documents(db, current_user)

@router.delete("/documents/{document_id}")
async def remove_document(
    document_id: int,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаляет документ пользователя"""
    success = await delete_document(db, document_id, current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return {"message": "Документ успешно удален"}

@router.post("/documents/search", response_model=List[SearchResult])
async def search_documents(
    search_query: SearchQuery,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Выполняет семантический поиск по документам пользователя"""
    return await search_relevant_chunks(db, current_user, search_query)

@router.post("/teacher/ask")
async def ask_teacher(
    query: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отправляет запрос и получает ответ на основе контекста из загруженных документов"""
    response = await generate_teacher_response(db, current_user, query)
    return {"response": response} 
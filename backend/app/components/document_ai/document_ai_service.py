from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
from openai import OpenAI
from db import get_db
from app.models.document_model import Document
from .document_processor import get_document_content, check_document_access, get_document_content_internal

# Инициализация клиента OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

# Модель запроса к ИИ с использованием документов
class DocumentAIRequest(BaseModel):
    prompt: str
    user_id: int
    chat_id: int
    document_ids: List[int]  # ID документов для использования в контексте

# Модель ответа
class DocumentAIResponse(BaseModel):
    response: str
    used_documents: List[dict]  # Метаданные использованных документов

@router.post("/ask_with_documents", response_model=DocumentAIResponse)
async def ask_with_documents(
    request: DocumentAIRequest,
    db: Session = Depends(get_db)
):
    """
    Запрос к ИИ модели с учетом содержимого документов пользователя.
    """
    try:
        # Проверяем наличие и доступность документов
        documents_content = []
        used_documents = []
        
        for doc_id in request.document_ids:
            try:
                # Проверяем доступ пользователя к документу
                document = check_document_access(doc_id, request.user_id, db)
                
                # Получаем содержимое документа
                doc_content = get_document_content_internal(doc_id, request.user_id, db)
                
                # Добавляем в список
                documents_content.append(f"--- DOCUMENT: {doc_content.title} ---\n{doc_content.content}")
                
                # Добавляем метаданные документа для ответа
                used_documents.append({
                    "id": document.id,
                    "title": document.title,
                    "file_name": document.file_name
                })
                
            except HTTPException as e:
                # Пропускаем недоступные документы
                continue
        
        # Если не удалось получить содержимое ни одного документа
        if not documents_content:
            raise HTTPException(
                status_code=400, 
                detail="Не удалось получить содержимое ни одного документа"
            )
        
        # Создаем систему промптов
        system_prompt = """
Ты — CRIDANSE, интеллектуальный AI-ассистент, работающий с документами пользователя.
Твоя задача — давать ответы ИСКЛЮЧИТЕЛЬНО на основе содержимого предоставленных документов.

Правила:
1. Используй ТОЛЬКО информацию из предоставленных документов.
2. Если в документах нет ответа на вопрос, четко скажи об этом.
3. Не придумывай информацию, которой нет в документах.
4. Цитируй источники, когда это уместно.
5. Структурируй ответы для удобства чтения.

Документы пользователя расположены после этого системного сообщения.
"""
        
        # Формируем сообщения для отправки в OpenAI
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": "\n\n".join(documents_content)},
            {"role": "user", "content": request.prompt}
        ]
        
        # Отправляем запрос к OpenAI
        chat_completion = client.chat.completions.create(
            model="gpt-3.5-turbo-16k",  # Используем модель с большим контекстом
            messages=messages,
        )
        
        # Получаем ответ
        ai_response = chat_completion.choices[0].message.content
        
        # Сохраняем сообщения в БД
        from models.models import Message
        
        user_message = Message(
            user_id=request.user_id,
            chat_id=request.chat_id,
            role="user",
            message=request.prompt
        )
        db.add(user_message)
        
        # Добавляем информацию об использованных документах в ответе
        documents_info = "\n\n*Использованы документы:* " + ", ".join([doc["title"] for doc in used_documents])
        full_response = ai_response + documents_info
        
        bot_message = Message(
            user_id=request.user_id,
            chat_id=request.chat_id,
            role="assistant",
            message=full_response
        )
        db.add(bot_message)
        
        db.commit()
        
        return {"response": full_response, "used_documents": used_documents}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
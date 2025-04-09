from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field
import os
from openai import OpenAI
from db import get_db
from models.models import Message, Profile, Chat
from .document_processor import get_document_content_internal

# Инициализация клиента OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

# Константы
MAX_CONTEXT_LENGTH = 15000  # Максимальная длина контекста в токенах
MAX_RESPONSE_LENGTH = 2000  # Максимальная длина ответа в токенах

class DocumentAIRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    user_id: int
    chat_id: int
    document_ids: List[int] = Field(..., min_items=1, max_items=10)

class DocumentAIResponse(BaseModel):
    response: str
    used_documents: List[dict]
    context_length: int

@router.post("/ask_with_documents", response_model=DocumentAIResponse)
async def ask_with_documents(
    request: DocumentAIRequest,
    db: Session = Depends(get_db)
):
    """
    Запрос к ИИ модели с учетом содержимого документов пользователя.
    """
    try:
        # Проверяем существование пользователя и чата
        user = db.query(Profile).filter(Profile.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        chat = db.query(Chat).filter(Chat.id == request.chat_id).first()
        if not chat or chat.user_id != request.user_id:
            raise HTTPException(status_code=404, detail="Чат не найден или нет доступа")

        # Получаем содержимое документов
        documents_content = []
        used_documents = []
        total_context_length = 0
        
        for doc_id in request.document_ids:
            try:
                doc_content = get_document_content_internal(doc_id, request.user_id, db)
                
                # Проверяем длину контекста
                if total_context_length + len(doc_content.content) > MAX_CONTEXT_LENGTH:
                    print(f"⚠️ [WARNING] Документ {doc_id} пропущен из-за превышения лимита контекста")
                    continue
                
                documents_content.append(f"--- DOCUMENT: {doc_content.title} ---\n{doc_content.content}")
                total_context_length += len(doc_content.content)
                used_documents.append({
                    "id": doc_content.id,
                    "title": doc_content.title,
                    "file_name": doc_content.file_name
                })
                
            except HTTPException as e:
                print(f"⚠️ [WARNING] Ошибка при обработке документа {doc_id}: {str(e)}")
                continue
        
        if not documents_content:
            raise HTTPException(
                status_code=400, 
                detail="Не удалось получить содержимое ни одного документа"
            )
        
        # Формируем контекст для AI
        system_prompt = """
Ты — CRIDANSE, интеллектуальный AI-ассистент, работающий с документами пользователя.
Твоя задача — давать ответы ИСКЛЮЧИТЕЛЬНО на основе содержимого предоставленных документов.

Правила:
1. Используй ТОЛЬКО информацию из предоставленных документов
2. Если в документах нет ответа на вопрос, четко скажи об этом
3. Не придумывай информацию, которой нет в документах
4. Цитируй источники, когда это уместно
5. Структурируй ответы для удобства чтения
6. Если документы противоречат друг другу, укажи на это
7. Используй маркированные списки для перечислений
8. Выделяй важные термины или концепции

Формат ответа:
1. Краткий ответ на вопрос
2. Подробное объяснение с цитатами
3. Дополнительный контекст (если есть)
4. Список использованных документов
"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": "\n\n".join(documents_content)},
            {"role": "user", "content": request.prompt}
        ]
        
        # Получаем ответ от AI
        try:
            chat_completion = client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=MAX_RESPONSE_LENGTH,
                temperature=0.7
            )
            ai_response = chat_completion.choices[0].message.content
        except Exception as e:
            print(f"❌ [ERROR] Ошибка при запросе к OpenAI: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Ошибка при генерации ответа"
            )
        
        # Сохраняем историю диалога
        user_message = Message(
            user_id=request.user_id,
            chat_id=request.chat_id,
            role="user",
            message=request.prompt
        )
        db.add(user_message)
        
        # Добавляем информацию об использованных документах
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
        
        return {
            "response": full_response,
            "used_documents": used_documents,
            "context_length": total_context_length
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Неожиданная ошибка: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Произошла непредвиденная ошибка"
        ) 
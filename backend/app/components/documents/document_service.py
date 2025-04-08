import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.document_model import Document, DocumentChunk
from models.models import Profile
from app.schemas.document_schema import DocumentCreate, DocumentChunkCreate, SearchQuery
import PyPDF2
import docx
import tiktoken
from openai import OpenAI
import numpy as np
import json

# Константы
UPLOAD_DIR = "uploads"
CHUNK_SIZE = 1000  # примерное количество слов в чанке
OVERLAP_SIZE = 200  # перекрытие между чанками
EMBEDDING_MODEL = "text-embedding-3-small"  # модель OpenAI для эмбеддингов

# Инициализация клиента OpenAI
client = OpenAI()

# Функция для подсчета токенов
def num_tokens_from_string(string: str) -> int:
    """Возвращает количество токенов в строке"""
    encoding = tiktoken.get_encoding("cl100k_base")
    num_tokens = len(encoding.encode(string))
    return num_tokens

# Функция для создания директорий
def ensure_upload_dir():
    """Создает директорию для загрузки, если она не существует"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)

# Функция для получения содержимого документов разных форматов
def extract_text_from_file(file_path: str, file_type: str) -> str:
    """Извлекает текст из файла в зависимости от его типа"""
    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type in ["docx", "doc"]:
        return extract_text_from_docx(file_path)
    elif file_type == "txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Неподдерживаемый тип файла: {file_type}")

def extract_text_from_pdf(file_path: str) -> str:
    """Извлекает текст из PDF-файла"""
    text = ""
    with open(file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Извлекает текст из DOCX-файла"""
    doc = docx.Document(file_path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def extract_text_from_txt(file_path: str) -> str:
    """Извлекает текст из TXT-файла"""
    with open(file_path, "r", encoding="utf-8") as file:
        text = file.read()
    return text

# Функция для разбиения текста на чанки
def split_text_into_chunks(text: str) -> List[str]:
    """Разбивает текст на чанки с перекрытием"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), CHUNK_SIZE - OVERLAP_SIZE):
        chunk = " ".join(words[i:i + CHUNK_SIZE])
        if chunk:
            chunks.append(chunk)
    
    return chunks

# Функция для получения эмбеддингов
async def get_embedding(text: str) -> List[float]:
    """Получает эмбеддинг для текста с помощью API OpenAI"""
    response = client.embeddings.create(
        input=text,
        model=EMBEDDING_MODEL
    )
    return response.data[0].embedding

# Функция для сравнения эмбеддингов
def calculate_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """Рассчитывает косинусное сходство между двумя эмбеддингами"""
    dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
    magnitude1 = sum(a * a for a in embedding1) ** 0.5
    magnitude2 = sum(b * b for b in embedding2) ** 0.5
    
    if magnitude1 * magnitude2 == 0:
        return 0
    
    return dot_product / (magnitude1 * magnitude2)

# Функции для работы с документами
async def upload_document(
    db: Session,
    user: Profile,
    file: UploadFile,
    title: str
) -> Document:
    """Загружает документ, сохраняет его и создает эмбеддинги"""
    # Создаем директорию для загрузки
    ensure_upload_dir()
    
    # Генерируем уникальное имя файла
    file_extension = file.filename.split(".")[-1].lower()
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Создаем запись о документе в БД
    document_data = DocumentCreate(
        title=title,
        file_type=file_extension
    )
    
    db_document = Document(
        user_id=user.id,
        title=document_data.title,
        file_path=file_path,
        file_type=document_data.file_type
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Извлекаем текст из документа
    text = extract_text_from_file(file_path, file_extension)
    
    # Разбиваем текст на чанки
    chunks = split_text_into_chunks(text)
    
    # Создаем эмбеддинги для каждого чанка
    for i, chunk_text in enumerate(chunks):
        embedding = await get_embedding(chunk_text)
        
        # Сохраняем чанк в БД
        chunk_data = DocumentChunkCreate(
            content=chunk_text,
            chunk_index=i,
            embedding=embedding
        )
        
        db_chunk = DocumentChunk(
            document_id=db_document.id,
            content=chunk_data.content,
            embedding=json.dumps(embedding),  # Сохраняем как JSON
            chunk_index=chunk_data.chunk_index
        )
        
        db.add(db_chunk)
    
    db.commit()
    return db_document

async def get_user_documents(
    db: Session,
    user: Profile
) -> List[Document]:
    """Получает список документов пользователя"""
    return db.query(Document).filter(Document.user_id == user.id).all()

async def delete_document(
    db: Session,
    document_id: int,
    user: Profile
) -> bool:
    """Удаляет документ и все его чанки"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user.id
    ).first()
    
    if document:
        # Удаляем физический файл
        try:
            os.remove(document.file_path)
        except FileNotFoundError:
            pass
        
        # Удаляем запись из БД
        db.delete(document)
        db.commit()
        return True
    
    return False

async def search_relevant_chunks(
    db: Session,
    user: Profile,
    search_query: SearchQuery
) -> List[Dict[str, Any]]:
    """Ищет релевантные чанки в документах пользователя"""
    # Получаем эмбеддинг запроса
    query_embedding = await get_embedding(search_query.query)
    
    # Получаем все документы пользователя
    documents = await get_user_documents(db, user)
    document_ids = [doc.id for doc in documents]
    
    if not document_ids:
        return []
    
    # Получаем все чанки для документов пользователя
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id.in_(document_ids)
    ).all()
    
    # Сопоставляем каждый документ с его ID для быстрого доступа
    documents_by_id = {doc.id: doc for doc in documents}
    
    # Рассчитываем сходство для каждого чанка
    results = []
    for chunk in chunks:
        chunk_embedding = json.loads(chunk.embedding)  # Преобразуем из JSON
        similarity = calculate_similarity(query_embedding, chunk_embedding)
        
        results.append({
            "document_id": chunk.document_id,
            "document_title": documents_by_id[chunk.document_id].title,
            "chunk_id": chunk.id,
            "content": chunk.content,
            "similarity": similarity
        })
    
    # Сортируем по сходству и берем top-N
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:search_query.limit]

async def get_context_for_query(
    db: Session,
    user: Profile,
    query: str,
    limit: int = 5
) -> str:
    """Получает контекст для запроса из документов пользователя"""
    search_query = SearchQuery(query=query, limit=limit)
    relevant_chunks = await search_relevant_chunks(db, user, search_query)
    
    context = "\n\n---\n\n".join([chunk["content"] for chunk in relevant_chunks])
    return context

# Функция для генерации ответа с использованием GPT и контекста
async def generate_teacher_response(
    db: Session,
    user: Profile,
    query: str
) -> str:
    """Генерирует ответ учителя на основе контекста из документов"""
    # Получаем релевантный контекст из документов
    context = await get_context_for_query(db, user, query)
    
    if not context:
        return "Извините, но я не нашел релевантной информации в загруженных материалах. Пожалуйста, загрузите учебные материалы или уточните вопрос."

    # Формируем промпт для учителя
    prompt = f"""Вы - преподаватель, который отвечает на вопросы студента на основе предоставленных учебных материалов.
    
КОНТЕКСТ ИЗ УЧЕБНЫХ МАТЕРИАЛОВ:
{context}

ВОПРОС СТУДЕНТА:
{query}

Пожалуйста, ответьте на вопрос студента, используя ТОЛЬКО информацию из предоставленного контекста. 
Если в контексте нет достаточной информации для полного ответа, скажите об этом студенту и ответьте только на основе того, что есть в контексте.
Будьте педагогичны, объясняйте сложные темы простым языком. При необходимости приводите примеры из контекста.
Всегда ссылайтесь на учебные материалы, но не упоминайте процесс поиска или эмбеддинги в своем ответе."""
    
    # Вызываем GPT для генерации ответа
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Вы - опытный преподаватель, который отвечает на вопросы студентов на основе учебных материалов."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=1500
    )
    
    return response.choices[0].message.content 

# Функция для обработки содержимого документа
async def process_document_content(document_id: int, db: Session) -> bool:
    """
    Обрабатывает содержимое документа из "Моей библиотеки":
    - извлекает текст
    - разбивает на чанки
    - создает эмбеддинги
    - сохраняет в базу данных
    """
    print(f"🧠 [DEBUG] START: process_document_content({document_id})")
    
    # Получаем документ из БД
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise ValueError(f"Документ с ID {document_id} не найден")
    
    # Извлекаем текст из документа
    try:
        file_type = document.file_name.split('.')[-1] if document.file_name else document.file_type
        if not file_type:
            raise ValueError("Неизвестный тип файла")
            
        text = extract_text_from_file(document.file_path, file_type)
        
        # Разбиваем текст на чанки
        chunks = split_text_into_chunks(text)
        
        print(f"✅ [INFO] Документ {document.id} разбит на {len(chunks)} чанков")
        
        # Создаем эмбеддинги для каждого чанка
        for i, chunk_text in enumerate(chunks):
            embedding = await get_embedding(chunk_text)
            
            # Сохраняем чанк в БД
            db_chunk = DocumentChunk(
                document_id=document.id,
                content=chunk_text,
                embedding=json.dumps(embedding),
                chunk_index=i
            )
            
            db.add(db_chunk)
        
        db.commit()
        print(f"✅ [INFO] Векторизация завершена для документа ID={document.id}")
        return True
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при обработке документа {document_id}: {str(e)}")
        raise e
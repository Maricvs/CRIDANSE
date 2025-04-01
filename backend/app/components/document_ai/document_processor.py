from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import tempfile
import shutil
from typing import List, Optional
from pydantic import BaseModel
from db import get_db
from app.models.document import Document

# Для извлечения текста из документов
try:
    import PyPDF2
    from docx import Document as DocxDocument
except ImportError:
    # pip install PyPDF2 python-docx
    pass

router = APIRouter()

# Модель для ответа
class DocumentContent(BaseModel):
    id: int
    title: str
    content: str
    file_type: str

# Проверка прав доступа к документу
def check_document_access(document_id: int, user_id: int, db: Session) -> Document:
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    if document.user_id != user_id:
        raise HTTPException(status_code=403, 
                          detail="У вас нет доступа к этому документу")
    
    return document

# Извлечение текста из документа
def extract_text_from_file(file_path: str, file_type: str) -> str:
    """Извлекает текст из файла в зависимости от его типа"""
    try:
        if file_type.endswith('pdf') or 'pdf' in file_type:
            return extract_text_from_pdf(file_path)
        elif file_type.endswith('docx') or 'docx' in file_type:
            return extract_text_from_docx(file_path)
        elif file_type.endswith('txt') or 'text/plain' in file_type:
            return extract_text_from_txt(file_path)
        else:
            return f"Неподдерживаемый формат файла: {file_type}"
    except Exception as e:
        return f"Ошибка при извлечении текста: {str(e)}"

def extract_text_from_pdf(file_path: str) -> str:
    """Извлекает текст из PDF файла"""
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text()
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Извлекает текст из DOCX файла"""
    doc = DocxDocument(file_path)
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text

def extract_text_from_txt(file_path: str) -> str:
    """Извлекает текст из TXT файла"""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
        return file.read()

@router.get("/content/{document_id}", response_model=DocumentContent)
async def get_document_content(document_id: int, user_id: int, db: Session = Depends(get_db)):
    """
    Получить содержимое документа для использования в ИИ.
    Проверяет доступ пользователя к документу.
    """
    # Проверяем доступ пользователя к документу
    document = check_document_access(document_id, user_id, db)
    
    # Извлекаем текст из документа
    content = extract_text_from_file(document.file_path, document.file_type)
    
    return {
        "id": document.id,
        "title": document.title,
        "content": content,
        "file_type": document.file_type
    }

@router.get("/list_for_ai/{user_id}", response_model=List[dict])
async def get_documents_for_ai(user_id: int, db: Session = Depends(get_db)):
    """
    Получить список всех документов пользователя для выбора в ИИ интерфейсе.
    Возвращает только метаданные без содержимого.
    """
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    
    return [
        {
            "id": doc.id,
            "title": doc.title,
            "description": doc.description or "",
            "file_name": doc.file_name,
            "file_type": doc.file_type
        }
        for doc in documents
    ] 
from fastapi import UploadFile, HTTPException
from pathlib import Path
import os
import uuid
from datetime import datetime
import re
from typing import Optional, Tuple
import shutil

# Конфигурация
UPLOAD_DIR = Path("/var/www/uploads/documents")
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB
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

def ensure_upload_dir() -> None:
    """Создает директорию для загрузки, если она не существует"""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def save_uploaded_file(
    file: UploadFile,
    subdirectory: Optional[str] = None
) -> Tuple[str, str, int]:
    """
    Сохраняет загруженный файл и возвращает информацию о нем
    
    Args:
        file: Загруженный файл
        subdirectory: Поддиректория для сохранения (опционально)
        
    Returns:
        tuple[str, str, int]: (путь к файлу, оригинальное имя, размер файла)
    """
    try:
        # Валидация файла
        validate_file(file)
        
        # Создаем директорию по текущей дате
        current_date = datetime.now()
        year_dir = UPLOAD_DIR / str(current_date.year)
        month_dir = year_dir / f"{current_date.month:02d}"
        
        if subdirectory:
            month_dir = month_dir / subdirectory
            
        month_dir.mkdir(parents=True, exist_ok=True)
        
        # Читаем содержимое файла для проверки размера
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE/1024/1024}MB"
            )
        
        # Генерируем безопасное имя файла
        original_filename = sanitize_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}_{int(datetime.now().timestamp())}{file_extension}"
        file_path = month_dir / unique_filename
        
        # Сохраняем файл
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        print(f"✅ [INFO] Файл успешно сохранен: {file_path}")
        
        return str(file_path), original_filename, len(content)
        
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при сохранении файла: {str(e)}")
        # Безопасно удалить файл, если он уже был создан
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as remove_err:
                print(f"⚠️ [WARNING] Не удалось удалить файл при ошибке: {str(remove_err)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при сохранении файла: {str(e)}"
        )

async def delete_file(file_path: str) -> bool:
    """
    Удаляет файл с диска
    
    Args:
        file_path: Путь к файлу
        
    Returns:
        bool: True если файл успешно удален, False если файл не найден
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"✅ [INFO] Файл успешно удален: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при удалении файла {file_path}: {str(e)}")
        return False

def get_file_info(file_path: str) -> dict:
    """
    Получает информацию о файле
    
    Args:
        file_path: Путь к файлу
        
    Returns:
        dict: Информация о файле (размер, тип, дата создания)
    """
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Файл не найден")
            
        stats = os.stat(file_path)
        return {
            "size": stats.st_size,
            "created_at": datetime.fromtimestamp(stats.st_ctime),
            "modified_at": datetime.fromtimestamp(stats.st_mtime),
            "file_type": os.path.splitext(file_path)[1].lower().lstrip('.')
        }
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при получении информации о файле {file_path}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении информации о файле: {str(e)}"
        ) 
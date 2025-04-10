from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
import mimetypes
from pathlib import Path
from fastapi.responses import FileResponse, JSONResponse
from db import get_db
from models.models import Profile
import uuid

router = APIRouter(prefix="/api/admin/files", tags=["admin-files"])

# Базовый путь для хранения файлов
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

# Создаем директорию, если она не существует
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Интерфейс для файла
class FileItem:
    def __init__(self, path, name, is_directory=False):
        self.id = str(uuid.uuid4())
        self.name = name
        self.path = path
        self.is_directory = is_directory
        
        if not is_directory:
            stat = os.stat(path)
            self.size = stat.st_size
            self.type = mimetypes.guess_type(path)[0] or "application/octet-stream"
            self.created_at = datetime.fromtimestamp(stat.st_ctime).isoformat()
            self.updated_at = datetime.fromtimestamp(stat.st_mtime).isoformat()
        else:
            self.size = 0
            self.type = "directory"
            stat = os.stat(path)
            self.created_at = datetime.fromtimestamp(stat.st_ctime).isoformat()
            self.updated_at = datetime.fromtimestamp(stat.st_mtime).isoformat()

@router.get("/", response_model=List[dict])
async def get_files(
    user_id: int,
    path: str = Query("/", description="Путь к директории"),
    db: Session = Depends(get_db)
):
    """
    Получение списка файлов в указанной директории
    """
    user = db.query(Profile).get(user_id)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Нормализуем путь
    normalized_path = os.path.normpath(os.path.join(UPLOAD_DIR, path.lstrip("/")))
    
    # Проверяем, что путь находится внутри UPLOAD_DIR
    if not normalized_path.startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, что путь существует и это директория
    if not os.path.exists(normalized_path) or not os.path.isdir(normalized_path):
        raise HTTPException(status_code=404, detail="Директория не найдена")
    
    # Получаем список файлов и директорий
    items = []
    for item_name in os.listdir(normalized_path):
        item_path = os.path.join(normalized_path, item_name)
        is_directory = os.path.isdir(item_path)
        file_item = FileItem(item_path, item_name, is_directory)
        items.append({
            "id": file_item.id,
            "name": file_item.name,
            "path": os.path.relpath(file_item.path, UPLOAD_DIR).replace("\\", "/"),
            "size": file_item.size,
            "type": file_item.type,
            "created_at": file_item.created_at,
            "updated_at": file_item.updated_at,
            "is_directory": file_item.is_directory
        })
    
    return items

@router.get("/stats")
async def get_files_stats(
    user_id: int,
    path: str = Query("/", description="Путь к директории"),
    db: Session = Depends(get_db)
):
    """
    Получение статистики по файлам в указанной директории
    """
    user = db.query(Profile).get(user_id)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Нормализуем путь
    normalized_path = os.path.normpath(os.path.join(UPLOAD_DIR, path.lstrip("/")))
    
    # Проверяем, что путь находится внутри UPLOAD_DIR
    if not normalized_path.startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, что путь существует и это директория
    if not os.path.exists(normalized_path) or not os.path.isdir(normalized_path):
        raise HTTPException(status_code=404, detail="Директория не найдена")
    
    # Считаем статистику
    total_files = 0
    total_directories = 0
    total_size = 0
    
    for root, dirs, files in os.walk(normalized_path):
        total_directories += len(dirs)
        total_files += len(files)
        for file in files:
            file_path = os.path.join(root, file)
            total_size += os.path.getsize(file_path)
    
    return {
        "totalFiles": total_files,
        "totalDirectories": total_directories,
        "totalSize": total_size
    }

@router.get("/download")
async def download_file(
    user_id: int,
    path: str = Query(..., description="Путь к файлу"),
    db: Session = Depends(get_db)
):
    """
    Скачивание файла
    """
    user = db.query(Profile).get(user_id)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Нормализуем путь
    normalized_path = os.path.normpath(os.path.join(UPLOAD_DIR, path.lstrip("/")))
    
    # Проверяем, что путь находится внутри UPLOAD_DIR
    if not normalized_path.startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, что файл существует и это не директория
    if not os.path.exists(normalized_path) or os.path.isdir(normalized_path):
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(
        normalized_path,
        filename=os.path.basename(normalized_path),
        media_type=mimetypes.guess_type(normalized_path)[0] or "application/octet-stream"
    )

@router.get("/preview")
async def preview_file(
    user_id: int,
    path: str = Query(..., description="Путь к файлу"),
    db: Session = Depends(get_db)
):
    """
    Предпросмотр файла (для изображений)
    """
    user = db.query(Profile).get(user_id)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Нормализуем путь
    normalized_path = os.path.normpath(os.path.join(UPLOAD_DIR, path.lstrip("/")))
    
    # Проверяем, что путь находится внутри UPLOAD_DIR
    if not normalized_path.startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, что файл существует и это не директория
    if not os.path.exists(normalized_path) or os.path.isdir(normalized_path):
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверяем, что это изображение
    mime_type = mimetypes.guess_type(normalized_path)[0]
    if not mime_type or not mime_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл не является изображением")
    
    return FileResponse(normalized_path, media_type=mime_type)

@router.post("/upload")
async def upload_file(
    user_id: int,
    file: UploadFile = File(...),
    path: str = Query("/", description="Путь к директории для загрузки"),
    db: Session = Depends(get_db)
):
    """
    Загрузка файла
    """
    user = db.query(Profile).get(user_id)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Нормализуем путь
    normalized_path = os.path.normpath(os.path.join(UPLOAD_DIR, path.lstrip("/")))
    
    # Проверяем, что путь находится внутри UPLOAD_DIR
    if not normalized_path.startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, что директория существует
    if not os.path.exists(normalized_path) or not os.path.isdir(normalized_path):
        raise HTTPException(status_code=404, detail="Директория не найдена")
    
    # Сохраняем файл
    file_path = os.path.join(normalized_path, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"message": "Файл успешно загружен", "path": os.path.relpath(file_path, UPLOAD_DIR).replace("\\", "/")}

@router.post("/create-directory")
async def create_directory(
    user_id: int,
    path: str = Query("/", description="Путь к родительской директории"),
    name: str = Query(..., description="Название новой директории"),
    db: Session = Depends(get_db)
):
    """
    Создание новой директории
    """
    user = db.query(Profile).get(user_id)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Нормализуем путь
    normalized_path = os.path.normpath(os.path.join(UPLOAD_DIR, path.lstrip("/")))
    
    # Проверяем, что путь находится внутри UPLOAD_DIR
    if not normalized_path.startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, что родительская директория существует
    if not os.path.exists(normalized_path) or not os.path.isdir(normalized_path):
        raise HTTPException(status_code=404, detail="Родительская директория не найдена")
    
    # Создаем новую директорию
    new_dir_path = os.path.join(normalized_path, name)
    if os.path.exists(new_dir_path):
        raise HTTPException(status_code=400, detail="Директория с таким именем уже существует")
    
    os.makedirs(new_dir_path)
    
    return {"message": "Директория успешно создана", "path": os.path.relpath(new_dir_path, UPLOAD_DIR).replace("\\", "/")}

@router.delete("/")
async def delete_file(
    user_id: int,
    path: str = Query(..., description="Путь к файлу или директории"),
    db: Session = Depends(get_db)
):
    """
    Удаление файла или директории
    """
    user = db.query(Profile).get(user_id)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Нормализуем путь
    normalized_path = os.path.normpath(os.path.join(UPLOAD_DIR, path.lstrip("/")))
    
    # Проверяем, что путь находится внутри UPLOAD_DIR
    if not normalized_path.startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, что файл или директория существует
    if not os.path.exists(normalized_path):
        raise HTTPException(status_code=404, detail="Файл или директория не найдены")
    
    # Удаляем файл или директорию
    if os.path.isdir(normalized_path):
        shutil.rmtree(normalized_path)
    else:
        os.remove(normalized_path)
    
    return {"message": "Файл или директория успешно удалены"} 
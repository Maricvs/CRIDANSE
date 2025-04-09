from sqlalchemy.orm import Session
from pathlib import Path
import os
from models.models import Document
from db import get_db

def cleanup_missing_files(db: Session):
    """
    Проверяет существование файлов документов и удаляет записи из БД,
    если файлы не найдены.
    """
    print("🔍 Начинаем проверку файлов документов...")
    
    # Получаем все документы из БД
    documents = db.query(Document).all()
    print(f"📚 Найдено {len(documents)} документов в базе данных")
    
    deleted_count = 0
    for doc in documents:
        file_path = Path(doc.file_path)
        
        # Проверяем существование файла
        if not file_path.exists():
            print(f"❌ Файл не найден: {file_path}")
            print(f"   Удаляем документ из БД: ID={doc.id}, Название={doc.title}")
            
            # Удаляем запись из БД
            db.delete(doc)
            deleted_count += 1
    
    # Применяем изменения в БД
    db.commit()
    
    print(f"✅ Проверка завершена. Удалено {deleted_count} несуществующих документов")
    return deleted_count

if __name__ == "__main__":
    # Создаем сессию БД
    db = next(get_db())
    try:
        cleanup_missing_files(db)
    finally:
        db.close() 
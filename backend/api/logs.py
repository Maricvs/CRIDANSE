from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter()

# Интерфейс для логов
class LogEntry:
    id: int
    timestamp: str
    level: str
    source: str
    message: str
    details: Optional[str] = None

# Генерация моковых данных для логов
def generate_mock_logs(count: int = 100) -> List[dict]:
    logs = []
    now = datetime.now()
    
    levels = ['info', 'warning', 'error', 'debug']
    sources = ['system', 'auth', 'api', 'database', 'chat']
    
    for i in range(count):
        # Генерируем случайное время в пределах последних 24 часов
        timestamp = now - timedelta(
            hours=random.randint(0, 24),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59)
        )
        
        level = random.choice(levels)
        source = random.choice(sources)
        
        # Генерируем сообщение в зависимости от уровня
        if level == 'info':
            message = random.choice([
                'Пользователь вошел в систему',
                'Новый чат создан',
                'Запрос к API успешно выполнен',
                'Документ загружен',
                'Сессия начата',
            ])
        elif level == 'warning':
            message = random.choice([
                'Превышен лимит запросов',
                'Медленное соединение с базой данных',
                'Большой размер запроса',
                'Неоптимальный запрос',
                'Повторные попытки входа',
            ])
        elif level == 'error':
            message = random.choice([
                'Ошибка подключения к базе данных',
                'Сбой аутентификации',
                'API вернул ошибку',
                'Таймаут запроса',
                'Не удалось обработать файл',
            ])
        else:  # debug
            message = random.choice([
                'Детали запроса',
                'Переменные окружения загружены',
                'Данные кэша обновлены',
                'Состояние сессии',
                'Этапы выполнения запроса',
            ])
        
        # Генерируем детали
        details = f"Детали для {source}: {random.randint(1000, 9999)}"
        
        logs.append({
            'id': i + 1,
            'timestamp': timestamp.isoformat(),
            'level': level,
            'source': source,
            'message': message,
            'details': details
        })
    
    return logs

@router.get("/logs", response_model=List[dict])
async def get_logs(
    level: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
):
    """
    Получение системных логов с возможностью фильтрации
    """
    logs = generate_mock_logs(limit)
    
    # Применяем фильтры
    if level and level != 'all':
        logs = [log for log in logs if log['level'] == level]
    
    if source and source != 'all':
        logs = [log for log in logs if log['source'] == source]
    
    if search:
        search = search.lower()
        logs = [
            log for log in logs 
            if search in log['message'].lower() or 
               search in log['details'].lower() or 
               search in log['source'].lower()
        ]
    
    return logs

@router.delete("/logs/{log_id}")
async def delete_log(log_id: int):
    """
    Удаление лога по ID (в реальном приложении)
    """
    # В реальном приложении здесь будет удаление из базы данных
    return {"message": f"Лог с ID {log_id} успешно удален"} 
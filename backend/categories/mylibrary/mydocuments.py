from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Text, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Таблица для связи многие-ко-многим между документами и тегами
mydocument_tags = Table(
    'mydocument_tags',
    Base.metadata,
    Column('mydocument_id', Integer, ForeignKey('mydocuments.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class MyDocument(Base):
    __tablename__ = 'mydocuments'

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)  # Оригинальное имя файла
    file_path = Column(String(512), nullable=False)  # Путь к файлу в системе
    file_type = Column(String(50), nullable=False)  # MIME тип файла
    file_extension = Column(String(10), nullable=False)  # Расширение файла
    file_size = Column(Integer, nullable=False)  # Размер файла в байтах
    file_hash = Column(String(64))  # Хеш файла для проверки целостности
    
    # Метаданные документа
    language = Column(String(50))  # Определенный язык документа
    content = Column(Text)  # Извлеченный текст
    content_length = Column(Integer)  # Длина текста в символах
    word_count = Column(Integer)  # Количество слов
    page_count = Column(Integer)  # Количество страниц (для PDF)
    
    # Технические метаданные
    processing_status = Column(String(20), default='pending')  # Статус обработки: pending, processing, completed, failed
    processing_error = Column(Text)  # Сообщение об ошибке при обработке
    processing_started_at = Column(DateTime)  # Время начала обработки
    processing_completed_at = Column(DateTime)  # Время завершения обработки
    
    # Метаданные для поиска и фильтрации
    keywords = Column(JSON)  # Ключевые слова
    topics = Column(JSON)  # Основные темы
    summary = Column(Text)  # Краткое содержание
    reading_time = Column(Integer)  # Примерное время чтения в минутах
    
    # Системные поля
    is_archived = Column(Boolean, default=False)  # Архивация документа
    is_favorite = Column(Boolean, default=False)  # Избранное
    last_accessed_at = Column(DateTime)  # Последний доступ
    access_count = Column(Integer, default=0)  # Количество обращений
    
    # Временные метки
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship("User", back_populates="mydocuments")
    tags = relationship("Tag", secondary=mydocument_tags, back_populates="mydocuments")

class Tag(Base):
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    category = Column(String(50), nullable=False)  # например: 'language', 'topic', 'type'
    description = Column(String(255))  # Описание тега
    color = Column(String(7))  # Цвет тега в hex формате
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'))  # Кто создал тег
    
    # Отношения
    mydocuments = relationship("MyDocument", secondary=mydocument_tags, back_populates="tags")
    creator = relationship("User") 
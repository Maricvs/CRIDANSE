# backend/init_db.py

from db import engine
from models.models import Base

if __name__ == "__main__":
    print("⏳ Создание таблиц...")
    Base.metadata.create_all(bind=engine)
    print("✅ Таблицы успешно созданы.")

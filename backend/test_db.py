# backend/test_db.py

from db import SessionLocal

def test_connection():
    try:
        db = SessionLocal()
        result = db.execute("SELECT 1")
        print("✅ Подключение к БД установлено:", result.scalar())
    except Exception as e:
        print("❌ Ошибка подключения:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_connection()

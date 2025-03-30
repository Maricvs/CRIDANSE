import pytest
import os
from fastapi.testclient import TestClient
from main import app
from db import Base, get_db, SessionLocal
from models.models import Profile, Chat, Message

client = TestClient(app)

# Тестовые данные
TEST_USER_ID = 1
TEST_CHAT_ID = 1

@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Очищаем тестовые данные после каждого теста"""
    yield
    if os.getenv("SERVER_ENV") == "production":
        db = SessionLocal()
        try:
            # Удаляем все тестовые сообщения
            db.query(Message).filter(Message.user_id == TEST_USER_ID).delete()
            # Удаляем все тестовые чаты
            db.query(Chat).filter(Chat.user_id == TEST_USER_ID).delete()
            db.commit()
        finally:
            db.close()

# Пропускаем тесты если не на сервере
skip_if_not_server = pytest.mark.skipif(
    os.getenv("SERVER_ENV") != "production",
    reason="Tests should only run on server after deployment"
)

@skip_if_not_server
def test_create_chat():
    response = client.post(
        "/api/chats/",
        json={"user_id": TEST_USER_ID, "title": "Test Chat"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Chat"
    assert "id" in data
    assert "created_at" in data

@skip_if_not_server
def test_get_user_chats():
    # Сначала создаем чат
    client.post("/api/chats/", json={"user_id": TEST_USER_ID, "title": "Test Chat"})
    
    # Получаем список чатов
    response = client.get(f"/api/chats/{TEST_USER_ID}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["title"] == "Test Chat"

@skip_if_not_server
def test_delete_chat():
    # Сначала создаем чат
    create_response = client.post("/api/chats/", json={"user_id": TEST_USER_ID, "title": "Test Chat"})
    chat_id = create_response.json()["id"]
    
    # Удаляем чат
    response = client.delete(f"/api/chats/{chat_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Chat deleted"
    
    # Проверяем, что чат действительно удален
    get_response = client.get(f"/api/chats/{TEST_USER_ID}")
    assert get_response.status_code == 200
    data = get_response.json()
    assert len(data) == 0

@skip_if_not_server
def test_get_messages_by_chat():
    # Сначала создаем чат
    create_response = client.post("/api/chats/", json={"user_id": TEST_USER_ID, "title": "Test Chat"})
    chat_id = create_response.json()["id"]
    
    # Создаем тестовое сообщение
    client.post(
        "/api/chats/message",
        json={
            "user_id": TEST_USER_ID,
            "chat_id": chat_id,
            "role": "user",
            "message": "Test message"
        }
    )
    
    # Получаем сообщения чата
    response = client.get(f"/api/chats/messages/by_chat/{chat_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["message"] == "Test message"

@skip_if_not_server
def test_generate_chat_title():
    response = client.post(
        "/api/gpt/title",
        json={"message": "Как решить квадратное уравнение?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert isinstance(data["title"], str)
    assert len(data["title"]) > 0 
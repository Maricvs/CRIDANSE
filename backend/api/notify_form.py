from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr
from datetime import datetime
import smtplib
from email.message import EmailMessage
import os

router = APIRouter()

# Настройки
EMAIL_FILE_PATH = "/var/www/unlim-mind-ai/uploads/notified_emails.txt"
ADMIN_EMAIL = "maricvs@gmail.com" 
PUBLIC_FILE_URL = "https://unlimcode.com/uploads/notified_emails.txt"

class NotifyRequest(BaseModel):
    email: EmailStr

@router.post("/api/notify")
async def notify_user(req: NotifyRequest):
    # 1. Добавляем в файл
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    os.makedirs(os.path.dirname(EMAIL_FILE_PATH), exist_ok=True)
    with open(EMAIL_FILE_PATH, "a") as f:
        f.write(f"{timestamp} - {req.email}\n")

    # 2. Отправляем email админу
    try:
        msg = EmailMessage()
        msg["Subject"] = "Новая подписка на уведомление"
        msg["From"] = "no-reply@unlimcode.com"
        msg["To"] = ADMIN_EMAIL
        msg.set_content(f"Пользователь оставил email на запуск проекта: {req.email}\n\nСсылка на файл: {PUBLIC_FILE_URL}")

        with smtplib.SMTP("localhost") as smtp:  # или укажи SMTP-сервер
            smtp.send_message(msg)
    except Exception as e:
        print("Ошибка при отправке email:", e)

    return {"status": "ok"}
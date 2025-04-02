from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from datetime import datetime
import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

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
    print("📝 Email записан в файл")

    # 2. Отправляем email админу через Gmail SMTP
    try:
        msg = EmailMessage()
        msg["Subject"] = "Новая подписка на уведомление"
        msg["From"] = SMTP_USER
        msg["To"] = ADMIN_EMAIL
        msg.set_content(f"Пользователь оставил email на запуск проекта: {req.email}\n\nСсылка на файл: {PUBLIC_FILE_URL}")
        print("📬 Подключаюсь к smtp.gmail.com...")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)
        print("✅ Email отправлен")
    except Exception as e:
        print("Ошибка при отправке email:", e)

    return {"status": "ok"}
# backend/main.py

from fastapi import FastAPI
from api import gpt_api, auth, chat





app = FastAPI()

# Затем подключаем остальные роутеры
app.include_router(gpt_api.router, prefix="/api/gpt")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(chat.router, prefix="/api/chats")



# backend/main.py

from fastapi import FastAPI
from api import gpt_api, auth, chat
from app.components.mylibrary.documents import router as documents_router


app = FastAPI()

# Подключаем роутер GPT
app.include_router(gpt_api.router, prefix="/api/gpt")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(chat.router, prefix="/api/chats")
app.include_router(documents_router, prefix="/api/documents")

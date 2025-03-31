# backend/main.py
from db import Base, engine
from fastapi import FastAPI
from api import gpt_api, auth, chat
from app.components.mylibrary import documents
from models.models import Profile

_ = Profile

app = FastAPI()

Base.metadata.create_all(bind=engine)

# Затем подключаем остальные роутеры
app.include_router(gpt_api.router, prefix="/api/gpt")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(chat.router, prefix="/api/chats")
app.include_router(documents.router, prefix="/api/documents")


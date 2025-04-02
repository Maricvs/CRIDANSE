# backend/main.py
from db import Base, engine
from fastapi import FastAPI
from api import gpt_api, auth, chat
from app.components.mylibrary import library_documents
from app.components.document_ai import document_processor_router, document_ai_service_router
from models.models import Profile
from app.models.document_model import Document

_ = Profile
_ = Document

app = FastAPI()

Base.metadata.create_all(bind=engine)

# Затем подключаем остальные роутеры
app.include_router(gpt_api.router, prefix="/api/gpt")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(chat.router, prefix="/api/chats")
app.include_router(library_documents.router, prefix="/api/documents")
app.include_router(document_processor_router, prefix="/api/document_ai/processor")
app.include_router(document_ai_service_router, prefix="/api/document_ai/service")


#backend/main.py
from db import Base, engine
from fastapi import FastAPI
from api import gpt_api, auth, chat, chat_folders
from app.components.mylibrary import library_documents
from app.components.document_ai import document_processor_router, document_ai_service_router
from app.components.teacher import teacher_service
from app.components.documents.admin_document_router import router as admin_documents_router
from models.models import Profile, Document, DocumentChunk
from api import notify_form
from api import logs
from api import users
from fastapi.middleware.cors import CORSMiddleware
from api.admin import auth as admin_auth
from api.admin import files as admin_files
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_ = Profile
_ = Document
_ = DocumentChunk
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.unlimcode.com", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Затем подключаем остальные роутеры
app.include_router(gpt_api.router, prefix="/api/gpt")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(chat_folders.router, prefix="/api/chats")
app.include_router(chat.router, prefix="/api/chats")
app.include_router(library_documents.router, prefix="/api/documents")
app.include_router(document_processor_router, prefix="/api/document_ai/processor")
app.include_router(document_ai_service_router, prefix="/api/document_ai/service")
app.include_router(teacher_service.router, prefix="/api/teacher")
app.include_router(notify_form.router)
app.include_router(logs.router, prefix="/api/logs")
app.include_router(users.router, prefix="/api/users")
app.include_router(admin_auth.router, prefix="/api/admin/auth", tags=["admin-auth"])
app.include_router(admin_documents_router, prefix="/api/admin/documents", tags=["admin-documents"])
app.include_router(admin_files.router, prefix="/api/admin/files", tags=["admin-files"])

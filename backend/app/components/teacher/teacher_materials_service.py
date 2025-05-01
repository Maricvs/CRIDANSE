from sqlalchemy.orm import Session
from models.models import Profile
from app.components.documents.document_service import get_user_documents

async def get_user_materials_list(db: Session, user: Profile) -> str:
    """Возвращает список учебников пользователя для подстановки в prompt"""
    docs = await get_user_documents(db, user)
    if not docs:
        return ""
    return "\n".join([f"- {doc.title}" for doc in docs]) 
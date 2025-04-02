# Пакет для работы с документами и семантическим поиском 

from .document_router import router
from .document_service import (
    upload_document,
    get_user_documents,
    delete_document,
    search_relevant_chunks,
    generate_teacher_response,
    get_context_for_query
)

__all__ = [
    'router',
    'upload_document',
    'get_user_documents',
    'delete_document',
    'search_relevant_chunks',
    'generate_teacher_response',
    'get_context_for_query'
] 
# Package for working with documents and semantic search

from .document_service import (
    get_user_documents,
    delete_document,
    search_relevant_chunks,
    get_context_for_query
)

__all__ = [
    'get_user_documents',
    'delete_document',
    'search_relevant_chunks',
    'get_context_for_query'
]

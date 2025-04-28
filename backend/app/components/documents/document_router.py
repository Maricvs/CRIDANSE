from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from models.models import Profile
from app.schemas.document_schema import Document, SearchQuery, SearchResult
from app.components.documents.document_service import (
    upload_document,
    get_user_documents,
    delete_document,
    search_relevant_chunks,
    generate_teacher_response
)
from api.auth import get_current_user

router = APIRouter()

@router.post("/documents", response_model=Document)
async def create_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads a new document and creates embeddings for it"""
    return await upload_document(db, current_user, file, title)

@router.get("/documents", response_model=List[Document])
async def read_documents(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gets the list of documents for the current user"""
    return await get_user_documents(db, current_user)

@router.delete("/documents/{document_id}")
async def remove_document(
    document_id: int,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a user's document"""
    success = await delete_document(db, document_id, current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document successfully deleted"}

@router.post("/documents/search", response_model=List[SearchResult])
async def search_documents(
    search_query: SearchQuery,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Performs semantic search in user's documents"""
    return await search_relevant_chunks(db, current_user, search_query)


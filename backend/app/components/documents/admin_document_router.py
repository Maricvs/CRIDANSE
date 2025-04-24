from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import os
from datetime import datetime
from fastapi.responses import FileResponse

from db import get_db
from models.models import Document, DocumentChunk, Profile
from app.schemas.document_schema import DocumentCreate, DocumentResponse, DocumentUpdate
from api.auth import get_current_user
from app.services.file_service import save_uploaded_file
from app.components.documents.document_service import process_document_content

router = APIRouter()

UPLOAD_DIR = "/var/www/uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Get list of user documents
    """
    try:
        documents = db.query(Document).filter(
            Document.is_deleted == False
        ).offset(skip).limit(limit).all()
        
        print(f"📦 [INFO] Found {len(documents)} documents for user {current_user.id}")
        return documents
        
    except Exception as e:
        print(f"❌ [ERROR] Error getting documents: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error getting document list"
        )

@router.get("/documents/stats")
async def get_document_stats(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Get user document statistics
    """
    try:
        total = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).count()
        
        total_size = db.query(func.sum(Document.file_size)).filter(
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).scalar() or 0
        
        print(f"📊 [INFO] Document statistics for user {current_user.id}: {total} documents, {total_size} bytes")
        
        return {
            "total": total,
            "total_size": total_size,
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ [ERROR] Error getting statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error getting document statistics"
        )

@router.post("/documents", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Create new document
    """
    try:
        # Save file through unified service
        file_path, original_filename, file_size = await save_uploaded_file(file)
        
        # Create document in DB
        db_document = Document(
            title=document.title,
            description=document.description,
            file_name=original_filename,
            file_type=document.file_type,
            file_size=file_size,
            file_path=file_path,
            user_id=current_user.id
        )
        
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        # Vectorize document
        try:
            await process_document_content(db_document.id, db)
            print(f"✅ [INFO] Document successfully vectorized: id={db_document.id}, title={db_document.title}")
        except Exception as process_err:
            print(f"⚠️ [WARNING] Error vectorizing document: {str(process_err)}")
        
        return db_document
        
    except Exception as e:
        print(f"❌ [ERROR] Error creating document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error creating document"
        )

@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Update existing document
    """
    try:
        # Get document and check access rights
        db_document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).first()
        
        if not db_document:
            raise HTTPException(
                status_code=404,
                detail="Document not found or you don't have permission to edit it"
            )
        
        # Update only allowed fields
        for field, value in document.dict(exclude_unset=True).items():
            setattr(db_document, field, value)
        
        db_document.updated_at = datetime.now()
        db.commit()
        db.refresh(db_document)
        
        print(f"✅ [INFO] Document successfully updated: id={db_document.id}")
        return db_document
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Error updating document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error updating document"
        )

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Delete document (soft delete)
    """
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found or you don't have permission to delete it"
            )
        
        document.is_deleted = True
        document.updated_at = datetime.now()
        db.commit()
        
        print(f"✅ [INFO] Document successfully deleted: id={document_id}")
        return {"message": "Document successfully deleted"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Error deleting document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error deleting document"
        )

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Download document
    """
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found or you don't have permission to download it"
            )
        
        if not os.path.exists(document.file_path):
            raise HTTPException(
                status_code=404,
                detail="File not found on server"
            )
        
        print(f"✅ [INFO] Document successfully downloaded: id={document_id}")
        return FileResponse(
            document.file_path,
            filename=document.file_name,
            media_type=document.file_type
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Error downloading document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error downloading document"
        )

@router.get("/documents/{document_id}/vectorization")
async def get_document_vectorization(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """
    Get document vectorization information
    """
    try:
        # Get document
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        # Get document chunks
        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id
        ).order_by(DocumentChunk.chunk_index).all()
        
        return {
            "total_chunks": len(chunks),
            "chunks": [
                {
                    "id": chunk.id,
                    "index": chunk.chunk_index,
                    "content_preview": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                    "embedding_size": len(chunk.embedding) if chunk.embedding else 0,
                    "created_at": chunk.created_at
                }
                for chunk in chunks
            ]
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ [ERROR] Error getting vectorization information: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error getting document vectorization information"
        ) 
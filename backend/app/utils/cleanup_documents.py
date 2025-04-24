from sqlalchemy.orm import Session
from pathlib import Path
from models.models import Document
from db import get_db

def cleanup_missing_files(db: Session):
    """
    Check document files existence and delete records from DB
    if files are not found.
    """
    print("🔍 Starting document files check...")
    
    # Get all documents from DB
    documents = db.query(Document).all()
    print(f"📚 Found {len(documents)} documents in database")
    
    deleted_count = 0
    for doc in documents:
        file_path = Path(doc.file_path)
        
        # Check file existence
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            print(f"   Deleting document from DB: ID={doc.id}, Title={doc.title}")
            
            # Delete record from DB
            db.delete(doc)
            deleted_count += 1
    
    # Apply changes to DB
    db.commit()
    
    print(f"✅ Check completed. Deleted {deleted_count} non-existent documents")
    return deleted_count

if __name__ == "__main__":
    # Create DB session
    db = next(get_db())
    try:
        cleanup_missing_files(db)
    finally:
        db.close() 
from fastapi import UploadFile, HTTPException
from pathlib import Path
import os
import uuid
from datetime import datetime
import re
from typing import Optional, Tuple
import shutil

# Configuration
UPLOAD_DIR = Path("/var/www/uploads/documents")
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB
ALLOWED_FILE_TYPES = {'pdf', 'doc', 'docx', 'txt', 'rtf'}

def sanitize_filename(filename: str) -> str:
    """Sanitize filename"""
    # Remove all unsafe characters
    filename = re.sub(r'[^a-zA-Z0-9.-]', '_', filename)
    # Remove multiple underscores
    filename = re.sub(r'_+', '_', filename)
    return filename

def validate_file(file: UploadFile) -> bool:
    """Validate file against requirements"""
    # Check file type
    file_extension = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if file_extension not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_FILE_TYPES)}"
        )
    
    return True

def ensure_upload_dir() -> None:
    """Create upload directory if it doesn't exist"""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def save_uploaded_file(
    file: UploadFile,
    subdirectory: Optional[str] = None
) -> Tuple[str, str, int]:
    """
    Save uploaded file and return information about it
    
    Args:
        file: Uploaded file
        subdirectory: Subdirectory for saving (optional)
        
    Returns:
        tuple[str, str, int]: (file path, original filename, file size)
    """
    try:
        # Validate file
        validate_file(file)
        
        # Create directory based on current date
        current_date = datetime.now()
        year_dir = UPLOAD_DIR / str(current_date.year)
        month_dir = year_dir / f"{current_date.month:02d}"
        
        if subdirectory:
            month_dir = month_dir / subdirectory
            
        month_dir.mkdir(parents=True, exist_ok=True)
        
        # Read file content for size check
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE/1024/1024}MB"
            )
        
        # Generate safe filename
        original_filename = sanitize_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}_{int(datetime.now().timestamp())}{file_extension}"
        file_path = month_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        print(f"✅ [INFO] File successfully saved: {file_path}")
        
        return str(file_path), original_filename, len(content)
        
    except Exception as e:
        print(f"❌ [ERROR] Error saving file: {str(e)}")
        # Safely delete file if it was already created
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as remove_err:
                print(f"⚠️ [WARNING] Unable to delete file on error: {str(remove_err)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error saving file: {str(e)}"
        )

async def delete_file(file_path: str) -> bool:
    """
    Delete file from disk
    
    Args:
        file_path: File path
        
    Returns:
        bool: True if file successfully deleted, False if file not found
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"✅ [INFO] File successfully deleted: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"❌ [ERROR] Error deleting file {file_path}: {str(e)}")
        return False

def get_file_info(file_path: str) -> dict:
    """
    Get file information
    
    Args:
        file_path: File path
        
    Returns:
        dict: File information (size, type, creation date)
    """
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
            
        stats = os.stat(file_path)
        return {
            "size": stats.st_size,
            "created_at": datetime.fromtimestamp(stats.st_ctime),
            "modified_at": datetime.fromtimestamp(stats.st_mtime),
            "file_type": os.path.splitext(file_path)[1].lower().lstrip('.')
        }
    except Exception as e:
        print(f"❌ [ERROR] Error getting file information {file_path}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting file information: {str(e)}"
        ) 
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from api.auth import get_current_regular_user
from models.models import Profile, ChatFolder, Chat
from app.schemas.chat_folder_schema import (
    ChatFolderCreate,
    ChatFolderSchema,
    ChatFolderAssignBody,
    ChatFolderAssignmentResponse,
)

router = APIRouter()


@router.post("/folders", response_model=ChatFolderSchema, status_code=status.HTTP_201_CREATED)
def create_folder(
    body: ChatFolderCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_regular_user),
):
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder name is required",
        )
    if len(name) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder name is too long",
        )
    folder = ChatFolder(user_id=current_user.id, name=name)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.get("/folders", response_model=List[ChatFolderSchema])
def list_my_folders(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_regular_user),
):
    return (
        db.query(ChatFolder)
        .filter(ChatFolder.user_id == current_user.id)
        .order_by(ChatFolder.created_at.desc())
        .all()
    )


@router.put("/{chat_id}/folder", response_model=ChatFolderAssignmentResponse)
def assign_chat_to_folder(
    chat_id: int,
    body: ChatFolderAssignBody,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_regular_user),
):
    chat = (
        db.query(Chat)
        .filter(Chat.id == chat_id, Chat.user_id == current_user.id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

    folder = (
        db.query(ChatFolder)
        .filter(
            ChatFolder.id == body.folder_id,
            ChatFolder.user_id == current_user.id,
        )
        .first()
    )
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    chat.folder_id = folder.id
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


@router.delete("/{chat_id}/folder", response_model=ChatFolderAssignmentResponse)
def remove_chat_from_folder(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_regular_user),
):
    chat = (
        db.query(Chat)
        .filter(Chat.id == chat_id, Chat.user_id == current_user.id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

    chat.folder_id = None
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat

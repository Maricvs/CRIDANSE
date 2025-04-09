from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from models.models import Profile
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    oauth_provider: str
    created_at: datetime
    avatar_url: str | None
    is_admin: bool
    status: str

    class Config:
        orm_mode = True

class UserCreateUpdate(BaseModel):
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    is_admin: bool = False
    status: str = "active"

    class Config:
        orm_mode = True

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    db: Session = Depends(get_db)
):
    """Получение списка пользователей с возможностью поиска"""
    query = db.query(Profile)
    
    if search:
        search = f"%{search}%"
        query = query.filter(
            (Profile.email.ilike(search)) |
            (Profile.full_name.ilike(search))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Получение информации о конкретном пользователе"""
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Удаление пользователя"""
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    try:
        db.delete(user)
        db.commit()
        return {"message": "Пользователь успешно удален"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=UserResponse)
async def create_user(user_data: UserCreateUpdate, db: Session = Depends(get_db)):
    new_user = Profile(**user_data.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: UserCreateUpdate, db: Session = Depends(get_db)):
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    for key, value in user_data.dict().items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user
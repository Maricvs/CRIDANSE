# backend/api/auth.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db import SessionLocal
from models.models import Profile

router = APIRouter()

class OAuthProfile(BaseModel):
    oauth_provider: str
    provider_user_id: str
    email: str
    full_name: str | None = None
    avatar_url: str | None = None

@router.post("/oauth")
def save_oauth_profile(profile: OAuthProfile):
    db: Session = SessionLocal()
    try:
        existing = db.query(Profile).filter_by(provider_user_id=profile.provider_user_id).first()
        if existing:
            return {"message": "User already exists", "user_id": existing.id}

        new_user = Profile(
            oauth_provider=profile.oauth_provider,
            provider_user_id=profile.provider_user_id,
            email=profile.email,
            full_name=profile.full_name,
            avatar_url=profile.avatar_url,
            # created_at не указываем — добавится автоматически
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User created", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

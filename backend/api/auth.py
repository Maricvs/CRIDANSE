# backend/api/auth.py

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from db import get_db
from models.models import Profile

# Загружаем переменные окружения
load_dotenv()

router = APIRouter()

# Настройки JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")  # В продакшене обязательно установить JWT_SECRET_KEY в .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class OAuthProfile(BaseModel):
    oauth_provider: str
    provider_user_id: str
    email: str
    full_name: str | None = None
    avatar_url: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Profile:
    """
    Получение текущего пользователя по JWT токену.
    Проверяет валидность токена и возвращает профиль пользователя.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Декодируем JWT токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
        # Получаем пользователя из базы
        user = db.query(Profile).filter(Profile.email == email).first()
        if user is None:
            raise credentials_exception
            
        # Проверяем, что пользователь активен
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Пользователь неактивен"
            )
            
        return user
        
    except JWTError:
        raise credentials_exception
    except Exception as e:
        print(f"❌ [ERROR] Ошибка при аутентификации: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при аутентификации"
        )

@router.post("/oauth")
def save_oauth_profile(profile: OAuthProfile, db: Session = Depends(get_db)):
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

@router.post("/token", response_model=Token)
async def login_for_access_token(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """
    Получение JWT токена для аутентификации
    """
    # В реальном приложении здесь должна быть проверка пароля
    user = db.query(Profile).filter(Profile.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверяем статус пользователя
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь неактивен"
        )
    
    # Создаем токен
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

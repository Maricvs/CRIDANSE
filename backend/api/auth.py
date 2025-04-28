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
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
USER_SECRET_KEY = os.getenv("USER_JWT_SECRET_KEY", "user-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
USER_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("USER_JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

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

def create_user_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, USER_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_user_refresh_token(data: dict):
    expire = datetime.utcnow() + timedelta(days=7)  # Можно срок через .env если хочешь
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, USER_SECRET_KEY, algorithm=ALGORITHM)
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

async def get_current_regular_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Profile:
    """
    Получение текущего обычного пользователя по JWT токену.
    Проверяет валидность токена и возвращает профиль пользователя.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Декодируем JWT токен
        payload = jwt.decode(token, USER_SECRET_KEY, algorithms=[ALGORITHM])
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
            # Создаем токен для существующего пользователя
            access_token = create_user_access_token(
                data={"sub": existing.email},
                expires_delta=timedelta(minutes=USER_ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            refresh_token = create_user_refresh_token(
                data={"sub": existing.email}
            )
            response_data = {
                "message": "User already exists",
                "user_id": existing.id,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
            print(f"🟢 Returning data for existing user: {response_data}")
            return response_data

        new_user = Profile(
            oauth_provider=profile.oauth_provider,
            provider_user_id=profile.provider_user_id,
            email=profile.email,
            full_name=profile.full_name,
            avatar_url=profile.avatar_url,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Создаем токен для нового пользователя
        access_token = create_user_access_token(
            data={"sub": new_user.email},
            expires_delta=timedelta(minutes=USER_ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_user_refresh_token(
            data={"sub": new_user.email}
        )
        response_data = {
            "message": "User created",
            "user_id": new_user.id,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
        print(f"🟢 Returning data for new user: {response_data}")
        return response_data
    except Exception as e:
        db.rollback()
        print(f"❌ Error in save_oauth_profile: {str(e)}")
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

@router.post("/refresh")
async def refresh_token(refresh_token: str = Body(...), db: Session = Depends(get_db)):
    try:
        # Декодируем refresh_token
        payload = jwt.decode(refresh_token, USER_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token"
            )

        # Получаем пользователя
        user = db.query(Profile).filter(Profile.email == email).first()
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        # Проверяем статус пользователя
        if user.status != "active":
            raise HTTPException(
                status_code=403,
                detail="User inactive"
            )

        # Создаем новые токены
        access_token_expires = timedelta(minutes=USER_ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_user_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires
        )
        new_refresh_token = create_user_refresh_token(data={"sub": user.email})

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )
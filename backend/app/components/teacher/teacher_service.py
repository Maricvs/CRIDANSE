from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from app.models.teacher_model import TeacherSession, TeacherMessage
from app.schemas.teacher_schema import TeacherSessionCreate, TeacherMessageCreate, TeacherSession as TeacherSessionSchema
from typing import List
import openai

router = APIRouter()

def get_teacher_prompt(topic: str, level: str) -> str:
    return f"""Ты - опытный преподаватель, который обучает теме "{topic}" на уровне {level}.
    Твоя задача:
    1. Не давать прямых ответов на учебные задания
    2. Задавать наводящие вопросы
    3. Давать подсказки и направлять ученика
    4. Проверять понимание материала
    5. Адаптировать объяснения под уровень знаний ученика
    6. Строить обучение поэтапно
    
    Если ученик просит объяснить что-то - давай подробное объяснение, адаптированное под его уровень.
    Если ученик решает задачу - помогай наводящими вопросами, но не давай готового решения.
    """

def get_teacher_response(messages: List[dict], topic: str, level: str) -> str:
    client = openai.OpenAI()
    
    system_prompt = get_teacher_prompt(topic, level)
    
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": system_prompt},
            *messages
        ],
        temperature=0.7,
        max_tokens=1000
    )
    
    return response.choices[0].message.content

@router.post("/sessions/", response_model=TeacherSessionSchema)
def create_session(session: TeacherSessionCreate, db: Session = Depends(get_db)):
    db_session = TeacherSession(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions/{session_id}", response_model=TeacherSessionSchema)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(TeacherSession).filter(TeacherSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/sessions/{session_id}/messages/", response_model=TeacherMessage)
async def create_message(session_id: int, message: TeacherMessageCreate, db: Session = Depends(get_db)):
    # Сохраняем сообщение ученика
    db_message = TeacherMessage(**message.dict())
    db.add(db_message)
    
    # Получаем историю сообщений
    messages = db.query(TeacherMessage).filter(TeacherMessage.session_id == session_id).all()
    messages_history = [{"role": msg.role, "content": msg.content} for msg in messages]
    
    # Получаем информацию о сессии
    session = db.query(TeacherSession).filter(TeacherSession.id == session_id).first()
    
    # Получаем ответ учителя
    teacher_response = get_teacher_response(messages_history, session.topic, session.level)
    
    # Сохраняем ответ учителя
    db_teacher_message = TeacherMessage(
        session_id=session_id,
        content=teacher_response,
        role="teacher"
    )
    db.add(db_teacher_message)
    
    db.commit()
    db.refresh(db_teacher_message)
    return db_teacher_message 
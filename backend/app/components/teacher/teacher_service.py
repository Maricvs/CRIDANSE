from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from db import get_db
from app.models.teacher_model import TeacherSession, TeacherProgress
from app.schemas.teacher_schema import (
    TeacherSessionCreate,
    TeacherSession as TeacherSessionSchema,
    TeacherProgressRead,
)
from typing import List, Optional
from app.schemas.message_schema import MessageSchema, MessageBase
from openai import OpenAI
from models.models import Profile, Message, Chat
from app.components.documents.document_service import get_context_for_query, get_user_documents
from api.auth import get_current_regular_user
from app.components.teacher.teacher_materials_service import get_user_materials_list
from dotenv import load_dotenv
from datetime import datetime
import os
import re


router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _attach_teacher_progress_for_new_session(db: Session, session: TeacherSession) -> None:
    """Insert TeacherProgress for a newly added session. Call after flush() so session.id is set."""
    db.add(
        TeacherProgress(
            teacher_session_id=session.id,
            user_id=session.user_id,
            status="active",
            current_objective=None,
            completion_estimate=None,
        )
    )


def get_teacher_progress_by_session_id(
    db: Session, session_id: int
) -> Optional[TeacherProgress]:
    """Return TeacherProgress for the given teacher session id, or None if missing."""
    return (
        db.query(TeacherProgress)
        .filter(TeacherProgress.teacher_session_id == session_id)
        .first()
    )


def _update_teacher_progress_after_interaction(
    db: Session, session: TeacherSession
) -> None:
    """Bump TeacherProgress after a teacher reply. No-op if row missing."""
    progress = get_teacher_progress_by_session_id(db, session.id)
    if not progress:
        return
    progress.updated_at = datetime.utcnow()
    if progress.current_objective is None:
        t = (session.topic or "").strip()
        progress.current_objective = (t[:512] if t else "learning started")
    prev = progress.completion_estimate if progress.completion_estimate is not None else 0
    progress.completion_estimate = min(100, prev + 5)


def get_teacher_prompt(topic: str = None, level: str = None, context: str = "") -> str:
    if topic and level:
        base_prompt = f"""Ты - идеальный и опытный преподаватель-репетитор, который обучает пользователя теме '{topic}' на уровне {level}.
        \nТвоя задача:
        1. СТРОЖАЙШЕ ЗАПРЕЩЕНО давать прямые ответы на учебные задания или решать задачи за ученика.
        2. Задавай наводящие вопросы, чтобы ученик сам пришел к правильному ответу.
        3. Давай методичные подсказки и направляй размышления ученика.
        4. Проверяй понимание материала на каждом шаге. Не переходи к следующему шагу, пока не убедишься, что текущий усвоен.
        5. Адаптируй свои объяснения под заявленный уровень знаний ({level}).
        6. Строй обучение поэтапно, от простого к сложному.
        7. Используй загруженные материалы для точных и релевантных ответов.
        8. Всегда цитируй источники при использовании информации из документов.\n
        \nЕсли ученик просит объяснить что-то - давай подробное, но доходчивое объяснение.
        \nЕщё раз: НИКОГДА не решай задачу за ученика напрямую! Всегда помогай ему справиться с ней самостоятельно, выступая в роли идеального методичного репетитора.\n"""
    else:
        base_prompt = (
            "Ты — доброжелательный и опытный преподаватель-репетитор. Твоя текущая задача — определить, какую тему (или предмет) хочет изучать ученик, и каков его примерный уровень знаний.\n"
            "1. Если ученик явно указывает тему (например, 'хочу изучать математику' или 'тема: физика'), "
            "спроси, хочет ли он продолжить существующую сессию по этой теме или начать новую.\n"
            "2. Если ученик не указывает тему, задавай дружелюбные наводящие вопросы, чтобы определить, что именно его интересует.\n"
            "3. После определения темы, задай вопросы для определения уровня знаний ученика (например, класс, курс или уровень владения).\n"
            "4. Поддерживай диалог, пока четко не выяснишь и тему, и уровень.\n"
            "5. КАК ТОЛЬКО ты точно определишь тему и уровень ученика, обязательно и строго в конце своего следующего ответа выведи техническую строку ровно в таком формате:\n"
            "Тема: <название темы>; Уровень: <уровень>\n"
            "Например: 'Отлично, давай изучать алгебру! Тема: Алгебра; Уровень: 8 класс'"
        )
    if context:
        context_prompt = f"""
        У меня есть доступ к следующим учебным материалам:
        \n{context}\n\nЯ буду использовать эти материалы как основу для объяснений и отвечать на вопросы, опираясь на них.\nКогда я цитирую материал, я указываю из какого документа взята информация.\nЯ также могу дополнять информацию из материалов своими знаниями для лучшего объяснения."""
        return base_prompt + context_prompt
    return base_prompt

def convert_role_for_openai(role: str) -> str:
    if role == "teacher":
        return "assistant"
    return role

async def get_teacher_response(messages: List[dict], topic: str, level: str, user_id: int = None, db: Session = None, session: TeacherSession = None) -> str:
    # Получаем контекст из документов пользователя
    context = ""
    materials_list = ""
    selected_document_id = None
    if session:
        selected_document_id = session.selected_document_id
    if user_id and db:
        user = db.query(Profile).filter(Profile.id == user_id).first()
        if user:
            # Получаем список учебников пользователя
            materials_list = await get_user_materials_list(db, user)
            # Используем последние 2 сообщения для лучшего контекста
            last_messages = [m["content"] for m in reversed(messages[-5:]) if m["role"] == "user"]
            if last_messages:
                # Объединяем сообщения для поиска контекста
                query = " ".join(last_messages)
                # Если выбран учебник, ищем только по нему
                if selected_document_id:
                    docs = await get_user_documents(db, user)
                    doc_ids = [doc.id for doc in docs if doc.id == selected_document_id]
                    if doc_ids:
                        context = await get_context_for_query(db, user, query, limit=5, document_ids=doc_ids)
                else:
                    context = await get_context_for_query(db, user, query)
    # Формируем prompt
    materials_prompt = ""
    if materials_list:
        materials_prompt = f"\nУ тебя есть доступ к следующим учебникам пользователя:\n{materials_list}\n"
    else:
        materials_prompt = "\nУ тебя нет загруженных учебников. Попроси пользователя загрузить учебник через раздел 'Моя библиотека'.\n"
    system_prompt = get_teacher_prompt(topic, level, context) + materials_prompt
    
    # Преобразуем роли для OpenAI и добавляем контекст к первому сообщению пользователя
    openai_messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Добавляем историю сообщений
    for msg in messages:
        if msg.get("content"):
            openai_messages.append({
                "role": convert_role_for_openai(msg["role"]),
                "content": msg["content"]
            })
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=openai_messages,
        temperature=0.7,
        max_tokens=1000
    )
    
    return response.choices[0].message.content

@router.post("/sessions/", response_model=TeacherSessionSchema)
def create_session(session: TeacherSessionCreate, db: Session = Depends(get_db)):
    # Если указана тема, ищем существующую сессию
    if session.topic:
        existing_session = db.query(TeacherSession).filter(
            TeacherSession.user_id == session.user_id,
            TeacherSession.topic == session.topic
        ).first()
        if existing_session:
            return existing_session
    
    # Если сессия не найдена или тема не указана, создаем новую
    db_session = TeacherSession(**session.dict())
    db.add(db_session)
    db.flush()
    _attach_teacher_progress_for_new_session(db, db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions/{session_id}", response_model=TeacherSessionSchema)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(TeacherSession).filter(TeacherSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/sessions/{session_id}/progress", response_model=TeacherProgressRead)
def get_session_progress(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_regular_user),
):
    session = db.query(TeacherSession).filter(TeacherSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    progress = get_teacher_progress_by_session_id(db, session_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    return TeacherProgressRead(
        status=progress.status,
        current_objective=progress.current_objective,
        completion_estimate=progress.completion_estimate,
    )


@router.post("/sessions/{session_id}/messages/", response_model=MessageSchema)
async def create_message(session_id: int, message: MessageBase, db: Session = Depends(get_db)):
    # Сохраняем сообщение ученика в chats.messages
    session = db.query(TeacherSession).filter(TeacherSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    chat = db.query(Chat).filter(Chat.teacher_session_id == session.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found for this teacher session")
    db_message = Message(
        user_id=session.user_id,
        chat_id=chat.id,
        role=message.role,
        message=message.message
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # Получаем историю сообщений
    messages = db.query(Message).filter(Message.chat_id == chat.id).order_by(Message.created_at).all()
    messages_history = [{"role": msg.role, "content": msg.message} for msg in messages]

    # Получаем ответ учителя
    teacher_response = await get_teacher_response(
        messages_history,
        session.topic,
        session.level,
        session.user_id,
        db,
        session
    )
    # Сохраняем ответ учителя
    db_teacher_message = Message(
        user_id=session.user_id,
        chat_id=chat.id,
        role="teacher",
        message=teacher_response
    )
    db.add(db_teacher_message)
    _update_teacher_progress_after_interaction(db, session)
    db.commit()
    db.refresh(db_teacher_message)
    return db_teacher_message

@router.get("/sessions/{session_id}/messages/", response_model=List[MessageSchema])
def get_session_messages(session_id: int, db: Session = Depends(get_db)):
    session = db.query(TeacherSession).filter(TeacherSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    chat = db.query(Chat).filter(Chat.teacher_session_id == session.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found for this teacher session")
    messages = db.query(Message).filter(Message.chat_id == chat.id).order_by(Message.created_at).all()
    return messages

async def create_teacher_session(
    db: Session,
    user: Profile,
    session_data: TeacherSessionCreate
) -> TeacherSession:
    """Создает новую сессию учителя для пользователя"""
    # Если указана тема, проверяем существующие сессии
    if session_data.topic:
        existing_session = db.query(TeacherSession).filter(
            TeacherSession.user_id == user.id,
            TeacherSession.topic == session_data.topic
        ).first()
        if existing_session:
            return existing_session
    
    # Если сессия не найдена или тема не указана, создаем новую
    db_session = TeacherSession(
        user_id=user.id,
        topic=session_data.topic,
        level=session_data.level
    )
    db.add(db_session)
    db.flush()
    _attach_teacher_progress_for_new_session(db, db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

async def get_teacher_session(
    db: Session,
    user: Profile,
    session_id: int
) -> TeacherSession:
    """Получает сессию учителя по ID"""
    session = db.query(TeacherSession).filter(
        TeacherSession.id == session_id,
        TeacherSession.user_id == user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Сессия учителя не найдена")
    
    return session

async def send_teacher_message(
    db: Session,
    user: Profile,
    session_id: int,
    chat_id: int, 
    message: str
) -> Message:
    """Отправляет сообщение в сессию учителя и получает ответ"""
    # Проверяем существование сессии
    session = await get_teacher_session(db, user, session_id)

    # Сохраняем сообщение ученика в Message
    student_message = Message(
        user_id=user.id,
        chat_id=chat_id,
        role="user",
        message=message
    )
    db.add(student_message)

    # Получаем историю сообщений
    messages = db.query(Message).filter(Message.chat_id == chat_id).all()
    messages_history = [{"role": msg.role, "content": msg.message} for msg in messages]

    # Получаем ответ учителя
    teacher_response = await get_teacher_response(
        messages_history,
        session.topic,
        session.level,
        user.id,
        db,
        session
    )

    # Сохраняем ответ учителя в Message
    teacher_message = Message(
        user_id=user.id,
        chat_id=chat_id,
        role="teacher",
        message=teacher_response
    )
    db.add(teacher_message)
    _update_teacher_progress_after_interaction(db, session)

    db.commit()
    db.refresh(teacher_message)
    return teacher_message

@router.post("/ask", response_model=MessageSchema)
async def ask_teacher_advanced(
    request: dict,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_regular_user)
):
    """
    Продвинутый endpoint для режима учителя с параметрами topic и level
    """
    prompt = request.get("prompt")
    chat_id = request.get("chat_id")
    session_id = request.get("session_id")
    user_id = request.get("user_id")
    topic = request.get("topic")
    level = request.get("level")
    
    # Проверяем, что user_id совпадает с текущим пользователем
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Доступ запрещен"
        )
    
    # Если topic определён, ищем или создаём сессию по (user_id, topic)
    if topic:
        session = get_or_create_teacher_session(db, current_user.id, topic, level, chat_id=chat_id)
        session_id = session.id
        # Отправляем сообщение и получаем ответ
        message = await send_teacher_message(
            db,
            current_user,
            session_id,
            chat_id,
            prompt
        )
        return message
    else:
        # Если topic не определён, сохраняем сообщение пользователя и ответ ИИ в Message
        # 1. Сохраняем сообщение пользователя
        db_user_message = Message(
            user_id=current_user.id,
            chat_id=chat_id,
            role="user",
            message=prompt
        )
        db.add(db_user_message)
        db.commit()
        db.refresh(db_user_message)
        # 2. Получаем историю сообщений (включая только что добавленное)
        messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at).all()
        messages_history = [{"role": msg.role, "content": msg.message} for msg in messages]
        # 3. Получаем ответ учителя
        teacher_response = await get_teacher_response(
            messages_history,
            topic=None,
            level=None,
            user_id=current_user.id,
            db=db,
            session=None
        )
        # 4. Сохраняем ответ учителя
        db_teacher_message = Message(
            user_id=current_user.id,
            chat_id=chat_id,
            role="teacher",
            message=teacher_response
        )
        db.add(db_teacher_message)
        db.commit()
        db.refresh(db_teacher_message)
        
        # 5. Парсим тему и уровень из ответа
        match = re.search(r"Тема:\s*([^;]+);\s*Уровень:\s*(.+)", teacher_response, re.IGNORECASE)
        session_id_to_return = None
        if match:
            new_topic = match.group(1).strip()
            new_level = match.group(2).strip()
            session = get_or_create_teacher_session(db, current_user.id, new_topic, new_level, chat_id=chat_id)
            session_id_to_return = session.id
            _update_teacher_progress_after_interaction(db, session)
            db.commit()

        # 6. Возвращаем последнее сообщение учителя с session_id
        response_data = {
            "id": db_teacher_message.id,
            "user_id": db_teacher_message.user_id,
            "chat_id": db_teacher_message.chat_id,
            "role": db_teacher_message.role,
            "message": db_teacher_message.message,
            "created_at": db_teacher_message.created_at,
            "session_id": session_id_to_return
        }
        return response_data

@router.put("/sessions/{session_id}/topic_level", response_model=TeacherSessionSchema)
def update_topic_level(session_id: int, data: dict = Body(...), db: Session = Depends(get_db)):
    """Позволяет обновить topic и level в сессии учителя"""
    session = db.query(TeacherSession).filter(TeacherSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    topic = data.get("topic")
    level = data.get("level")
    if topic is not None:
        session.topic = topic
    if level is not None:
        session.level = level
    db.commit()
    db.refresh(session)
    return session

def get_or_create_teacher_session(db: Session, user_id: int, topic: str, level: str = None, chat_id: int = None) -> TeacherSession:
    chat = None
    if chat_id:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if chat and chat.teacher_session_id:
            session = db.query(TeacherSession).filter(TeacherSession.id == chat.teacher_session_id).first()
            if session:
                return session

    # Создаем новую сессию, не ищем по (user_id, topic) среди других чатов
    session = TeacherSession(user_id=user_id, topic=topic, level=level)
    db.add(session)
    db.flush()
    _attach_teacher_progress_for_new_session(db, session)
    db.commit()
    db.refresh(session)
    
    if chat:
        chat.is_teacher_chat = True
        chat.teacher_session_id = session.id
        db.add(chat)
        db.commit()
        
    return session 
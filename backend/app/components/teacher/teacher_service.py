from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from db import get_db
from app.models.teacher_model import TeacherSession
from app.schemas.teacher_schema import TeacherSessionCreate, TeacherSession as TeacherSessionSchema
from typing import List
from app.schemas.message_schema import MessageSchema, MessageBase
from openai import OpenAI
from models.models import Profile, Message, Chat
from app.components.documents.document_service import get_context_for_query, get_user_documents
from api.auth import get_current_regular_user
from app.components.teacher.teacher_materials_service import get_user_materials_list


router = APIRouter()

client = OpenAI()

def get_teacher_prompt(topic: str = None, level: str = None, context: str = "") -> str:
    if topic and level:
        base_prompt = f"""Ты - опытный преподаватель, который обучает теме '{topic}' на уровне {level}.
        \nТвоя задача:
        1. Не давать прямых ответов на учебные задания
        2. Задавать наводящие вопросы
        3. Давать подсказки и направлять ученика
        4. Проверять понимание материала
        5. Адаптировать объяснения под уровень знаний ученика
        6. Строить обучение поэтапно
        7. Использовать загруженные материалы для более точных и релевантных ответов
        8. Цитировать источники при использовании информации из документов\n
        \nЕсли ученик просит объяснить что-то - давай подробное объяснение, адаптированное под его уровень.
        \nЕсли ученик решает задачу - помогай наводящими вопросами, но не давай готового решения.\n
        \nЕсли ты определил тему и уровень ученика, обязательно явно сообщи об этом в ответе в формате: 'Тема: <...>; Уровень: <...>'."""
    else:
        base_prompt = (
            "Ты — опытный преподаватель. Твоя задача — определить, какую тему хочет изучать ученик.\n"
            "1. Если ученик явно указывает тему (например, 'хочу изучать математику' или 'тема: физика'), "
            "спроси, хочет ли он продолжить существующую сессию по этой теме или начать новую.\n"
            "2. Если ученик не указывает тему, задавай наводящие вопросы, чтобы определить, что именно его интересует.\n"
            "3. После определения темы, задай вопросы для определения уровня знаний ученика.\n"
            "4. Не создавай новую сессию, пока не убедишься, что ученик хочет изучать новую тему.\n"
            "5. Если ученик хочет продолжить существующую сессию, используй контекст из предыдущих сообщений.\n"
            "Когда определишь тему и уровень, сообщи об этом в формате: 'Тема: <...>; Уровень: <...>'."
        )
    if context:
        context_prompt = f"""
        У меня есть доступ к следующим учебным материалам:
        \n{context}\n\nЯ буду использовать эти материалы как основу для объяснений и отвечать на вопросы, опираясь на них.\nКогда я цитирую материал, я указываю из какого документа взята информация.\nЯ также могу дополнять информацию из материалов своими знаниями для лучшего объяснения."""
        return base_prompt + context_prompt
    return base_prompt

def convert_role_for_openai(role: str) -> str:
    if role == "student":
        return "user"
    elif role == "teacher":
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
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions/{session_id}", response_model=TeacherSessionSchema)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(TeacherSession).filter(TeacherSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

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
    message: str
) -> Message:
    """Отправляет сообщение в сессию учителя и получает ответ"""
    # Проверяем существование сессии
    session = await get_teacher_session(db, user, session_id)

    # Сохраняем сообщение ученика в Message
    student_message = Message(
        user_id=user.id,
        chat_id=session.chat_id,
        role="student",
        message=message
    )
    db.add(student_message)

    # Получаем историю сообщений
    messages = db.query(Message).filter(Message.chat_id == session.chat_id).all()
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
        chat_id=session.chat_id,
        role="teacher",
        message=teacher_response
    )
    db.add(teacher_message)

    db.commit()
    db.refresh(teacher_message)
    return teacher_message

@router.post("/ask")
async def ask_teacher_advanced(
    request: dict,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_regular_user)
):
    """
    Продвинутый endpoint для режима учителя с параметрами topic и level
    """
    prompt = request.get("prompt")
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
        session = get_or_create_teacher_session(db, current_user.id, topic, level)
        session_id = session.id
    elif not session_id:
        # Если topic не определён и session_id не указан, создаём временную сессию
        session = await create_teacher_session(
            db, 
            current_user, 
            TeacherSessionCreate(
                user_id=current_user.id
            )
        )
        session_id = session.id
    
    # Отправляем сообщение и получаем ответ
    message = await send_teacher_message(
        db,
        current_user,
        session_id,
        prompt
    )
    
    return {
        "response": message.message,
        "session_id": session_id
    }

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

def get_or_create_teacher_session(db: Session, user_id: int, topic: str, level: str = None) -> TeacherSession:
    session = db.query(TeacherSession).filter(
        TeacherSession.user_id == user_id,
        TeacherSession.topic == topic
    ).first()
    if session:
        return session
    session = TeacherSession(user_id=user_id, topic=topic, level=level)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session 
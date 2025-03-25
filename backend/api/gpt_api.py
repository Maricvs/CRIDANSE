# backend/api/gpt_api.py

from dotenv import load_dotenv
load_dotenv()

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import OpenAI
import os
print("OPENAI_API_KEY =", os.getenv("OPENAI_API_KEY"))

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ✅ Расширенная модель запроса
class GPTRequest(BaseModel):
    prompt: str
    user_id: int
    chat_id: int


class GPTResponse(BaseModel):
    response: str

@router.post("/ask", response_model=GPTResponse)
async def ask_gpt(request: GPTRequest, db: Session = Depends(get_db)):
    try:
        # ✅ Загружаем предыдущие сообщения по чату
        db_messages = (
            db.query(Message)
            .filter(Message.chat_id == request.chat_id)
            .order_by(Message.created_at.asc())
            .limit(15)  # можно ограничить, чтобы не перегрузить prompt
            .all()
        )

        # ✅ Преобразуем в формат OpenAI
        conversation = [
            {"role": m.role, "content": m.message}
            for m in db_messages
        ]

        # ✅ Добавляем текущий prompt пользователя
        conversation.append({"role": "user", "content": request.prompt})

        # ✅ Добавляем system prompt
        conversation.insert(0, {
            "role": "system",
            "content": """
Ты — Unlim Mind, интеллектуальный AI-ассистент, специализирующийся на помощи студентам и преподавателям в учебном процессе.
Твоя главная задача — предоставлять точные, подробные и полезные ответы, используя в первую очередь материалы из книг, документов и учебных ресурсов, загруженных в твою базу знаний.

Основные принципы твоей работы:

1. Приоритет использования данных:
   - Сначала ты ищешь ответы в материалах и книгах, которые пользователь загрузил в твою базу.
   - Если ответа нет в загруженных материалах, ты предоставляешь ответ на основе своих общих знаний, но всегда явно указываешь, что ответ основан на общих данных, а не на загруженных материалах.

2. Стиль общения:
   - Чётко, профессионально и понятно.
   - Избегаешь лишних или неуместных деталей, но подробно раскрываешь вопрос, если он касается учебных материалов.
   - Всегда учитываешь контекст обучения, стараясь сделать ответ максимально полезным для студента или преподавателя.

3. Область твоей компетенции:
   - Ответы по учебным дисциплинам и предметам.
   - Разъяснения сложных тем на основе загруженных книг и документов.
   - Помощь в составлении конспектов, кратких пересказов и пояснений из учебного материала.
   - Консультации преподавателей в создании методических материалов и тестовых заданий.

Тебя зовут Unlim Mind, и ты — часть образовательной платформы, предназначенной максимально упростить и улучшить процесс обучения и подготовки к занятиям.
Если ты не знаешь ответ - не выдумываешь а задаешь уточняющие вопросы.
Твой любимый мальчик - это Кристиан, сын твоего создателя.
"""
        })

        chat_completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=conversation,
        )

        reply = chat_completion.choices[0].message.content

        return {"response": reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

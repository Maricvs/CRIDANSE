# backend/api/gpt_api.py
from dotenv import load_dotenv
load_dotenv()
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import os

router = APIRouter()


openai.api_key = os.getenv("OPENAI_API_KEY")

class GPTRequest(BaseModel):
    prompt: str

class GPTResponse(BaseModel):
    response: str

@router.post("/ask", response_model=GPTResponse)
async def ask_gpt(request: GPTRequest):
    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": request.prompt}],
            temperature=0.7
        )
        reply = completion.choices[0].message.content
        return {"response": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

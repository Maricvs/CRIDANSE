# backend/main.py

from fastapi import FastAPI
from backend.api import gpt_api

app = FastAPI()

# Подключаем роутер GPT
app.include_router(gpt_api.router, prefix="/api/gpt")

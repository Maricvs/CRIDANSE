# backend/main.py

from fastapi import FastAPI
from api import gpt_api, auth

app = FastAPI()

# Подключаем роутер GPT
app.include_router(gpt_api.router, prefix="/api/gpt")
app.include_router(auth.router, prefix="/api/auth")

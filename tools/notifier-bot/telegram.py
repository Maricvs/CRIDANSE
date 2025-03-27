import requests
import sys

# 🔧 Вставь сюда свой токен и chat_id
BOT_TOKEN = '7986127060:AAG1hFnHFHkCuWekVhBGGtHovQNunukz5Zo'
CHAT_ID = '-1002616934883'

def send_message(text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print("✅ Уведомление отправлено.")
    except requests.exceptions.RequestException as e:
        print("❌ Ошибка при отправке:", e)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❗️ Использование: python3 send_telegram.py 'текст сообщения'")
    else:
        send_message(" ".join(sys.argv[1:]))

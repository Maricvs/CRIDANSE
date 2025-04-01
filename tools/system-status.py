#!/usr/bin/env python3
import os
import sys
import subprocess
import requests
import json
from datetime import datetime

# Импортируем скрипт отправки Telegram-уведомлений
sys.path.append(os.path.join(os.path.dirname(__file__), 'notifier-bot'))
from telegram import send_message

def run_command(command):
    """Выполнить команду и вернуть результат"""
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
    stdout, stderr = process.communicate()
    return {
        'exit_code': process.returncode,
        'stdout': stdout.decode('utf-8', errors='ignore'),
        'stderr': stderr.decode('utf-8', errors='ignore')
    }

def check_service(service_name):
    """Проверить статус systemd-сервиса"""
    result = run_command(f"systemctl is-active {service_name}")
    return result['stdout'].strip() == 'active'

def check_url(url):
    """Проверить доступность URL"""
    try:
        response = requests.head(url, timeout=10)
        return response.status_code < 400  # 2xx или 3xx считаем успешными
    except requests.RequestException as e:
        print(f"Ошибка при проверке {url}: {e}")
        return False

def get_system_info():
    """Получить информацию о системе"""
    uptime = run_command("uptime")['stdout'].strip()
    disk = run_command("df -h / | tail -1")['stdout'].strip()
    memory = run_command("free -h | grep Mem")['stdout'].strip()
    load = run_command("cat /proc/loadavg")['stdout'].strip()
    
    return {
        'uptime': uptime,
        'disk': disk,
        'memory': memory,
        'load': load
    }

def check_all():
    """Проверить все компоненты системы"""
    status = {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'services': {
            'nginx': check_service('nginx'),
            'unlim-api': check_service('unlim-api')
        },
        'urls': {
            'frontend': check_url('https://unlim-mind.ai'),
            'admin': check_url('https://admin.unlim-mind.ai'),
            'api': check_url('https://unlim-mind.ai/api/health')
        },
        'system': get_system_info()
    }
    return status

def format_status_message(status):
    """Форматировать сообщение о статусе для Telegram"""
    message = f"📊 Статус системы ({status['timestamp']}):\n\n"
    
    # Статус сервисов
    message += "🔧 Сервисы:\n"
    for service, is_active in status['services'].items():
        icon = "✅" if is_active else "❌"
        message += f"{icon} {service}\n"
    
    # Статус URL
    message += "\n🌐 Доступность:\n"
    for url_name, is_available in status['urls'].items():
        icon = "✅" if is_available else "❌"
        message += f"{icon} {url_name}\n"
    
    # Информация о системе
    message += "\n💻 Система:\n"
    message += f"⏱️ Uptime: {status['system']['uptime']}\n"
    message += f"💾 Диск: {status['system']['disk']}\n"
    message += f"🧠 Память: {status['system']['memory']}\n"
    message += f"⚡ Нагрузка: {status['system']['load']}\n"
    
    return message

if __name__ == "__main__":
    status = check_all()
    
    # Вывод в терминал
    print(json.dumps(status, indent=2, default=str))
    
    # Форматируем и отправляем в Telegram
    message = format_status_message(status)
    send_message(message)
    
    # Проверяем, есть ли проблемы
    has_issues = (
        not all(status['services'].values()) or 
        not all(status['urls'].values())
    )
    
    # Возвращаем код ошибки, если есть проблемы
    sys.exit(1 if has_issues else 0) 
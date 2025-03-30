#!/bin/bash

# Остановка текущих процессов
pm2 stop all

# Переход в директорию проекта
cd /var/www/unlim-mind-ai

# Получение последних изменений
git pull origin main

# Установка зависимостей
cd frontend
npm install

# Запуск тестов
echo "Запуск тестов..."
npm run test:all
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ Тесты пройдены успешно"
else
    echo "❌ Тесты не пройдены"
    exit 1
fi

# Сборка проекта
npm run build

# Переход в корневую директорию
cd ..

# Запуск бэкенда
cd backend
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Запуск процессов через PM2
pm2 start ecosystem.config.js
pm2 save

echo "Деплой завершен успешно!" 
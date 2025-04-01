# Настройка админ-панели

## Установка зависимостей

Для корректной работы админ-панели выполните следующие команды:

```bash
cd admin
npm install
```

## Запуск в режиме разработки

После установки зависимостей запустите проект:

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут находиться в директории `build/`.

## Правильные версии зависимостей

В проекте используются следующие основные зависимости:

```json
"dependencies": {
  "@emotion/react": "^11.11.1",
  "@emotion/styled": "^11.11.0",
  "@mui/icons-material": "^5.14.18",
  "@mui/material": "^5.14.18",
  "@mui/x-data-grid": "^6.18.1",
  "axios": "^1.6.2",
  "chart.js": "^4.4.0",
  "react": "^18.2.0",
  "react-chartjs-2": "^5.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.18.0",
  "web-vitals": "^2.1.4"
},
"devDependencies": {
  "@types/react": "^18.2.55",
  "@types/react-dom": "^18.2.19",
  "@typescript-eslint/eslint-plugin": "^7.0.1",
  "@typescript-eslint/parser": "^7.0.1",
  "@vitejs/plugin-react": "^4.2.1",
  "eslint": "^8.56.0",
  "typescript": "^5.3.3",
  "vite": "^5.1.3"
}
```

## Решение проблем с типами

В проекте настроена специальная обработка типов для Material UI и React Router. Если возникают проблемы с типами, проверьте файл `/src/typings.d.ts`. 
# Unlim Mind AI

Интеллектуальная платформа Unlim Mind AI - ваш умный помощник в работе с искусственным интеллектом.

## Компоненты системы

- **Frontend**: Пользовательский интерфейс React + TypeScript
- **Backend**: FastAPI (Python)
- **Admin Panel**: Отдельное React-приложение для администрирования

## Установка и запуск проекта

### Требования

- Node.js (v14+)
- Python (v3.8+)
- PostgreSQL

### Backend

Установка и запуск бэкенда описаны в `setup_instructions_backend.md`.

### Frontend

Для запуска фронтенда выполните:

```bash
cd frontend
npm install
npm start
```

### Admin Panel

Для запуска админ-панели:

```bash
cd admin
npm install
npm start
```

Админ-панель будет доступна по адресу http://localhost:3000.

Для входа используйте:
- Логин: `admin`
- Пароль: `admin123`

### Деплой

Проект использует GitHub Actions для автоматического деплоя при пуше в ветку main.
Процесс деплоя включает:

1. Сборку и развертывание фронтенда
2. Сборку и развертывание админ-панели
3. Перезапуск необходимых сервисов
4. Мониторинг состояния всех компонентов
5. Отправку уведомлений о статусе в Telegram

Настройка деплоя админ-панели описана в файле `setup_admin_panel.md`.

## Возможности админ-панели

- **Дашборд**: Мониторинг активности и статистика
- **Пользователи**: Управление учетными записями
- **Чаты**: Просмотр и модерация чатов пользователей
- **Документы**: Управление загруженными файлами
- **Логи**: Просмотр системных логов и ошибок
- **Мультиязычность**: Управление переводами и локализацией
- **Настройки**: Конфигурация системы

## Документация

Дополнительная документация доступна в директории `docs/`.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})

Теперь вы сможете запустить бэкенд на 8000, админку на 3000 и фронтенд на 5173 одновременно! 
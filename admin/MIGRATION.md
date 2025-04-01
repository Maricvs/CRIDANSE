# Миграция с Create React App на Vite

В этом документе описаны шаги, выполненные для миграции проекта админ-панели с Create React App (react-scripts) на Vite, а также обновление основных библиотек до последних версий.

## Причины миграции

1. **Унификация с основным проектом**: теперь админ-панель использует ту же систему сборки (Vite), что и основное приложение
2. **Обновление React до версии 19**: переход на новую версию React с улучшенной производительностью и новыми возможностями
3. **Обновление React Router до версии 7**: использование современного API маршрутизации
4. **Ускорение разработки**: Vite обеспечивает более быструю сборку и разработку по сравнению с react-scripts

## Выполненные изменения

### 1. Обновление зависимостей

```diff
- "react": "^18.2.0",
- "react-dom": "^18.2.0",
- "react-router-dom": "^6.18.0",
- "react-scripts": "5.0.1",
+ "react": "^19.0.0",
+ "react-dom": "^19.0.0",
+ "react-router-dom": "^7.3.0",
+ "vite": "^6.2.3",
+ "@vitejs/plugin-react": "^4.3.4",
```

### 2. Обновление скриптов

```diff
"scripts": {
-  "start": "react-scripts start",
-  "build": "react-scripts build",
-  "test": "react-scripts test",
-  "eject": "react-scripts eject"
+  "dev": "vite",
+  "build": "tsc -b && vite build",
+  "lint": "eslint .",
+  "preview": "vite preview"
}
```

### 3. Конфигурация Vite

Создан файл `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    emptyOutDir: true,
  },
})
```

### 4. Обновление TypeScript

Созданы новые файлы конфигурации TypeScript:

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    // другие настройки
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 5. Обновление точки входа

Замена `index.tsx` на `main.tsx` с обновлённым API React Router v7:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/*',
    element: <App />
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
```

### 6. Добавление HTML-шаблона

Создан файл `index.html` в корне проекта:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Админ-панель Unlim Mind AI"
    />
    <title>Unlim Mind Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 7. Рефакторинг компонента App.tsx

Обновление для использования React Router v7:

```typescript
// Используем новые хуки и компоненты из React Router v7
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';

// Изменения структуры для работы с outlet и защищенным маршрутом
const Layout = () => {
  // ...
  return (
    // ...
    <Box sx={{ mt: 8 }}>
      <Outlet />
    </Box>
    // ...
  );
};

const ProtectedRoute = () => {
  // ...
  return <Layout />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        // ...
      </Route>
    </Routes>
  );
};
```

## Как запустить проект после миграции

### Разработка

```bash
npm install
npm run dev
```

### Сборка

```bash
npm run build
```

## Что делать при возникновении проблем

1. Проверьте версии библиотек в `package.json`
2. Убедитесь, что файл `vite.config.ts` корректно настроен
3. Проверьте структуру и импорты в `main.tsx`
4. Если возникают ошибки TypeScript:
   - Проверьте настройки в `tsconfig.json`
   - Обновите типы для новых версий библиотек
   - Выполните `npm install @types/react@latest @types/react-dom@latest` 
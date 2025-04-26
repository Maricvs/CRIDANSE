import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import axiosInstance from './services/axiosInstance'

// Инициализация axiosInstance уже происходит в самом файле
// Токен будет автоматически добавлен при создании инстанса

// Добавляем типизацию для глобального использования
declare global {
  interface Window {
    axiosInstance: typeof axiosInstance;
  }
}

// Делаем axiosInstance доступным глобально
window.axiosInstance = axiosInstance;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="541044049283-5dj1189l8nm3mq3o77ij41k79kb69kle.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Компоненты для админ-панели
import Dashboard from './components/Dashboard/Dashboard';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import UsersList from './components/Users/UsersList';
import ChatsList from './components/Chats/ChatsList';
import DocumentsList from './components/Documents/DocumentsList';
import SystemLogs from './components/Logs/SystemLogs';
import Settings from './components/Settings/Settings';
import Login from './components/Auth/Login';

// Стили
import './App.css';

// Создаем темы для светлого и темного режимов
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const App: React.FC = () => {
  // Состояние для аутентификации
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Состояние для выбора темы
  const [darkMode, setDarkMode] = useState<boolean>(false);
  // Состояние для открытия/закрытия боковой панели
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Функция для проверки авторизации
  const handleLogin = (username: string, password: string): boolean => {
    // В реальном приложении здесь будет запрос к API
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      return true;
    }
    return false;
  };

  // Функция для выхода
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  // Проверяем наличие авторизации при загрузке компонента
  React.useEffect(() => {
    const isAuth = localStorage.getItem('admin_authenticated') === 'true';
    setIsAuthenticated(isAuth);
  }, []);

  // Переключатель темы
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Переключатель сайдбара
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      {isAuthenticated ? (
        <Box sx={{ display: 'flex' }}>
          <Sidebar open={sidebarOpen} />
          <Box
            component="main"
            sx={{ 
              flexGrow: 1, 
              p: 3, 
              width: { sm: `calc(100% - ${sidebarOpen ? 240 : 60}px)` },
              ml: { sm: `${sidebarOpen ? 240 : 60}px` },
              transition: 'margin 0.2s ease-in-out, width 0.2s ease-in-out'
            }}
          >
            <Header 
              onToggleSidebar={toggleSidebar} 
              onToggleTheme={toggleTheme} 
              darkMode={darkMode}
              onLogout={handleLogout}
            />
            <Box sx={{ mt: 8 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UsersList />} />
                <Route path="/chats" element={<ChatsList />} />
                <Route path="/documents" element={<DocumentsList />} />
                <Route path="/logs" element={<SystemLogs />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </ThemeProvider>
  );
};

export default App; 
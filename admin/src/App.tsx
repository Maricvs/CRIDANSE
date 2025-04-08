import { useState } from 'react';
import { 
  Routes, 
  Route, 
  Navigate, 
  Outlet, 
  useLocation, 
  useNavigate 
} from 'react-router-dom';
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
//import SystemLogs from './components/Logs/SystemLogs';
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

// Компонент Layout для всех админ-страниц
const Layout = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const navigate = useNavigate();

  // Переключатель темы
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Переключатель сайдбара
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Функция для выхода
  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    navigate('/login');
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
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
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

// Защищенный маршрут
const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/chats" element={<ChatsList />} />
        <Route path="/documents" element={<DocumentsList />} />
       
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Функция для проверки авторизации
const handleLogin = (username: string, password: string): boolean => {
  // В реальном приложении здесь будет запрос к API
  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem('admin_authenticated', 'true');
    return true;
  }
  return false;
};

export default App;
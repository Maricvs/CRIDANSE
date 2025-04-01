import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Chat as ChatIcon,
  Description as DocumentsIcon,
  Error as LogsIcon,
  Settings as SettingsIcon,
  Translate as TranslateIcon,
  Dns as SystemIcon,
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
}

const drawerWidth = 240;
const closedDrawerWidth = 60;

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { title: 'Дашборд', path: '/', icon: <DashboardIcon /> },
    { title: 'Пользователи', path: '/users', icon: <UsersIcon /> },
    { title: 'Чаты', path: '/chats', icon: <ChatIcon /> },
    { title: 'Документы', path: '/documents', icon: <DocumentsIcon /> },
    { title: 'Логи системы', path: '/logs', icon: <LogsIcon /> },
    { title: 'Переводы', path: '/translations', icon: <TranslateIcon /> },
    { title: 'Мониторинг', path: '/monitoring', icon: <SystemIcon /> },
    { title: 'Настройки', path: '/settings', icon: <SettingsIcon /> },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : closedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : closedDrawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.2s ease-in-out',
        },
      }}
    >
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          px: open ? 2 : 0,
        }}
      >
        {open ? (
          <Box component="img" src="/logo.png" alt="Logo" sx={{ height: 40 }} />
        ) : (
          <Box component="img" src="/logo-mini.png" alt="Logo" sx={{ height: 30, width: 30 }} />
        )}
      </Box>
      <Divider />
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <Tooltip title={open ? '' : item.title} placement="right">
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: '0 20px 20px 0',
                  bgcolor: isActive(item.path) ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                  mr: 1,
                  '&:hover': {
                    bgcolor: isActive(item.path) ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  sx={{
                    opacity: open ? 1 : 0,
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 
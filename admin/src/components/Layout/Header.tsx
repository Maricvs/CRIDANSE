import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Settings,
  Logout,
} from '@mui/icons-material';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  darkMode: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onToggleTheme,
  darkMode,
  onLogout,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: darkMode ? '#1e1e1e' : '#fff',
        color: darkMode ? '#fff' : '#333',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Unlim Mind Admin
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Переключить тему">
            <IconButton color="inherit" onClick={onToggleTheme} sx={{ mr: 1 }}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Уведомления">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <NotificationsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Аккаунт">
            <IconButton
              onClick={handleClick}
              size="small"
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>A</Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          sx={{
            '& .MuiPaper-root': {
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              minWidth: 180,
            },
          }}
        >
          <MenuItem>
            <Avatar sx={{ width: 24, height: 24, mr: 1 }} /> Администратор
          </MenuItem>
          <Divider />
          <MenuItem>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Настройки
          </MenuItem>
          <MenuItem onClick={onLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Выйти
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
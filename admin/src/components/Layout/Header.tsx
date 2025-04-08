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
  MdMenu as MenuIcon,
  MdBrightness4 as DarkModeIcon,
  MdBrightness7 as LightModeIcon,
  MdNotifications as NotificationsIcon,
  MdSettings as SettingsIcon,
  MdExitToApp as LogoutIcon,
} from 'react-icons/md';

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
      style={{
        zIndex: 1200,
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
          style={{ marginRight: '16px' }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" style={{ flexGrow: 1 }}>
          Unlim Mind Admin
        </Typography>

        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Переключить тему">
            <IconButton color="inherit" onClick={onToggleTheme} style={{ marginRight: '8px' }}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Уведомления">
            <IconButton color="inherit" style={{ marginRight: '8px' }}>
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
              <Avatar style={{ width: 32, height: 32, backgroundColor: '#1976d2' }}>A</Avatar>
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
            <Avatar style={{ width: 24, height: 24, marginRight: '8px' }} /> Администратор
          </MenuItem>
          <Divider />
          <MenuItem>
            <ListItemIcon>
              <SettingsIcon size="1.2em" />
            </ListItemIcon>
            Настройки
          </MenuItem>
          <MenuItem onClick={onLogout}>
            <ListItemIcon>
              <LogoutIcon size="1.2em" />
            </ListItemIcon>
            Выйти
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
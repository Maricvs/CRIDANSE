import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Container,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  MdVisibility as VisibilityIcon,
  MdVisibilityOff as VisibilityOffIcon 
} from 'react-icons/md';
import { authService } from '../../services/auth';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Пожалуйста, введите имя пользователя и пароль');
      setIsLoading(false);
      return;
    }

    try {
      const success = await authService.login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Неверное имя пользователя или пароль');
      }
    } catch (err) {
      setError('Ошибка при входе в систему');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box className="login-page">
      <Container maxWidth="sm">
        <Paper elevation={3} className="login-form">
          <Typography variant="h4" align="center" gutterBottom>
            Unlim Mind Admin
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
            Войдите в панель администратора
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Имя пользователя"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              label="Пароль"
              variant="outlined"
              fullWidth
              margin="normal"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={toggleShowPassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOffIcon size="1.2em" /> : <VisibilityIcon size="1.2em" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 
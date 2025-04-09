import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  oauth_provider: string;
  created_at: string;
  avatar_url: string | null;
  is_admin: boolean;
  status: 'active' | 'inactive';
}

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => Promise<void>;
  user: User | null;
}

const UserDialog: React.FC<UserDialogProps> = ({ open, onClose, onSave, user }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    email: '',
    full_name: '',
    is_admin: false,
    status: 'active',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name || '',
        is_admin: user.is_admin,
        status: user.status,
      });
    } else {
      setFormData({
        email: '',
        full_name: '',
        is_admin: false,
        status: 'active',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_admin' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {user ? 'Редактировать пользователя' : 'Создать пользователя'}
        </DialogTitle>
        <DialogContent>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Имя"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_admin}
                  onChange={handleChange}
                  name="is_admin"
                  color="primary"
                />
              }
              label="Администратор"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.status === 'active'}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      status: e.target.checked ? 'active' : 'inactive',
                    }));
                  }}
                  name="status"
                  color="primary"
                />
              }
              label="Активен"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" color="primary">
            {user ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserDialog; 
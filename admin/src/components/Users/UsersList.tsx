import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

interface User {
  id: number;
  email: string;
  full_name: string;
  oauth_provider: string;
  created_at: string;
  avatar_url: string | null;
  is_admin: boolean;
  status: 'active' | 'inactive';
}

const UsersList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // В реальном приложении здесь будет запрос к API
      // Пока используем моковые данные
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUsers: User[] = [
        {
          id: 1,
          email: 'admin@example.com',
          full_name: 'Администратор Системы',
          oauth_provider: 'google',
          created_at: '2023-01-01T12:00:00Z',
          avatar_url: null,
          is_admin: true,
          status: 'active',
        },
        {
          id: 2,
          email: 'user1@example.com',
          full_name: 'Иван Петров',
          oauth_provider: 'google',
          created_at: '2023-01-15T10:30:00Z',
          avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
          is_admin: false,
          status: 'active',
        },
        {
          id: 3,
          email: 'user2@example.com',
          full_name: 'Анна Смирнова',
          oauth_provider: 'google',
          created_at: '2023-02-20T15:45:00Z',
          avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg',
          is_admin: false,
          status: 'active',
        },
        {
          id: 4,
          email: 'user3@example.com',
          full_name: 'Сергей Иванов',
          oauth_provider: 'google',
          created_at: '2023-03-10T09:15:00Z',
          avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg',
          is_admin: false,
          status: 'inactive',
        },
        {
          id: 5,
          email: 'editor@example.com',
          full_name: 'Екатерина Редакторова',
          oauth_provider: 'google',
          created_at: '2023-04-05T14:20:00Z',
          avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg',
          is_admin: true,
          status: 'active',
        },
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleToggleAdminFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoleFilter(event.target.checked ? 'admin' : 'all');
  };

  const handleToggleStatusFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(event.target.checked ? 'active' : 'all');
  };

  const handleEdit = (user: User) => {
    // TODO: Реализовать редактирование пользователя
    console.log('Edit user:', user);
  };

  const handleDelete = async (userId: number) => {
    try {
      // TODO: Реализовать удаление пользователя через API
      console.log('Delete user:', userId);
      // После успешного удаления обновляем список
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      // TODO: Показать уведомление об ошибке
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRoleFilter = roleFilter === 'all' || (roleFilter === 'admin' ? user.is_admin : true);
    const matchesStatusFilter = statusFilter === 'all' || (statusFilter === 'active' ? user.status === 'active' : true);
    
    return matchesSearch && matchesRoleFilter && matchesStatusFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Avatar
          src={params.row.avatar_url || '/default-avatar.png'}
          alt={params.row.full_name}
        />
      ),
    },
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'full_name', headerName: 'Имя', width: 200 },
    { field: 'email', headerName: 'Email', width: 220 },
    {
      field: 'oauth_provider',
      headerName: 'Провайдер',
      width: 130,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Chip
          label={params.value}
          color="primary"
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Дата регистрации',
      width: 200,
      valueFormatter: (params) => formatDate(params.value as string),
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 120,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Chip
          label={params.value === 'active' ? 'Активен' : 'Неактивен'}
          color={params.value === 'active' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'is_admin',
      headerName: 'Админ',
      width: 80,
      renderCell: (params: GridRenderCellParams<User>) => (
        params.value ? (
          <Tooltip title="Администратор">
            <AdminIcon color="primary" />
          </Tooltip>
        ) : null
      ),
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Пользователи
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Добавить пользователя">
            <IconButton color="primary" sx={{ mr: 1 }}>
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Обновить список">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Поиск пользователей..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: '300px' } }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={roleFilter === 'admin'}
                onChange={handleToggleAdminFilter}
                color="primary"
              />
            }
            label="Только администраторы"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={statusFilter === 'active'}
                onChange={handleToggleStatusFilter}
                color="primary"
              />
            }
            label="Только активные пользователи"
          />
        </Box>
      </Paper>

      <Paper sx={{ height: 500, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
              sorting: {
                sortModel: [{ field: 'id', sort: 'asc' }],
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
          />
        )}
      </Paper>
    </Box>
  );
};

export default UsersList; 
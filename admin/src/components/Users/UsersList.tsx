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
  MdRefresh as RefreshIcon,
  MdSearch as SearchIcon,
  MdPersonAdd as PersonAddIcon,
  MdEdit as EditIcon,
  MdDelete as DeleteIcon,
  MdSecurity as AdminIcon,
} from 'react-icons/md';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  oauth_provider: string;
  created_at: string;
  avatar_url: string | null;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users?search=${searchText}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchText]);

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params: GridRenderCellParams) => (
        <Avatar
          src={params.row.avatar_url || undefined}
          alt={params.row.full_name || params.row.email}
        >
          {(params.row.full_name || params.row.email).charAt(0).toUpperCase()}
        </Avatar>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'full_name',
      headerName: 'Имя',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => params.row.full_name || 'Не указано',
    },
    {
      field: 'oauth_provider',
      headerName: 'Провайдер',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'google' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Дата регистрации',
      width: 180,
      valueGetter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Удалить">
            <IconButton
              size="small"
              onClick={() => handleDeleteUser(params.row.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box style={{ padding: '24px' }}>
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Typography variant="h5" component="h1">
          Пользователи
        </Typography>
        <Box style={{ display: 'flex', gap: '16px' }}>
          <TextField
            size="small"
            placeholder="Поиск пользователей..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Обновить">
            <IconButton onClick={fetchUsers} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          loading={loading}
          components={{
            LoadingOverlay: () => (
              <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ),
          }}
        />
      </Paper>
    </Box>
  );
};

export default UsersList; 
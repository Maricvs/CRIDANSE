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
  MenuItem,
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
import UserDialog from './UserDialog';

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

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showOnlyAdmins, setShowOnlyAdmins] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/?search=${searchText}`);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      const url = selectedUser
        ? `${import.meta.env.VITE_API_URL}/api/users/${selectedUser.id}`
        : `${import.meta.env.VITE_API_URL}/api/users`;
      
      const response = await fetch(url, {
        method: selectedUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to save user');
      }

      setDialogOpen(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchText.toLowerCase()) ?? false);
    
    const matchesAdminFilter = !showOnlyAdmins || user.is_admin === true;
    const matchesStatusFilter = !showOnlyActive || user.status?.toLowerCase() === 'active';
    
    return matchesSearch && matchesAdminFilter && matchesStatusFilter;
  });

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
      field: 'status',
      headerName: 'Статус',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value === 'active' ? 'Активен' : 'Неактивен'}
          size="small"
          color={params.value === 'active' ? 'success' : 'error'}
        />
      ),
    },
    {
      field: 'is_admin',
      headerName: 'Админ',
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        params.value ? (
          <Tooltip title="Администратор">
            <AdminIcon size={20} color="primary" />
          </Tooltip>
        ) : null
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
          <Tooltip title="Редактировать">
            <IconButton
              size="small"
              onClick={() => handleEditUser(params.row)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
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
          <Tooltip title="Добавить пользователя">
            <IconButton onClick={handleAddUser} color="primary">
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Обновить">
            <IconButton onClick={fetchUsers} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper style={{ padding: '16px', marginBottom: '24px' }}>
        <Box style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <FormControlLabel
            control={
              <Switch
                checked={showOnlyAdmins}
                onChange={(e) => setShowOnlyAdmins(e.target.checked)}
                color="primary"
              />
            }
            label="Только администраторы"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
                color="primary"
              />
            }
            label="Только активные"
          />
        </Box>
      </Paper>

      <Paper style={{ height: 'calc(100vh - 300px)', width: '100%' }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
            sorting: {
              sortModel: [{ field: 'created_at', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
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

      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
      />
    </Box>
  );
};

export default UsersList;
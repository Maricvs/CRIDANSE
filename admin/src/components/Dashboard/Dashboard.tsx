import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Person as UserIcon,
  Chat as ChatIcon,
  Description as DocumentIcon,
  ErrorOutline as ErrorIcon,
  Speed as SpeedIcon,
  Memory as CPUIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

// Регистрируем компоненты для Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    chats: 0,
    documents: 0,
    errors: 0,
    cpu: 0,
    memory: 0,
    disk: 0,
  });

  // Временные данные для графиков
  const chartData = {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    datasets: [
      {
        label: 'Активные пользователи',
        data: [65, 59, 80, 81, 56, 55, 72],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Новые чаты',
        data: [28, 48, 40, 19, 86, 27, 90],
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const systemLoadData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Загрузка CPU (%)',
        data: [30, 35, 60, 70, 55, 80, 45],
        fill: false,
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1,
      },
      {
        label: 'Использование памяти (%)',
        data: [40, 45, 55, 65, 70, 75, 60],
        fill: false,
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  useEffect(() => {
    // Имитация загрузки данных с сервера
    const fetchData = async () => {
      setLoading(true);
      try {
        // Здесь будет запрос к API для получения статистики
        // Пока используем моковые данные
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStats({
          users: 1245,
          chats: 8761,
          documents: 526,
          errors: 12,
          cpu: 42,
          memory: 65,
          disk: 38,
        });
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = () => {
    // Обновление данных
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Панель мониторинга
        </Typography>
        <Tooltip title="Обновить данные">
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="dashboard-card">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Пользователи
                    </Typography>
                    <UserIcon color="primary" />
                  </Box>
                  <Typography variant="h4" component="div" className="stat-value">
                    {stats.users.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="dashboard-card">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Чаты
                    </Typography>
                    <ChatIcon color="primary" />
                  </Box>
                  <Typography variant="h4" component="div" className="stat-value">
                    {stats.chats.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="dashboard-card">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Документы
                    </Typography>
                    <DocumentIcon color="primary" />
                  </Box>
                  <Typography variant="h4" component="div" className="stat-value">
                    {stats.documents.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="dashboard-card">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Ошибки
                    </Typography>
                    <ErrorIcon color="error" />
                  </Box>
                  <Typography variant="h4" component="div" className="stat-value">
                    {stats.errors.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card className="dashboard-card" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Системные ресурсы
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CPUIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">CPU</Typography>
                      </Box>
                      <Typography variant="body2">{stats.cpu}%</Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, height: 8 }}>
                      <Box
                        sx={{
                          width: `${stats.cpu}%`,
                          bgcolor: stats.cpu > 80 ? 'error.main' : stats.cpu > 60 ? 'warning.main' : 'primary.main',
                          height: 8,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CPUIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">Память</Typography>
                      </Box>
                      <Typography variant="body2">{stats.memory}%</Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, height: 8 }}>
                      <Box
                        sx={{
                          width: `${stats.memory}%`,
                          bgcolor: stats.memory > 80 ? 'error.main' : stats.memory > 60 ? 'warning.main' : 'primary.main',
                          height: 8,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StorageIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">Диск</Typography>
                      </Box>
                      <Typography variant="body2">{stats.disk}%</Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, height: 8 }}>
                      <Box
                        sx={{
                          width: `${stats.disk}%`,
                          bgcolor: stats.disk > 80 ? 'error.main' : stats.disk > 60 ? 'warning.main' : 'primary.main',
                          height: 8,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card className="dashboard-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Активность пользователей
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box className="chart-container">
                    <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card className="dashboard-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Загрузка системы
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box className="chart-container">
                    <Line data={systemLoadData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard; 
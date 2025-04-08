import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  MdRefresh as RefreshIcon,
  MdPerson as UserIcon,
  MdChat as ChatIcon,
  MdDescription as DocumentIcon,
  MdErrorOutline as ErrorIcon,
  MdMemory as CPUIcon,
  MdStorage as StorageIcon,
} from 'react-icons/md';
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
    <Box style={{ padding: '16px' }}>
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Панель мониторинга
        </Typography>
        <Tooltip title="Обновить данные">
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon size="1.5em" />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} style={{ marginBottom: '32px' }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="dashboard-card">
                <CardContent>
                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Пользователи
                    </Typography>
                    <UserIcon size="1.5em" style={{ color: '#1976d2' }} />
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
                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Чаты
                    </Typography>
                    <ChatIcon size="1.5em" style={{ color: '#1976d2' }} />
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
                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Документы
                    </Typography>
                    <DocumentIcon size="1.5em" style={{ color: '#1976d2' }} />
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
                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Ошибки
                    </Typography>
                    <ErrorIcon size="1.5em" style={{ color: '#1976d2' }} />
                  </Box>
                  <Typography variant="h4" component="div" className="stat-value">
                    {stats.errors.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} style={{ marginBottom: '32px' }}>
            <Grid item xs={12} md={4}>
              <Card className="dashboard-card" style={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Системные ресурсы
                  </Typography>
                  <Divider style={{ marginBottom: '16px' }} />
                  
                  <Box style={{ marginBottom: '16px' }}>
                    <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <CPUIcon size="1.5em" style={{ color: '#1976d2', marginRight: '8px' }} />
                        <Typography variant="body2">CPU</Typography>
                      </Box>
                      <Typography variant="body2">{stats.cpu}%</Typography>
                    </Box>
                    <Box style={{ width: '100%', backgroundColor: '#f5f5f5', borderRadius: '4px', height: '8px' }}>
                      <Box
                        style={{
                          width: `${stats.cpu}%`,
                          backgroundColor: stats.cpu > 80 ? '#f44336' : stats.cpu > 60 ? '#ff9800' : '#1976d2',
                          height: '8px',
                          borderRadius: '4px',
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box style={{ marginBottom: '16px' }}>
                    <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <CPUIcon size="1.5em" style={{ color: '#1976d2', marginRight: '8px' }} />
                        <Typography variant="body2">Память</Typography>
                      </Box>
                      <Typography variant="body2">{stats.memory}%</Typography>
                    </Box>
                    <Box style={{ width: '100%', backgroundColor: '#f5f5f5', borderRadius: '4px', height: '8px' }}>
                      <Box
                        style={{
                          width: `${stats.memory}%`,
                          backgroundColor: stats.memory > 80 ? '#f44336' : stats.memory > 60 ? '#ff9800' : '#1976d2',
                          height: '8px',
                          borderRadius: '4px',
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box>
                    <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <StorageIcon size="1.5em" style={{ color: '#1976d2', marginRight: '8px' }} />
                        <Typography variant="body2">Диск</Typography>
                      </Box>
                      <Typography variant="body2">{stats.disk}%</Typography>
                    </Box>
                    <Box style={{ width: '100%', backgroundColor: '#f5f5f5', borderRadius: '4px', height: '8px' }}>
                      <Box
                        style={{
                          width: `${stats.disk}%`,
                          backgroundColor: stats.disk > 80 ? '#f44336' : stats.disk > 60 ? '#ff9800' : '#1976d2',
                          height: '8px',
                          borderRadius: '4px',
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
                  <Divider style={{ marginBottom: '16px' }} />
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
                  <Divider style={{ marginBottom: '16px' }} />
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